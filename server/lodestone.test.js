import { describe, expect, it } from 'vitest';
import {
  normalizeName,
  parseAchievementsPage,
  parseClassJobs,
  parseCollectionNames,
  parseSearch,
} from './lodestone.js';
import { findJobByLodestoneName, JOBS } from '../src/data/jobs';

describe('parseClassJobs', () => {
  it('lit le nom et le niveau, 0 pour un job non débloqué', () => {
    const html = `
      <ul class="character__job clearfix">
        <li><div class="character__job__level">-</div>
          <div class="character__job__name js__tooltip" data-tooltip="Gladiateur">Gladiateur</div></li>
        <li><div class="character__job__level">100</div>
          <div class="character__job__name js__tooltip" data-tooltip="Maître d&#39;hast">Maître d&#39;hast</div></li>
      </ul>`;
    expect(parseClassJobs(html)).toEqual([
      { name: 'Gladiateur', level: 0 },
      { name: "Maître d'hast", level: 100 },
    ]);
  });
});

describe('parseCollectionNames', () => {
  it('extrait les noms de la page mobile', () => {
    const html = `<ul><li><p class="mount__name">Grani</p></li><li><p class="mount__name">Chocobo de compagnie</p></li></ul>`;
    expect(parseCollectionNames(html, 'mount')).toEqual(['Grani', 'Chocobo de compagnie']);
  });
});

describe('parseAchievementsPage', () => {
  it('extrait les ID des succès et le nombre de pages', () => {
    const html = `<ul class="btn__pager"><li class="btn__pager__current">Page 1 / 29</li></ul>
      <a href="/lodestone/character/1/achievement/detail/3414/" class="entry__achievement"></a>
      <a href="/lodestone/character/1/achievement/detail/3353/" class="entry__achievement"></a>`;
    expect(parseAchievementsPage(html)).toEqual({ ids: [3414, 3353], totalPages: 29 });
  });
});

describe('parseSearch', () => {
  it('extrait id, nom et monde', () => {
    const html = `<a href="/lodestone/character/57754566/" class="entry__link">
      <div class="entry__chara__face"><img src="face.jpg"></div>
      <p class="entry__name">Juri Tonberry</p><p class="entry__world">Phoenix [Light]</p></a>`;
    expect(parseSearch(html)).toEqual([
      { id: '57754566', name: 'Juri Tonberry', world: 'Phoenix [Light]', avatar: 'face.jpg' },
    ]);
  });
});

describe('normalizeName', () => {
  it('ignore casse, apostrophes typographiques et mention de job restreint', () => {
    expect(normalizeName('Maître d’Hast')).toBe(normalizeName("maître d'hast"));
    expect(normalizeName('Mage bleu (Job restreint)')).toBe('mage bleu');
  });
});

describe('findJobByLodestoneName', () => {
  it('reconnaît le job, la classe de base et le format "Job / Classe"', () => {
    expect(findJobByLodestoneName('Gladiateur')?.key).toBe('pld');
    expect(findJobByLodestoneName('Paladin')?.key).toBe('pld');
    expect(findJobByLodestoneName('Paladin / Gladiateur')?.key).toBe('pld');
    expect(findJobByLodestoneName('Arcaniste')?.key).toBe('smn');
    expect(findJobByLodestoneName('Mage bleu (Job restreint)')?.key).toBe('blu');
  });

  it('couvre les 34 entrées de la page classes du Lodestone FR', () => {
    const lodestone = [
      'Gladiateur', 'Maraudeur', 'Chevalier noir', 'Pistosabreur', 'Élémentaliste', 'Érudit', 'Astromancien',
      'Sage', 'Pugiliste', "Maître d'hast", 'Surineur', 'Samouraï', 'Faucheur', 'Rôdeur vipère',
      'Dresseur (Job restreint)', 'Archer', 'Machiniste', 'Danseur', 'Occultiste', 'Arcaniste', 'Mage rouge',
      'Pictomancien', 'Mage bleu (Job restreint)', 'Menuisier', 'Forgeron', 'Armurier', 'Orfèvre', 'Tanneur',
      'Couturier', 'Alchimiste', 'Cuisinier', 'Mineur', 'Botaniste', 'Pêcheur',
    ];
    const keys = lodestone.map((n) => findJobByLodestoneName(n)?.key);
    expect(keys).not.toContain(undefined);
    expect(new Set(keys).size).toBe(JOBS.length);
  });
});
