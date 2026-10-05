import { useMemo } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import { buildRelicSeries, EXPANSIONS } from '../data/derived';
import { useOwnership, useTracker } from '../store';
import { useCollection } from '../useCollection';

const CATEGORY_LABELS: Record<string, string> = {
  weapons: 'Armes',
  tools: 'Outils (artisans / récolteurs)',
  ultimate: 'Armes ultimes',
};

export function Relics() {
  const { state, toggleCollected } = useTracker();
  const { items, error } = useCollection('relics');
  const ownership = useOwnership('relics');
  const series = useMemo(() => buildRelicSeries(items ?? []), [items]);

  if (error) return <p className="error">Impossible de charger les reliques : {error}</p>;
  if (!items) return <p>Chargement…</p>;

  const all = series.flatMap((s) => s.finals);
  const done = all.filter((i) => ownership(i) !== null).length;
  const sections = ['weapons', 'tools', 'ultimate'];

  return (
    <section>
      <h1>Reliques &amp; armes ultimes</h1>
      <ProgressBar value={done} max={all.length} />
      <p className="hint">
        Une case par arme finale et par job (les étapes intermédiaires sont ignorées). Cochées automatiquement quand le
        succès associé est obtenu ; certaines séries n'ont pas de succès et se cochent à la main.
      </p>
      {state.achievementsAvailable === false && (
        <p className="warning">Tes succès ne sont pas publics sur le Lodestone : coche à la main ou rends-les publics.</p>
      )}

      {sections.map((category) => (
        <div key={category}>
          <h2 className="section-title">{CATEGORY_LABELS[category]}</h2>
          {series
            .filter((s) => s.category === category)
            .map((s) => {
              const owned = s.finals.filter((i) => ownership(i) !== null).length;
              return (
                <details key={s.name} className="card relic-series">
                  <summary>
                    <span className="relic-series__title">
                      {s.name}
                      {s.expansion && <span className="tag">{EXPANSIONS[s.expansion]}</span>}
                    </span>
                    <span className="relic-series__bar">
                      <ProgressBar value={owned} max={s.finals.length} label={`${owned} / ${s.finals.length}`} />
                    </span>
                  </summary>
                  <ul className="collection-grid">
                    {s.finals.map((item) => {
                      const state = ownership(item);
                      return (
                        <li key={item.id}>
                          <label className={`collectible ${state ? 'collectible--owned' : ''}`}>
                            <input
                              type="checkbox"
                              checked={state !== null}
                              disabled={state === 'auto'}
                              onChange={() => toggleCollected('relics', item.id)}
                            />
                            {item.icon && <img src={item.icon} alt="" loading="lazy" width={40} height={40} />}
                            <div className="collectible__body">
                              <span className="collectible__name">
                                {item.name}
                                {state === 'auto' && <span className="tag tag--auto">auto</span>}
                              </span>
                              <span className="collectible__meta">
                                {item.owned && `${item.owned} des joueurs`}
                                {item.achievementId === null && ' · pas de succès associé'}
                              </span>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              );
            })}
        </div>
      ))}
    </section>
  );
}
