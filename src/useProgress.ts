import { useMemo } from 'react';
import type { CollectionKey } from './api';
import { JOBS } from './data/jobs';
import { buildRelicSeries, buildTribes } from './data/derived';
import { COLLECTION_PAGES } from './data/pages';
import { makeOwnership, useTracker } from './store';
import { useCollections } from './useCollection';

export type ProgressSection = 'Personnage' | 'Combat' | 'Collections' | 'Listes perso';

export interface CategoryProgress {
  id: string;
  section: ProgressSection;
  to: string;
  title: string;
  value: number;
  /** null tant que la liste n'est pas chargée. */
  max: number | null;
  /** false pour une catégorie qui recouvre les autres (compterait des éléments en double). */
  inGlobal?: boolean;
}

const COLLECTION_TILES: {
  id: keyof typeof COLLECTION_PAGES;
  section: ProgressSection;
  title?: string;
  inGlobal?: boolean;
}[] = [
  { id: 'story', section: 'Personnage' },
  { id: 'roleQuests', section: 'Personnage', title: 'Quêtes de rôle' },
  { id: 'content', section: 'Combat', title: 'Contenus' },
  // Tous les succès recouvrent histoire, quêtes de rôle, contenus, tribus… : affiché mais hors moyenne globale.
  { id: 'achievements', section: 'Combat', title: 'Succès', inGlobal: false },
  ...(
    [
      'mounts', 'minions', 'titles', 'cards', 'npcs', 'spells', 'orchestrions', 'emotes', 'hairstyles', 'fashions',
      'bardings', 'frames', 'survey_records', 'records', 'occult_records',
    ] as const
  ).map((id) => ({ id, section: 'Collections' as const })),
];

const KEYS: CollectionKey[] = [...new Set<CollectionKey>(['relics', ...COLLECTION_TILES.map((t) => COLLECTION_PAGES[t.id].key)])];

/** Progression de chaque catégorie suivie (hors hebdo/quotidien), dans l'ordre d'affichage de l'accueil. */
export function useProgress(): CategoryProgress[] {
  const { state } = useTracker();
  const collections = useCollections(KEYS);
  const { collected, achievements, jobs, ranks, lists } = state;

  return useMemo(() => {
    const owned = (key: CollectionKey) => makeOwnership({ collected, achievements }, key);
    const result: CategoryProgress[] = [];

    result.push({
      id: 'jobs',
      section: 'Personnage',
      to: '/classes',
      title: 'Classes au niveau max',
      value: JOBS.filter((j) => (jobs[j.key]?.level ?? 0) >= j.maxLevel).length,
      max: JOBS.length,
    });

    const achievementItems = collections.achievements;
    const tribes = achievementItems ? buildTribes(achievementItems) : [];
    const isAchieved = owned('achievements');
    result.push({
      id: 'tribes',
      section: 'Personnage',
      to: '/tribus',
      title: 'Tribus au rang max',
      value: tribes.filter((t) => isAchieved(t.ranks[t.ranks.length - 1].achievement) !== null).length,
      max: achievementItems ? tribes.length : null,
    });

    result.push({
      id: 'ranks',
      section: 'Personnage',
      to: '/rangs',
      title: 'Rangs au max',
      value: ranks.filter((r) => r.value >= r.max).length,
      max: ranks.length,
    });

    const relicItems = collections.relics;
    const finals = relicItems ? buildRelicSeries(relicItems).flatMap((s) => s.finals) : [];
    const isRelicOwned = owned('relics');
    result.push({
      id: 'relics',
      section: 'Combat',
      to: '/reliques',
      title: 'Reliques & ultimes',
      value: finals.filter((i) => isRelicOwned(i) !== null).length,
      max: relicItems ? finals.length : null,
    });

    for (const tile of COLLECTION_TILES) {
      const config = COLLECTION_PAGES[tile.id];
      const items = collections[config.key];
      const scoped = (items ?? []).filter(
        (i) => !config.groups || (i.group !== null && config.groups.includes(i.group)),
      );
      const isOwned = owned(config.key);
      result.push({
        id: tile.id,
        section: tile.section,
        to: config.path,
        title: tile.title ?? config.title,
        value: scoped.filter((i) => isOwned(i) !== null).length,
        max: items ? scoped.length : null,
        inGlobal: tile.inGlobal,
      });
    }

    for (const list of lists) {
      result.push({
        id: `list-${list.id}`,
        section: 'Listes perso',
        to: '/listes',
        title: list.name,
        value: list.items.filter((i) => i.done).length,
        max: list.items.length,
      });
    }

    return result;
  }, [collections, collected, achievements, jobs, ranks, lists]);
}

/**
 * Progression globale = moyenne des pourcentages de chaque catégorie (toutes pèsent pareil,
 * sinon les 4000 succès écraseraient tout le reste). Les catégories vides ou pas encore chargées sont ignorées.
 */
export function globalProgress(categories: CategoryProgress[]) {
  const included = categories.filter((c) => c.inGlobal !== false);
  const counted = included.filter((c): c is CategoryProgress & { max: number } => c.max !== null && c.max > 0);
  const percent = counted.length
    ? counted.reduce((sum, c) => sum + Math.min(1, c.value / c.max), 0) / counted.length * 100
    : 0;
  return { percent, counted: counted.length, pending: included.some((c) => c.max === null) };
}
