import { AlertTriangle, BookOpen, Bookmark, History, Timer } from 'lucide-react';
import { revisionCandidates, useInterviewData } from '../../hooks/useInterviewData';
import { ALL_QUESTIONS } from '../../data/interview/questions';
import { topicLabel } from '../../data/interview/topics';

/**
 * "Revise Last 3 Days" — surfaces questions from the previous three days that
 * were answered incorrectly, marked low-confidence, timed out, or saved for
 * revision. Prioritized by severity, not chronologically.
 */
export default function ReviseCard({ onStart }: { onStart: (count: number) => void }) {
  const { state } = useInterviewData();
  const candidates = revisionCandidates(state, ALL_QUESTIONS);

  const counts = {
    incorrect: candidates.filter((c) => c.reasons.includes('answered incorrectly')).length,
    lowConf: candidates.filter((c) => c.reasons.some((r) => r.startsWith('low confidence'))).length,
    timedOut: candidates.filter((c) => c.reasons.includes('timed out')).length,
    saved: candidates.filter((c) => c.reasons.includes('marked for revision')).length,
  };

  return (
    <div className="glass-strong rounded-2xl p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <History size={16} className="text-accent2" /> Revise Last 3 Days
        </p>
        <span className="badge border-accent2/40 bg-accent2/10 text-accent2">
          {candidates.length} question{candidates.length === 1 ? '' : 's'} ready
        </span>
      </div>

      {candidates.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Nothing queued yet. Questions you miss, time out on, or mark for revision in the next 3 days
          will automatically appear here.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <MiniStat icon={<AlertTriangle size={12} className="text-bad" />} label="Missed" value={counts.incorrect} />
            <MiniStat icon={<Timer size={12} className="text-warn" />} label="Timed out" value={counts.timedOut} />
            <MiniStat icon={<BookOpen size={12} className="text-accent" />} label="Low conf." value={counts.lowConf} />
            <MiniStat icon={<Bookmark size={12} className="text-accent2" />} label="Marked" value={counts.saved} />
          </div>
          <ul className="mt-3 max-h-40 space-y-1.5 overflow-y-auto pr-1">
            {candidates.slice(0, 6).map((c) => (
              <li key={c.question.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-elevated/50 px-3 py-2 text-xs">
                <span className="min-w-0 truncate">
                  <span className="font-semibold text-ink">{topicLabel(c.question.topic)}</span>
                  <span className="text-muted"> · {c.question.subTopic} · {c.reasons[0]}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">{c.question.difficulty}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <button type="button" className="btn-primary mt-4 w-full" disabled={candidates.length === 0} onClick={() => onStart(candidates.length)}>
        Start 3-Day Revision
      </button>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-elevated/50 px-2 py-2 text-center">
      <span className="mx-auto flex w-fit items-center">{icon}</span>
      <p className="mt-1 font-mono text-sm font-bold">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}
