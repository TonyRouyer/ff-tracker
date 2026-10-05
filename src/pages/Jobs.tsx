import { JOBS, ROLE_LABELS, type Role } from '../data/jobs';
import { ProgressBar } from '../components/ProgressBar';
import { useJobStats, useTracker } from '../store';

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export function Jobs() {
  const { state, setJobLevel, toggleJobMax } = useTracker();
  const stats = useJobStats();

  return (
    <section>
      <h1>Classes &amp; jobs</h1>
      <ProgressBar value={stats.done} max={stats.total} label={`${stats.done} / ${stats.total} au niveau max`} />
      <p className="hint">
        Coche une case pour marquer un job au niveau max, ou saisis le niveau. La synchro Lodestone (Accueil) remplit
        tout automatiquement.
      </p>

      {ROLES.map((role) => (
        <div key={role} className={`role-group role-group--${role}`}>
          <h2>{ROLE_LABELS[role]}</h2>
          <ul className="job-list">
            {JOBS.filter((j) => j.role === role).map((job) => {
              const level = state.jobs[job.key]?.level ?? 0;
              const done = level >= job.maxLevel;
              return (
                <li key={job.key} className={`job ${done ? 'job--done' : ''}`}>
                  <label className="job__check">
                    <input type="checkbox" checked={done} onChange={() => toggleJobMax(job.key, job.maxLevel)} />
                    <span className="job__name">
                      {job.name}
                      {job.limited && <span className="tag">Job restreint</span>}
                    </span>
                  </label>
                  <input
                    className="job__level"
                    type="number"
                    min={0}
                    max={job.maxLevel}
                    value={level}
                    aria-label={`Niveau ${job.name}`}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(job.maxLevel, Number(e.target.value) || 0));
                      setJobLevel(job.key, value);
                    }}
                  />
                  <div className="job__bar">
                    <ProgressBar value={level} max={job.maxLevel} label={`${level} / ${job.maxLevel}`} />
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
