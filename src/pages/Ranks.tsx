import { useState, type FormEvent } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import type { Rank } from '../data/ranks';
import { newId, useTracker } from '../store';

export function Ranks() {
  const { state, updateRanks } = useTracker();
  const [label, setLabel] = useState('');

  const update = (id: string, patch: Partial<Rank>) =>
    updateRanks((ranks) => ranks.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const add = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    updateRanks((ranks) => [...ranks, { id: newId(), label: trimmed, value: 0, max: 10 }]);
    setLabel('');
  };

  const done = state.ranks.filter((r) => r.value >= r.max).length;

  return (
    <section>
      <h1>Rangs</h1>
      <ProgressBar value={done} max={state.ranks.length} label={`${done} / ${state.ranks.length} au maximum`} />
      <p className="hint">
        Pas d'automatisation possible ici : saisis ton rang actuel. Les maximums sont modifiables (ils changent avec les
        patchs).
      </p>
      <ul className="job-list">
        {state.ranks.map((rank) => {
          const isMax = rank.value >= rank.max;
          return (
            <li key={rank.id} className={`job rank ${isMax ? 'job--done' : ''}`}>
              <label className="job__check">
                <input
                  type="checkbox"
                  checked={isMax}
                  onChange={() => update(rank.id, { value: isMax ? 0 : rank.max })}
                />
                <span className="job__name">{rank.label}</span>
              </label>
              <div className="rank__inputs">
                <input
                  type="number"
                  min={0}
                  max={rank.max}
                  value={rank.value}
                  aria-label={`Rang actuel ${rank.label}`}
                  onChange={(e) => update(rank.id, { value: Math.max(0, Math.min(rank.max, Number(e.target.value) || 0)) })}
                />
                <span>/</span>
                <input
                  type="number"
                  min={1}
                  value={rank.max}
                  aria-label={`Maximum ${rank.label}`}
                  onChange={(e) => update(rank.id, { max: Math.max(1, Number(e.target.value) || 1) })}
                />
                <button
                  type="button"
                  className="ghost danger small"
                  aria-label={`Supprimer ${rank.label}`}
                  onClick={() => updateRanks((ranks) => ranks.filter((r) => r.id !== rank.id))}
                >
                  ✕
                </button>
              </div>
              <div className="job__bar">
                <ProgressBar value={rank.value} max={rank.max} label={`${rank.value} / ${rank.max}`} />
              </div>
            </li>
          );
        })}
      </ul>
      <form className="inline-form" onSubmit={add}>
        <input placeholder="Ajouter un rang (ex. Diadème)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button type="submit">Ajouter</button>
      </form>
    </section>
  );
}
