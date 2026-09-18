import { Flame, Lock, Trophy } from 'lucide-react';
import { STREAK_MILESTONES } from '../../data/interview/types';
import { useInterviewData } from '../../hooks/useInterviewData';

const BADGE_ART: Record<number, { ring: string; face: string; glyph: string }> = {
  15: { ring: 'border-good/50', face: 'from-good/25 to-good/5 text-good', glyph: '▲' },
  30: { ring: 'border-accent2/50', face: 'from-accent2/25 to-accent2/5 text-accent2', glyph: '◆' },
  60: { ring: 'border-accent/50', face: 'from-accent/30 to-accent/5 text-accent', glyph: '★' },
  90: { ring: 'border-warn/50', face: 'from-warn/25 to-warn/5 text-warn', glyph: '✦' },
  120: { ring: 'border-bad/50', face: 'from-bad/25 to-bad/5 text-bad', glyph: '⬢' },
  150: { ring: 'border-accent2/60', face: 'from-accent2/30 via-accent/20 to-transparent text-accent2', glyph: '❖' },
  180: { ring: 'border-warn/60', face: 'from-warn/30 via-bad/20 to-transparent text-warn', glyph: '♛' },
};

/** Streak display, next-milestone progress and the badge shelf. */
export default function StreakPanel() {
  const { state } = useInterviewData();
  const { streak, badges } = state;
  const unlockedDays = new Set(badges.unlocked.map((b) => b.days));
  const nextMilestone = STREAK_MILESTONES.find((d) => d > streak.current) ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const pct = Math.min(100, Math.round((streak.current / nextMilestone) * 100));

  return (
    <div className="glass-strong rounded-2xl p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Flame size={16} className="text-warn" /> Interview Streak
        </p>
        <span className="badge border-line text-muted">{badges.unlocked.length}/{STREAK_MILESTONES.length} badges</span>
      </div>

      <div className="mt-4 flex items-end gap-6">
        <div>
          <p className="font-mono text-3xl font-extrabold text-warn">{streak.current}<span className="ml-1 text-sm font-semibold text-muted">days</span></p>
          <p className="mt-0.5 text-xs text-muted">current streak 🔥</p>
        </div>
        <div>
          <p className="font-mono text-xl font-bold text-accent">{streak.longest}</p>
          <p className="mt-0.5 text-xs text-muted">longest</p>
        </div>
      </div>

      {/* next badge progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted">Next badge → {nextMilestone} days</span>
          <span className="font-mono text-muted">{streak.current}/{nextMilestone}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-warn via-accent to-accent2 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* badge shelf */}
      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {STREAK_MILESTONES.map((days) => {
          const unlocked = unlockedDays.has(days);
          const art = BADGE_ART[days];
          return (
            <div
              key={days}
              title={unlocked ? `${days}-Day Interview Streak` : `${days}-Day Interview Streak — locked`}
              className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 ${unlocked ? art.ring : 'border-line opacity-45'}`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold ${
                  unlocked ? `border-transparent bg-gradient-to-br ${art.face} shadow-glow-sm` : 'border-line bg-elevated text-muted'
                }`}
              >
                {unlocked ? art.glyph : <Lock size={11} />}
              </span>
              <span className={`font-mono text-[9px] font-bold ${unlocked ? 'text-ink' : 'text-muted'}`}>{days}d</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        <Trophy size={11} className="text-warn" /> Complete a mock (3+ questions) each day to keep the streak alive.
      </p>
    </div>
  );
}
