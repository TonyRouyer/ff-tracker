// Collections FFXIV Collect exposées par l'API, et normalisation dans un format commun au front.

/** Clé côté app -> chemin de l'API FFXIV Collect. */
export const COLLECTIONS = {
  mounts: 'mounts',
  minions: 'minions',
  achievements: 'achievements',
  titles: 'titles',
  relics: 'relics',
  orchestrions: 'orchestrions',
  spells: 'spells',
  emotes: 'emotes',
  bardings: 'bardings',
  hairstyles: 'hairstyles',
  fashions: 'fashions',
  frames: 'frames',
  survey_records: 'survey_records',
  records: 'records',
  occult_records: 'occult_records',
  cards: 'triad/cards',
  npcs: 'triad/npcs',
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

/** Libellé de regroupement selon la collection (catégorie, emplacement, donjon…). */
function groupOf(type, r) {
  switch (type) {
    case 'achievements':
      return `${r.type?.name ?? '?'} › ${r.category?.name ?? '?'}`;
    case 'relics':
      return r.type?.name ?? null;
    case 'npcs':
      return r.location?.region ?? null;
    case 'cards':
      return r.type?.name ?? null;
    case 'spells':
      return r.aspect?.name ?? null;
    case 'survey_records':
      return r.dungeon ?? null;
    case 'records':
    case 'occult_records':
      return r.location ?? null;
    default:
      return r.category?.name ?? null;
  }
}

/** Informations courtes affichées sous le nom. */
function detailsOf(type, r) {
  switch (type) {
    case 'achievements':
      return r.description;
    case 'cards':
      return `${'★'.repeat(r.stars ?? 0)} ${r.number ?? ''}`.trim();
    case 'npcs':
      return r.location ? `${r.location.name} (${r.location.x}, ${r.location.y})` : null;
    case 'spells':
      return `N° ${r.order}${r.rank ? ` · rang ${r.rank}` : ''}`;
    case 'emotes':
      return r.command ?? null;
    default:
      return null;
  }
}

export function normalizeItem(type, r) {
  const item = {
    id: r.id,
    name: r.name,
    icon: r.icon ?? r.image ?? r.rewards?.icon ?? null,
    patch: r.patch ?? null,
    owned: r.owned ?? null,
    order: r.order ?? r.id,
    group: groupOf(type, r),
    details: detailsOf(type, r),
    sources: toArray(r.sources).map((s) => ({ type: s.type, text: s.text })),
    achievementId: r.achievement_id ?? r.achievement?.id ?? null,
  };
  if (type === 'achievements') {
    item.points = r.points;
    item.reward = r.reward ? `${r.reward.type} : ${r.reward.name ?? r.reward.title?.name ?? ''}`.trim() : null;
  }
  if (type === 'relics') {
    item.relic = {
      series: r.type?.name,
      category: r.type?.category,
      expansion: r.type?.expansion ?? null,
      jobs: r.type?.jobs,
      seriesOrder: r.type?.order,
    };
  }
  if (type === 'npcs' && r.quest) {
    item.sources.push({ type: 'Quête requise', text: r.quest.name });
  }
  return item;
}

export function normalizeCollection(type, results) {
  return results.map((r) => normalizeItem(type, r)).sort((a, b) => a.order - b.order);
}
