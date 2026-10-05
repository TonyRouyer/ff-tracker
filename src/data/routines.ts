export type ResetKind = 'daily' | 'weekly';

export interface Routine {
  id: string;
  label: string;
  reset: ResetKind;
  /** Date (ISO) à laquelle la tâche a été cochée ; elle est « faite » si c'est après le dernier reset. */
  doneAt: string | null;
}

// Resets serveurs FFXIV : quotidien à 15:00 UTC, hebdomadaire le mardi à 08:00 UTC.
const DAILY_RESET_UTC_HOUR = 15;
const WEEKLY_RESET_UTC_DAY = 2; // mardi
const WEEKLY_RESET_UTC_HOUR = 8;

export function lastReset(kind: ResetKind, now = new Date()): Date {
  const reset = new Date(now);
  if (kind === 'daily') {
    reset.setUTCHours(DAILY_RESET_UTC_HOUR, 0, 0, 0);
    if (reset > now) reset.setUTCDate(reset.getUTCDate() - 1);
    return reset;
  }
  reset.setUTCHours(WEEKLY_RESET_UTC_HOUR, 0, 0, 0);
  const daysSince = (reset.getUTCDay() - WEEKLY_RESET_UTC_DAY + 7) % 7;
  reset.setUTCDate(reset.getUTCDate() - daysSince);
  if (reset > now) reset.setUTCDate(reset.getUTCDate() - 7);
  return reset;
}

export function nextReset(kind: ResetKind, now = new Date()): Date {
  const reset = lastReset(kind, now);
  reset.setUTCDate(reset.getUTCDate() + (kind === 'daily' ? 1 : 7));
  return reset;
}

export function isRoutineDone(routine: Routine, now = new Date()): boolean {
  return routine.doneAt !== null && new Date(routine.doneAt) >= lastReset(routine.reset, now);
}

const DEFAULTS: [string, ResetKind][] = [
  ['Roulette Expert', 'daily'],
  ['Roulette Leveling', 'daily'],
  ['Roulette Défis de haut niveau', 'daily'],
  ['Roulette Alliance', 'daily'],
  ['Quêtes tribales (allocations du jour)', 'daily'],
  ['Mini Cactpot (3 tickets)', 'daily'],
  ['Livraisons de la Grande Compagnie', 'daily'],
  ["Livre d'aventurier (Wondrous Tails)", 'weekly'],
  ['Livraisons spéciales (clients)', 'weekly'],
  ['Butin du raid sadique', 'weekly'],
  ['Butin du raid en alliance', 'weekly'],
  ['Défilé de mode (Fashion Report)', 'weekly'],
  ['Jumbo Cactpot', 'weekly'],
  ['Contrats de chasse Élite', 'weekly'],
];

export function defaultRoutines(newId: () => string): Routine[] {
  return DEFAULTS.map(([label, reset]) => ({ id: newId(), label, reset, doneAt: null }));
}
