import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CharacterSummary, CollectionItem, CollectionKey, SyncResult } from './api';
import { findJobByLodestoneName, JOBS } from './data/jobs';
import { defaultRanks, type Rank } from './data/ranks';
import { defaultRoutines, type Routine } from './data/routines';

export interface ListItem {
  id: string;
  label: string;
  done: boolean;
}

export interface CustomList {
  id: string;
  name: string;
  items: ListItem[];
}

export interface JobProgress {
  level: number;
  /** Niveau avant d'avoir coché « niveau max », pour pouvoir décocher sans perdre l'info. */
  previousLevel?: number;
}

export interface TrackerState {
  version: 2;
  character: CharacterSummary | null;
  lastSync: string | null;
  jobs: Record<string, JobProgress>;
  /** Éléments cochés à la main (ou importés du Lodestone pour montures/mascottes), par collection. */
  collected: Partial<Record<CollectionKey, number[]>>;
  /** Succès obtenus d'après la dernière synchro Lodestone. */
  achievements: number[];
  achievementsAvailable: boolean | null;
  unmatched: { mounts: string[]; minions: string[] };
  lists: CustomList[];
  ranks: Rank[];
  routines: Routine[];
}

const STORAGE_KEY = 'ff-tracker:v1';

export const newId = () => crypto.randomUUID();

function initialState(): TrackerState {
  return {
    version: 2,
    character: null,
    lastSync: null,
    jobs: {},
    collected: {},
    achievements: [],
    achievementsAvailable: null,
    unmatched: { mounts: [], minions: [] },
    lists: [],
    ranks: defaultRanks(newId),
    routines: defaultRoutines(newId),
  };
}

/** Accepte une sauvegarde v1 (montures/mascottes à la racine) ou v2. */
export function migrate(raw: Record<string, unknown>): TrackerState {
  const base = initialState();
  if (raw.version === 2) return { ...base, ...(raw as Partial<TrackerState>) };
  if (raw.version === 1) {
    const v1 = raw as { mounts?: number[]; minions?: number[] } & Partial<TrackerState>;
    return {
      ...base,
      character: v1.character ?? null,
      lastSync: v1.lastSync ?? null,
      jobs: v1.jobs ?? {},
      lists: v1.lists ?? [],
      unmatched: v1.unmatched ?? base.unmatched,
      collected: { mounts: v1.mounts ?? [], minions: v1.minions ?? [] },
    };
  }
  throw new Error('format de sauvegarde inconnu');
}

function loadState(): TrackerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    // Stockage indisponible ou corrompu : on repart d'un état vide.
  }
  return initialState();
}

function useTrackerState() {
  const [state, setState] = useState<TrackerState>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignoré : l'app reste utilisable sans persistance.
    }
  }, [state]);

  const setJobLevel = useCallback((key: string, level: number) => {
    setState((s) => ({ ...s, jobs: { ...s.jobs, [key]: { level } } }));
  }, []);

  const toggleJobMax = useCallback((key: string, maxLevel: number) => {
    setState((s) => {
      const current = s.jobs[key] ?? { level: 0 };
      const next: JobProgress =
        current.level >= maxLevel
          ? { level: current.previousLevel ?? 0 }
          : { level: maxLevel, previousLevel: current.level };
      return { ...s, jobs: { ...s.jobs, [key]: next } };
    });
  }, []);

  const toggleCollected = useCallback((key: CollectionKey, id: number) => {
    setState((s) => {
      const owned = s.collected[key] ?? [];
      const next = owned.includes(id) ? owned.filter((x) => x !== id) : [...owned, id];
      return { ...s, collected: { ...s.collected, [key]: next } };
    });
  }, []);

  const setCharacter = useCallback((character: CharacterSummary | null) => {
    setState((s) => ({ ...s, character }));
  }, []);

  /**
   * Fusionne une synchro Lodestone : niveaux écrasés, montures/mascottes uniquement complétées
   * (jamais décochées), succès remplacés si la page est accessible.
   */
  const applySync = useCallback((sync: SyncResult) => {
    setState((s) => {
      const jobs = { ...s.jobs };
      for (const { name, level } of sync.jobs) {
        const job = findJobByLodestoneName(name);
        if (job) jobs[job.key] = { level };
      }
      const merge = (key: 'mounts' | 'minions') => [...new Set([...(s.collected[key] ?? []), ...sync[key].ids])];
      return {
        ...s,
        character: sync.profile,
        lastSync: sync.syncedAt,
        jobs,
        collected: { ...s.collected, mounts: merge('mounts'), minions: merge('minions') },
        achievements: sync.achievements.available ? sync.achievements.ids : s.achievements,
        achievementsAvailable: sync.achievements.available,
        unmatched: { mounts: sync.mounts.unmatched, minions: sync.minions.unmatched },
      };
    });
  }, []);

  const updateLists = useCallback((update: (lists: CustomList[]) => CustomList[]) => {
    setState((s) => ({ ...s, lists: update(s.lists) }));
  }, []);

  const updateRanks = useCallback((update: (ranks: Rank[]) => Rank[]) => {
    setState((s) => ({ ...s, ranks: update(s.ranks) }));
  }, []);

  const updateRoutines = useCallback((update: (routines: Routine[]) => Routine[]) => {
    setState((s) => ({ ...s, routines: update(s.routines) }));
  }, []);

  const replaceState = useCallback((next: TrackerState) => {
    setState(next);
  }, []);

  return {
    state,
    setJobLevel,
    toggleJobMax,
    toggleCollected,
    setCharacter,
    applySync,
    updateLists,
    updateRanks,
    updateRoutines,
    replaceState,
  };
}

type TrackerContextValue = ReturnType<typeof useTrackerState>;

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ children }: { children: ReactNode }) {
  const value = useTrackerState();
  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker doit être utilisé dans <TrackerProvider>');
  return ctx;
}

export function useJobStats() {
  const { state } = useTracker();
  return useMemo(() => {
    const done = JOBS.filter((j) => (state.jobs[j.key]?.level ?? 0) >= j.maxLevel).length;
    return { done, total: JOBS.length };
  }, [state.jobs]);
}

export type Ownership = 'manual' | 'auto' | null;

/**
 * Indique si un élément est obtenu : « auto » s'il vient d'un succès synchronisé (non décochable),
 * « manual » s'il a été coché à la main (ou importé pour montures/mascottes).
 */
export function makeOwnership(state: Pick<TrackerState, 'collected' | 'achievements'>, key: CollectionKey) {
  const manual = new Set(state.collected[key] ?? []);
  const synced = new Set(state.achievements);
  const manualAchievements = new Set(state.collected.achievements ?? []);
  return (item: CollectionItem): Ownership => {
    if (key === 'achievements' && synced.has(item.id)) return 'auto';
    if (item.achievementId !== null && synced.has(item.achievementId)) return 'auto';
    if (manual.has(item.id)) return 'manual';
    if (item.achievementId !== null && manualAchievements.has(item.achievementId)) return 'manual';
    return null;
  };
}

export function useOwnership(key: CollectionKey) {
  const { collected, achievements } = useTracker().state;
  return useMemo(() => makeOwnership({ collected, achievements }, key), [collected, achievements, key]);
}
