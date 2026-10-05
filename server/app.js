// API Express : utilisée telle quelle en local (server/index.js) et comme fonction Vercel (api/index.js).
import express from 'express';
import { COLLECTIONS, normalizeCollection } from './collections.js';
import {
  normalizeName,
  parseAchievementsPage,
  parseClassJobs,
  parseCollectionNames,
  parseProfile,
  parseSearch,
} from './lodestone.js';

const LODESTONE = 'https://fr.finalfantasyxiv.com/lodestone';
const COLLECT = 'https://ffxivcollect.com/api';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
// La version mobile du Lodestone affiche les noms des montures/mascottes directement dans la liste.
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const COLLECTION_TTL_MS = 12 * 60 * 60 * 1000;
// Le Lodestone coupe les connexions si on le sollicite trop : pages de succès récupérées 3 par 3.
const ACHIEVEMENT_CONCURRENCY = 3;

const FETCH_TIMEOUT_MS = 30_000;

async function fetchText(url, userAgent = DESKTOP_UA) {
  const res = await fetch(url, {
    headers: { 'User-Agent': userAgent, 'Accept-Language': 'fr' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = new Error(`${url} -> HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.text();
}

// On met en cache la promesse : des requêtes simultanées pour la même collection partagent un seul appel.
const collectionCache = new Map();

function getCollection(type) {
  const cached = collectionCache.get(type);
  if (cached && Date.now() - cached.at < COLLECTION_TTL_MS) return cached.items;
  const items = fetchText(`${COLLECT}/${COLLECTIONS[type]}?language=fr`).then((text) =>
    normalizeCollection(type, JSON.parse(text).results),
  );
  collectionCache.set(type, { at: Date.now(), items });
  items.catch(() => {
    if (collectionCache.get(type)?.items === items) collectionCache.delete(type);
  });
  return items;
}

/** Les pages montures/mascottes renvoient 404 si la collection est vide ou privée : on renvoie null. */
async function fetchOptional(url, userAgent) {
  try {
    return await fetchText(url, userAgent);
  } catch (err) {
    if (err.status === 404 || err.status === 403) return null;
    throw err;
  }
}

function matchOwned(items, ownedNames) {
  const byName = new Map(items.map((i) => [normalizeName(i.name), i.id]));
  const ids = [];
  const unmatched = [];
  for (const name of ownedNames) {
    const id = byName.get(normalizeName(name));
    if (id === undefined) unmatched.push(name);
    else ids.push(id);
  }
  return { ids, unmatched };
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function fetchWithRetry(url) {
  try {
    return await fetchText(url);
  } catch {
    await new Promise((r) => setTimeout(r, 1500));
    return fetchText(url);
  }
}

/**
 * Succès obtenus, toutes pages confondues. Renvoie null si la page est privée ou inaccessible
 * (le Lodestone répond 403, ou coupe carrément la connexion selon les personnages).
 */
async function fetchAchievements(base) {
  let first;
  try {
    first = parseAchievementsPage(await fetchWithRetry(`${base}/achievement/`));
  } catch {
    return null;
  }
  const pages = Array.from({ length: first.totalPages - 1 }, (_, i) => i + 2);
  const rest = await mapLimit(pages, ACHIEVEMENT_CONCURRENCY, async (page) =>
    parseAchievementsPage(await fetchWithRetry(`${base}/achievement/?page=${page}`)).ids,
  );
  return [...new Set([...first.ids, ...rest.flat()])];
}

const app = express();

app.get('/api/collections/:type', async (req, res, next) => {
  try {
    if (!Object.hasOwn(COLLECTIONS, req.params.type)) return res.status(404).json({ error: 'Collection inconnue' });
    const items = await getCollection(req.params.type);
    // Les listes ne changent qu'aux patchs : mises en cache 12 h par le CDN (Vercel), resservies pendant la revalidation.
    res.set('Cache-Control', 'public, s-maxage=43200, stale-while-revalidate=86400');
    res.json(items);
  } catch (err) {
    next(err);
  }
});

app.get('/api/characters/search', async (req, res, next) => {
  try {
    const name = String(req.query.name ?? '').trim();
    const world = String(req.query.world ?? '').trim();
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const params = new URLSearchParams({ q: name, worldname: world });
    res.json(parseSearch(await fetchText(`${LODESTONE}/character/?${params}`)));
  } catch (err) {
    next(err);
  }
});

app.get('/api/characters/:id/sync', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'ID Lodestone invalide' });
    const base = `${LODESTONE}/character/${id}`;
    const [profileHtml, jobsHtml, mountsHtml, minionsHtml, mounts, minions] = await Promise.all([
      fetchText(`${base}/`),
      fetchText(`${base}/class_job/`),
      fetchOptional(`${base}/mount/`, MOBILE_UA),
      fetchOptional(`${base}/minion/`, MOBILE_UA),
      getCollection('mounts'),
      getCollection('minions'),
    ]);
    // Après les autres pages, pour ne pas multiplier les requêtes simultanées vers le Lodestone.
    const achievements = await fetchAchievements(base);
    const owned = (items, html, kind) =>
      html === null
        ? { ids: [], unmatched: [], available: false }
        : { ...matchOwned(items, parseCollectionNames(html, kind)), available: true };
    res.json({
      profile: { id, ...parseProfile(profileHtml) },
      jobs: parseClassJobs(jobsHtml),
      mounts: owned(mounts, mountsHtml, 'mount'),
      minions: owned(minions, minionsHtml, 'minion'),
      achievements: { ids: achievements ?? [], available: achievements !== null },
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Route inconnue' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status === 404 ? 404 : 502;
  res.status(status).json({
    error: status === 404 ? 'Personnage introuvable sur le Lodestone' : `Erreur de récupération : ${err.message}`,
  });
});

/** Précharge toutes les collections, 3 par 3, pour que les pages s'affichent tout de suite. */
export function preloadCollections() {
  return mapLimit(Object.keys(COLLECTIONS), 3, (type) => getCollection(type).catch(() => null));
}

export default app;
