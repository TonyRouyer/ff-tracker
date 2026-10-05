import { describe, expect, it } from 'vitest';
import type { CollectionItem } from './api';
import { buildRelicSeries, buildTribes } from './data/derived';
import { isRoutineDone, lastReset, nextReset } from './data/routines';
import { migrate } from './store';
import { globalProgress } from './useProgress';

const item = (overrides: Partial<CollectionItem>): CollectionItem => ({
  id: 0,
  name: '',
  icon: null,
  patch: null,
  owned: null,
  order: 0,
  group: null,
  details: null,
  sources: [],
  achievementId: null,
  ...overrides,
});

describe('resets', () => {
  it('reset quotidien à 15:00 UTC', () => {
    expect(lastReset('daily', new Date('2026-10-05T14:59:00Z')).toISOString()).toBe('2026-10-04T15:00:00.000Z');
    expect(lastReset('daily', new Date('2026-10-05T15:00:00Z')).toISOString()).toBe('2026-10-05T15:00:00.000Z');
    expect(nextReset('daily', new Date('2026-10-05T16:00:00Z')).toISOString()).toBe('2026-10-06T15:00:00.000Z');
  });

  it('reset hebdo le mardi à 08:00 UTC', () => {
    // 2026-10-06 est un mardi.
    expect(lastReset('weekly', new Date('2026-10-06T07:59:00Z')).toISOString()).toBe('2026-09-29T08:00:00.000Z');
    expect(lastReset('weekly', new Date('2026-10-06T08:00:00Z')).toISOString()).toBe('2026-10-06T08:00:00.000Z');
    expect(lastReset('weekly', new Date('2026-10-11T20:00:00Z')).toISOString()).toBe('2026-10-06T08:00:00.000Z');
  });

  it('une tâche cochée avant le reset redevient à faire', () => {
    const routine = { id: '1', label: 'x', reset: 'daily' as const, doneAt: '2026-10-05T14:00:00Z' };
    expect(isRoutineDone(routine, new Date('2026-10-05T14:30:00Z'))).toBe(true);
    expect(isRoutineDone(routine, new Date('2026-10-05T15:01:00Z'))).toBe(false);
  });
});

describe('globalProgress', () => {
  const cat = (value: number, max: number | null) => ({ id: '', section: 'Collections' as const, to: '', title: '', value, max });

  it('fait la moyenne des pourcentages, chaque catégorie pesant autant', () => {
    // 100 % de 34 classes et 0 % de 4000 succès => 50 %, pas ~0,8 %.
    expect(globalProgress([cat(34, 34), cat(0, 4000)]).percent).toBe(50);
  });

  it('exclut les catégories marquées hors moyenne', () => {
    expect(globalProgress([cat(1, 1), { ...cat(0, 4000), inGlobal: false }])).toMatchObject({ percent: 100, counted: 1 });
  });

  it('ignore les catégories vides ou pas encore chargées', () => {
    const result = globalProgress([cat(1, 2), cat(0, 0), cat(0, null)]);
    expect(result.percent).toBe(50);
    expect(result.counted).toBe(1);
    expect(result.pending).toBe(true);
  });
});

describe('migrate', () => {
  it('convertit une sauvegarde v1 en v2 sans perdre les montures/mascottes', () => {
    const state = migrate({ version: 1, mounts: [1, 2], minions: [3], jobs: { pld: { level: 100 } }, lists: [] });
    expect(state.version).toBe(2);
    expect(state.collected).toEqual({ mounts: [1, 2], minions: [3] });
    expect(state.jobs.pld.level).toBe(100);
    expect(state.routines.length).toBeGreaterThan(0);
  });

  it('refuse un format inconnu', () => {
    expect(() => migrate({ foo: 1 })).toThrow();
  });
});

describe('buildTribes', () => {
  const group = 'Quêtes › Quêtes des peuples alliés';
  it('regroupe les paliers par tribu et garde le rang max en dernier', () => {
    const tribes = buildTribes([
      item({ id: 1, group, patch: '3.1', details: 'Atteindre le rang 7 (Assermenté) de réputation auprès des Vanu Vanu d\'Ok\' Gundu Nakki.' }),
      item({ id: 2, group, patch: '3.1', details: 'Atteindre le rang 1 (Neutre) de réputation auprès des Vanu Vanu d\'Ok\' Gundu Nakki.' }),
      item({ id: 3, group, patch: '2.2', details: 'Atteindre le rang 4 (Estimé) de réputation auprès du Frai de Novv.' }),
      item({ id: 4, group, patch: '2.2', details: 'Accomplir la quête “X”.' }),
    ]);
    expect(tribes.map((t) => t.name)).toEqual(['Frai de Novv', "Vanu Vanu d'Ok' Gundu Nakki"]);
    expect(tribes[1].ranks.map((r) => r.rank)).toEqual([1, 7]);
    expect(tribes[0].expansion).toBe(2);
  });
});

describe('buildRelicSeries', () => {
  const relic = (id: number, order: number, series: string, jobs: number, category = 'weapons') =>
    item({ id, order, relic: { series, category, expansion: 2, jobs, seriesOrder: 1 } });

  it("ne garde que l'étape finale de chaque job", () => {
    const series = buildRelicSeries([
      relic(1, 1, 'Armes antiques', 2),
      relic(2, 2, 'Armes antiques', 2),
      relic(3, 3, 'Armes antiques', 2),
      relic(4, 4, 'Armes antiques', 2),
      relic(5, 1, 'Armes des donjons sans fond', 1),
      relic(6, 1, 'Armure GARO', 1, 'garo'),
    ]);
    expect(series).toHaveLength(1);
    expect(series[0].finals.map((i) => i.id)).toEqual([3, 4]);
  });
});
