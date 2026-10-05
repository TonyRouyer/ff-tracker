import type { CollectionKey } from '../api';

/** Page « liste à cocher » générée à partir d'une collection FFXIV Collect. */
export interface CollectionPageConfig {
  path: string;
  title: string;
  key: CollectionKey;
  description?: string;
  /** Limite la page à certains groupes (utile pour découper les succès en thèmes). */
  groups?: string[];
}

export const COLLECTION_PAGES: Record<string, CollectionPageConfig> = {
  story: {
    path: '/histoire',
    title: 'Histoire principale',
    key: 'achievements',
    groups: ['Quêtes › Épopée'],
    description: "Succès de l'épopée : cochés automatiquement si tes succès Lodestone sont publics.",
  },
  roleQuests: {
    path: '/quetes-role',
    title: 'Quêtes de job & de rôle',
    key: 'achievements',
    groups: ['Quêtes › Quêtes de job/rôle'],
  },
  content: {
    path: '/contenus',
    title: 'Contenus (donjons, raids, défis)',
    key: 'achievements',
    groups: ['Combats › Donjons', 'Combats › Raids', 'Combats › Défis', 'Exploration › Instances'],
    description: 'Donjons, raids, défis extrêmes/fatals et donjons profonds, via les succès.',
  },
  achievements: { path: '/succes', title: 'Tous les succès', key: 'achievements' },
  mounts: { path: '/montures', title: 'Montures', key: 'mounts' },
  minions: { path: '/mascottes', title: 'Mascottes', key: 'minions' },
  titles: { path: '/titres', title: 'Titres', key: 'titles', description: 'Cochés automatiquement via les succès.' },
  cards: { path: '/triple-triade/cartes', title: 'Triple Triade – Cartes', key: 'cards' },
  npcs: { path: '/triple-triade/adversaires', title: 'Triple Triade – Adversaires vaincus', key: 'npcs' },
  spells: { path: '/mage-bleu', title: 'Mage bleu – Sorts', key: 'spells' },
  orchestrions: { path: '/orchestrions', title: 'Orchestrions', key: 'orchestrions' },
  emotes: { path: '/emotes', title: 'Emotes', key: 'emotes' },
  hairstyles: { path: '/coiffures', title: 'Coiffures', key: 'hairstyles' },
  fashions: { path: '/accessoires', title: 'Accessoires de mode', key: 'fashions' },
  bardings: { path: '/bardes', title: 'Bardes de chocobo', key: 'bardings' },
  frames: { path: '/cadres', title: 'Cadres de portrait', key: 'frames' },
  survey_records: { path: '/archives-variables', title: 'Archives des donjons variables', key: 'survey_records' },
  records: { path: '/archives-bozja', title: 'Archives de Bozja', key: 'records' },
  occult_records: { path: '/archives-croissant', title: 'Archives du Croissant occulte', key: 'occult_records' },
};

export interface NavSection {
  title: string;
  links: { to: string; label: string }[];
}

const page = (id: keyof typeof COLLECTION_PAGES, label?: string) => ({
  to: COLLECTION_PAGES[id].path,
  label: label ?? COLLECTION_PAGES[id].title,
});

export const NAV: NavSection[] = [
  {
    title: '',
    links: [
      { to: '/', label: 'Accueil' },
      { to: '/routine', label: 'Hebdo & quotidien' },
    ],
  },
  {
    title: 'Personnage',
    links: [
      { to: '/classes', label: 'Classes' },
      { to: '/tribus', label: 'Tribus' },
      page('story'),
      page('roleQuests', 'Quêtes de rôle'),
      { to: '/rangs', label: 'Rangs' },
    ],
  },
  {
    title: 'Combat',
    links: [{ to: '/reliques', label: 'Reliques & ultimes' }, page('content', 'Contenus')],
  },
  {
    title: 'Collections',
    links: [
      page('mounts'),
      page('minions'),
      page('titles'),
      page('cards', 'Triple Triade – Cartes'),
      page('npcs', 'Triple Triade – PNJ'),
      page('spells', 'Mage bleu'),
      page('orchestrions'),
      page('emotes'),
      page('hairstyles'),
      page('fashions', 'Accessoires'),
      page('bardings', 'Bardes'),
      page('frames', 'Cadres'),
      page('survey_records', 'Archives variables'),
      page('records', 'Archives Bozja'),
      page('occult_records', 'Archives Croissant'),
    ],
  },
  {
    title: 'Autres',
    links: [page('achievements', 'Succès'), { to: '/listes', label: 'Listes perso' }],
  },
];
