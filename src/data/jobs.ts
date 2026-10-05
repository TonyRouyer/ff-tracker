export type Role = 'tank' | 'healer' | 'melee' | 'ranged' | 'caster' | 'crafter' | 'gatherer';

export interface Job {
  key: string;
  /** Nom du job (ou de la classe si pas de job) tel qu'affiché sur le Lodestone FR. */
  name: string;
  /** Nom de la classe de base, affiché par le Lodestone tant que le job n'est pas débloqué. */
  baseName?: string;
  role: Role;
  maxLevel: number;
  limited?: boolean;
}

export const ROLE_LABELS: Record<Role, string> = {
  tank: 'Tanks',
  healer: 'Soigneurs',
  melee: 'DPS mêlée',
  ranged: 'DPS distance physique',
  caster: 'DPS distance magique',
  crafter: 'Artisans',
  gatherer: 'Récolteurs',
};

export const MAX_LEVEL = 100;

export const JOBS: Job[] = [
  { key: 'pld', name: 'Paladin', baseName: 'Gladiateur', role: 'tank', maxLevel: MAX_LEVEL },
  { key: 'war', name: 'Guerrier', baseName: 'Maraudeur', role: 'tank', maxLevel: MAX_LEVEL },
  { key: 'drk', name: 'Chevalier noir', role: 'tank', maxLevel: MAX_LEVEL },
  { key: 'gnb', name: 'Pistosabreur', role: 'tank', maxLevel: MAX_LEVEL },

  { key: 'whm', name: 'Mage blanc', baseName: 'Élémentaliste', role: 'healer', maxLevel: MAX_LEVEL },
  { key: 'sch', name: 'Érudit', role: 'healer', maxLevel: MAX_LEVEL },
  { key: 'ast', name: 'Astromancien', role: 'healer', maxLevel: MAX_LEVEL },
  { key: 'sge', name: 'Sage', role: 'healer', maxLevel: MAX_LEVEL },

  { key: 'mnk', name: 'Moine', baseName: 'Pugiliste', role: 'melee', maxLevel: MAX_LEVEL },
  { key: 'drg', name: 'Chevalier dragon', baseName: "Maître d'hast", role: 'melee', maxLevel: MAX_LEVEL },
  { key: 'nin', name: 'Ninja', baseName: 'Surineur', role: 'melee', maxLevel: MAX_LEVEL },
  { key: 'sam', name: 'Samouraï', role: 'melee', maxLevel: MAX_LEVEL },
  { key: 'rpr', name: 'Faucheur', role: 'melee', maxLevel: MAX_LEVEL },
  { key: 'vpr', name: 'Rôdeur vipère', role: 'melee', maxLevel: MAX_LEVEL },
  { key: 'bst', name: 'Dresseur', role: 'melee', maxLevel: MAX_LEVEL, limited: true },

  { key: 'brd', name: 'Barde', baseName: 'Archer', role: 'ranged', maxLevel: MAX_LEVEL },
  { key: 'mch', name: 'Machiniste', role: 'ranged', maxLevel: MAX_LEVEL },
  { key: 'dnc', name: 'Danseur', role: 'ranged', maxLevel: MAX_LEVEL },

  { key: 'blm', name: 'Mage noir', baseName: 'Occultiste', role: 'caster', maxLevel: MAX_LEVEL },
  { key: 'smn', name: 'Invocateur', baseName: 'Arcaniste', role: 'caster', maxLevel: MAX_LEVEL },
  { key: 'rdm', name: 'Mage rouge', role: 'caster', maxLevel: MAX_LEVEL },
  { key: 'pct', name: 'Pictomancien', role: 'caster', maxLevel: MAX_LEVEL },
  { key: 'blu', name: 'Mage bleu', role: 'caster', maxLevel: 80, limited: true },

  { key: 'crp', name: 'Menuisier', role: 'crafter', maxLevel: MAX_LEVEL },
  { key: 'bsm', name: 'Forgeron', role: 'crafter', maxLevel: MAX_LEVEL },
  { key: 'arm', name: 'Armurier', role: 'crafter', maxLevel: MAX_LEVEL },
  { key: 'gsm', name: 'Orfèvre', role: 'crafter', maxLevel: MAX_LEVEL },
  { key: 'ltw', name: 'Tanneur', role: 'crafter', maxLevel: MAX_LEVEL },
  { key: 'wvr', name: 'Couturier', role: 'crafter', maxLevel: MAX_LEVEL },
  { key: 'alc', name: 'Alchimiste', role: 'crafter', maxLevel: MAX_LEVEL },
  { key: 'cul', name: 'Cuisinier', role: 'crafter', maxLevel: MAX_LEVEL },

  { key: 'min', name: 'Mineur', role: 'gatherer', maxLevel: MAX_LEVEL },
  { key: 'btn', name: 'Botaniste', role: 'gatherer', maxLevel: MAX_LEVEL },
  { key: 'fsh', name: 'Pêcheur', role: 'gatherer', maxLevel: MAX_LEVEL },
];

function normalize(name: string) {
  return name
    .replace(/[’‘`]/g, "'")
    .replace(/\s*\(job restreint\)\s*$/i, '')
    .trim()
    .toLowerCase();
}

/** Retrouve le job correspondant à un nom du Lodestone ("Paladin", "Gladiateur", "Paladin / Gladiateur"…). */
export function findJobByLodestoneName(lodestoneName: string): Job | undefined {
  const candidates = lodestoneName.split('/').map(normalize);
  return JOBS.find((job) =>
    candidates.some((c) => c === normalize(job.name) || (job.baseName && c === normalize(job.baseName))),
  );
}
