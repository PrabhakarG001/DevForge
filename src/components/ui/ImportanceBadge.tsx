import { AlertTriangle } from 'lucide-react';
import type { Importance } from '../../types';

const meta: Record<Importance, { label: string; className: string; pulse: boolean } | null> = {
  'very-important': {
    label: 'VERY IMPORTANT',
    className: 'border-warn/60 bg-warn/10 text-warn shadow-glow-sm',
    pulse: true,
  },
  important: {
    label: 'IMPORTANT',
    className: 'border-accent/50 bg-accent/10 text-accent',
    pulse: false,
  },
  standard: null,
};

/** Glowing "VERY IMPORTANT" / "IMPORTANT" badge. Renders nothing for standard topics. */
export default function ImportanceBadge({ level, size = 'sm' }: { level: Importance; size?: 'sm' | 'md' }) {
  const m = meta[level];
  if (!m) return null;
  return (
    <span
      className={`badge ${m.className} ${size === 'md' ? 'px-3 py-1 text-xs' : ''} ${m.pulse ? 'animate-pulse-soft' : ''}`}
    >
      <AlertTriangle size={size === 'md' ? 13 : 11} aria-hidden />
      {m.label}
    </span>
  );
}
