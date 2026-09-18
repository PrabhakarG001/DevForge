interface ProgressRingProps {
  pct: number;
  size?: number;
  stroke?: number;
  label?: string;
}

/** Small SVG progress ring used on cards and dashboards. */
export default function ProgressRing({ pct, size = 44, stroke = 4, label }: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--c-border))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--c-accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums">{clamped}%</span>
    </div>
  );
}
