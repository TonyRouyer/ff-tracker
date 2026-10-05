export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="progress__fill" style={{ width: `${pct}%` }} />
      <span className="progress__label">{label ?? `${value} / ${max} (${pct} %)`}</span>
    </div>
  );
}
