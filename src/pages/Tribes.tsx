import { useMemo } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import { buildTribes, EXPANSIONS } from '../data/derived';
import { useOwnership, useTracker } from '../store';
import { useCollection } from '../useCollection';

export function Tribes() {
  const { state, toggleCollected } = useTracker();
  const { items, error } = useCollection('achievements');
  const ownership = useOwnership('achievements');
  const tribes = useMemo(() => buildTribes(items ?? []), [items]);

  if (error) return <p className="error">Impossible de charger les succès : {error}</p>;
  if (!items) return <p>Chargement…</p>;

  const maxed = tribes.filter((t) => ownership(t.ranks[t.ranks.length - 1].achievement) !== null).length;
  const expansions = [...new Set(tribes.map((t) => t.expansion))];

  return (
    <section>
      <h1>Tribus (peuples alliés)</h1>
      <ProgressBar value={maxed} max={tribes.length} label={`${maxed} / ${tribes.length} au rang max`} />
      <p className="hint">
        Une case par tribu = son succès de rang le plus élevé. Cochées automatiquement via tes succès Lodestone ; tu
        peux aussi cocher à la main.
      </p>
      {state.achievementsAvailable === false && (
        <p className="warning">Tes succès ne sont pas publics sur le Lodestone : coche à la main ou rends-les publics.</p>
      )}

      {expansions.map((exp) => (
        <div key={exp ?? 'other'} className="role-group">
          <h2>{exp ? EXPANSIONS[exp] : 'Autres'}</h2>
          <ul className="job-list">
            {tribes
              .filter((t) => t.expansion === exp)
              .map((tribe) => {
                const top = tribe.ranks[tribe.ranks.length - 1];
                const topOwned = ownership(top.achievement);
                const reached = [...tribe.ranks].reverse().find((r) => ownership(r.achievement) !== null);
                return (
                  <li key={tribe.name} className={`job ${topOwned ? 'job--done' : ''}`}>
                    <label className="job__check">
                      <input
                        type="checkbox"
                        checked={topOwned !== null}
                        disabled={topOwned === 'auto'}
                        onChange={() => toggleCollected('achievements', top.achievement.id)}
                      />
                      <span className="job__name">
                        {tribe.name}
                        {topOwned === 'auto' && <span className="tag tag--auto">auto</span>}
                      </span>
                    </label>
                    <span className="hint">rang {top.rank}</span>
                    <div className="job__bar">
                      <ProgressBar
                        value={reached?.rank ?? 0}
                        max={top.rank}
                        label={reached ? `${reached.rankName} (${reached.rank}/${top.rank})` : 'Aucun palier'}
                      />
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </section>
  );
}
