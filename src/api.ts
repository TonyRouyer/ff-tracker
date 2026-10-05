export type CollectionKey =
  | 'mounts'
  | 'minions'
  | 'achievements'
  | 'titles'
  | 'relics'
  | 'orchestrions'
  | 'spells'
  | 'emotes'
  | 'bardings'
  | 'hairstyles'
  | 'fashions'
  | 'frames'
  | 'survey_records'
  | 'records'
  | 'occult_records'
  | 'cards'
  | 'npcs';

export interface CollectionItem {
  id: number;
  name: string;
  icon: string | null;
  patch: string | null;
  owned: string | null;
  order: number;
  group: string | null;
  details: string | null;
  sources: { type: string; text: string }[];
  /** Succès qui débloque l'élément : coché automatiquement si ce succès est obtenu. */
  achievementId: number | null;
  points?: number;
  reward?: string | null;
  relic?: {
    series: string;
    category: string;
    expansion: number | null;
    jobs: number;
    seriesOrder: number;
  };
}

export interface CharacterSummary {
  id: string;
  name: string;
  world: string;
  avatar: string | null;
}

export interface OwnedSync {
  ids: number[];
  unmatched: string[];
  /** false si la page Lodestone est vide ou privée. */
  available: boolean;
}

export interface SyncResult {
  profile: CharacterSummary;
  jobs: { name: string; level: number }[];
  mounts: OwnedSync;
  minions: OwnedSync;
  achievements: { ids: number[]; available: boolean };
  syncedAt: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Erreur HTTP ${res.status}`);
  return body as T;
}

export const api = {
  collection: (key: CollectionKey) => getJson<CollectionItem[]>(`/api/collections/${key}`),
  search: (name: string, world: string) =>
    getJson<CharacterSummary[]>(`/api/characters/search?${new URLSearchParams({ name, world })}`),
  sync: (id: string) => getJson<SyncResult>(`/api/characters/${encodeURIComponent(id)}/sync`),
};
