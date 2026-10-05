export interface Rank {
  id: string;
  label: string;
  value: number;
  max: number;
}

// Maximums modifiables dans l'app : ils évoluent avec les patchs.
const DEFAULTS: [string, number][] = [
  ['Grande Compagnie', 11],
  ['Île sauvage', 20],
  ['Eurêka – niveau élémentaire', 60],
  ['Bozja – rang de résistance', 25],
  ['Croissant occulte – niveau de connaissance', 20],
  ['JcJ – rang de série', 25],
];

export function defaultRanks(newId: () => string): Rank[] {
  return DEFAULTS.map(([label, max]) => ({ id: newId(), label, value: 0, max }));
}
