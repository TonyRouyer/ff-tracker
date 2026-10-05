import { useEffect, useState, type FormEvent } from 'react';
import { ProgressBar } from '../components/ProgressBar';
import { isRoutineDone, nextReset, type ResetKind } from '../data/routines';
import { newId, useTracker } from '../store';

const SECTIONS: { kind: ResetKind; title: string }[] = [
  { kind: 'daily', title: 'Quotidien' },
  { kind: 'weekly', title: 'Hebdomadaire' },
];

function formatCountdown(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days ? `${days} j ` : ''}${hours} h ${String(minutes).padStart(2, '0')}`;
}

export function Routines() {
  const { state, updateRoutines } = useTracker();
  const [now, setNow] = useState(() => new Date());
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<ResetKind>('daily');

  // Rafraîchit le compte à rebours et décoche visuellement les tâches au moment du reset.
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const toggle = (id: string) =>
    updateRoutines((routines) =>
      routines.map((r) => (r.id === id ? { ...r, doneAt: isRoutineDone(r) ? null : new Date().toISOString() } : r)),
    );

  const add = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    updateRoutines((routines) => [...routines, { id: newId(), label: trimmed, reset: kind, doneAt: null }]);
    setLabel('');
  };

  return (
    <section>
      <h1>Hebdo &amp; quotidien</h1>
      <p className="hint">
        Les cases se décochent toutes seules au reset : quotidien à 17 h (heure de Paris en été, 16 h en hiver),
        hebdomadaire le mardi à 10 h (9 h en hiver).
      </p>
      <div className="routine-columns">
        {SECTIONS.map(({ kind: sectionKind, title }) => {
          const routines = state.routines.filter((r) => r.reset === sectionKind);
          const done = routines.filter((r) => isRoutineDone(r, now)).length;
          const reset = nextReset(sectionKind, now);
          return (
            <div key={sectionKind} className="card">
              <h2>{title}</h2>
              <p className="hint">
                Prochain reset dans {formatCountdown(reset.getTime() - now.getTime())} (
                {reset.toLocaleString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })})
              </p>
              <ProgressBar value={done} max={routines.length} />
              <ul className="checklist">
                {routines.map((r) => {
                  const isDone = isRoutineDone(r, now);
                  return (
                    <li key={r.id} className={isDone ? 'checklist__item--done' : ''}>
                      <label>
                        <input type="checkbox" checked={isDone} onChange={() => toggle(r.id)} />
                        {r.label}
                      </label>
                      <button
                        type="button"
                        className="ghost danger small"
                        aria-label={`Retirer ${r.label}`}
                        onClick={() => updateRoutines((list) => list.filter((x) => x.id !== r.id))}
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <form className="inline-form" onSubmit={add}>
        <input placeholder="Nouvelle tâche" value={label} onChange={(e) => setLabel(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value as ResetKind)}>
          <option value="daily">Quotidienne</option>
          <option value="weekly">Hebdomadaire</option>
        </select>
        <button type="submit">Ajouter</button>
      </form>
    </section>
  );
}
