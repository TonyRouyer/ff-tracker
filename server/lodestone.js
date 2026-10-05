// Parseurs HTML du Lodestone (version française). Fonctions pures, testables sans réseau.
import * as cheerio from 'cheerio';

/** Normalise un nom pour comparer Lodestone et FFXIV Collect (casse, apostrophes, espaces). */
export function normalizeName(name) {
  return name
    .normalize('NFC')
    .replace(/[’‘`]/g, "'")
    .replace(/\s*\(job restreint\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Page /character/{id}/ : nom, monde, portrait. */
export function parseProfile(html) {
  const $ = cheerio.load(html);
  return {
    name: $('.frame__chara__name').first().text().trim(),
    world: $('.frame__chara__world').first().text().trim(),
    avatar: $('.frame__chara__face img').first().attr('src') ?? null,
  };
}

/** Page /character/{id}/class_job/ : liste { name, level } (level 0 si non débloqué). */
export function parseClassJobs(html) {
  const $ = cheerio.load(html);
  const jobs = [];
  $('.character__job li').each((_, li) => {
    const name = $(li).find('.character__job__name').attr('data-tooltip')
      ?? $(li).find('.character__job__name').text();
    const levelText = $(li).find('.character__job__level').text().trim();
    const level = Number.parseInt(levelText, 10);
    if (name) jobs.push({ name: name.trim(), level: Number.isNaN(level) ? 0 : level });
  });
  return jobs;
}

/** Pages mobiles /character/{id}/mount/ et /minion/ : noms des éléments possédés. */
export function parseCollectionNames(html, kind) {
  const $ = cheerio.load(html);
  return $(`.${kind}__name`).map((_, el) => $(el).text().trim()).get().filter(Boolean);
}

/** Page /character/{id}/achievement/?page=N : ID des succès obtenus et nombre total de pages. */
export function parseAchievementsPage(html) {
  const $ = cheerio.load(html);
  const ids = $('a.entry__achievement')
    .map((_, a) => $(a).attr('href')?.match(/\/achievement\/detail\/(\d+)\//)?.[1])
    .get()
    .filter(Boolean)
    .map(Number);
  const pager = $('.btn__pager__current').first().text().match(/(\d+)\s*\/\s*(\d+)/);
  return { ids, totalPages: pager ? Number(pager[2]) : 1 };
}

/** Page de recherche /character/?q=…&worldname=… : résultats { id, name, world, avatar }. */
export function parseSearch(html) {
  const $ = cheerio.load(html);
  const results = [];
  $('.entry__link').each((_, a) => {
    const href = $(a).attr('href') ?? '';
    const match = href.match(/\/character\/(\d+)\//);
    if (!match) return;
    results.push({
      id: match[1],
      name: $(a).find('.entry__name').text().trim(),
      world: $(a).find('.entry__world').text().trim(),
      avatar: $(a).find('.entry__chara__face img').attr('src') ?? null,
    });
  });
  return results;
}
