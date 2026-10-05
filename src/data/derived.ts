import type { CollectionItem } from '../api';

export const EXPANSIONS: Record<number, string> = {
  2: 'A Realm Reborn',
  3: 'Heavensward',
  4: 'Stormblood',
  5: 'Shadowbringers',
  6: 'Endwalker',
  7: 'Dawntrail',
};

export function expansionOfPatch(patch: string | null): number | null {
  const major = patch ? Number.parseInt(patch, 10) : Number.NaN;
  return Number.isNaN(major) ? null : major;
}

export interface TribeRank {
  rank: number;
  rankName: string;
  achievement: CollectionItem;
}

export interface Tribe {
  name: string;
  expansion: number | null;
  /** Succès de rang triés du plus bas au plus haut ; le dernier correspond au rang max. */
  ranks: TribeRank[];
}

const TRIBE_GROUP = 'Quêtes › Quêtes des peuples alliés';
const RANK_RE = /rang (\d+) \(([^)]+)\) de réputation auprès (?:des |du |de la |de l'|d')(.+?)\.?$/;

/** Reconstitue les tribus et leurs paliers à partir des succès « Atteindre le rang N … auprès des X ». */
export function buildTribes(achievements: CollectionItem[]): Tribe[] {
  const byName = new Map<string, Tribe>();
  for (const achievement of achievements) {
    if (achievement.group !== TRIBE_GROUP) continue;
    const match = achievement.details?.match(RANK_RE);
    if (!match) continue;
    const [, rank, rankName, rawName] = match;
    const cleaned = rawName.replace(/­/g, ''); // césures invisibles dans certains noms
    const name = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    let tribe = byName.get(name);
    if (!tribe) {
      tribe = { name, expansion: expansionOfPatch(achievement.patch), ranks: [] };
      byName.set(name, tribe);
    }
    tribe.ranks.push({ rank: Number(rank), rankName, achievement });
  }
  const tribes = [...byName.values()];
  for (const t of tribes) t.ranks.sort((a, b) => a.rank - b.rank);
  return tribes.sort(
    (a, b) => (a.expansion ?? 99) - (b.expansion ?? 99) || a.ranks[0].achievement.order - b.ranks[0].achievement.order,
  );
}

export interface RelicSeries {
  name: string;
  category: string;
  expansion: number | null;
  /** Une entrée par job : l'étape finale de la série. */
  finals: CollectionItem[];
}

// Ce ne sont pas des reliques à proprement parler : ignorées.
const EXCLUDED_SERIES = new Set(['Armes des donjons sans fond']);
const KEPT_CATEGORIES = new Set(['weapons', 'tools', 'ultimate']);

/**
 * Pour chaque série de reliques, garde uniquement l'arme finale de chaque job.
 * FFXIV Collect trie les éléments étape par étape (tous les jobs de l'étape 1, puis l'étape 2…) :
 * les `jobs` derniers éléments de la série sont donc les armes finales.
 */
export function buildRelicSeries(relics: CollectionItem[]): RelicSeries[] {
  const bySeries = new Map<string, CollectionItem[]>();
  for (const item of relics) {
    const r = item.relic;
    if (!r || !KEPT_CATEGORIES.has(r.category) || EXCLUDED_SERIES.has(r.series)) continue;
    const list = bySeries.get(r.series) ?? [];
    list.push(item);
    bySeries.set(r.series, list);
  }
  return [...bySeries.values()]
    .map((items) => {
      const { series, category, expansion, jobs } = items[0].relic!;
      const sorted = [...items].sort((a, b) => a.order - b.order);
      return { name: series, category, expansion, finals: sorted.slice(-jobs), seriesOrder: items[0].relic!.seriesOrder };
    })
    .sort((a, b) => (a.expansion ?? 99) - (b.expansion ?? 99) || a.seriesOrder - b.seriesOrder)
    .map(({ seriesOrder: _ignored, ...rest }) => rest);
}
