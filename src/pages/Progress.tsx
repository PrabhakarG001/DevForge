import { Link } from 'react-router-dom';
import { BookOpen, BookmarkCheck, History, Trophy } from 'lucide-react';
import { TOPICS, CS_SUBJECTS } from '../data/topics';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ui/ProgressRing';
import EmptyState from '../components/ui/EmptyState';
import { GoogleG } from '../components/Navbar';

export default function Progress() {
  const { user, signInWithGoogle, demoMode } = useAuth();
  const { topicProgress, bookmarks, history } = useProgress();

  const topicRows = [
    ...TOPICS.map((t) => ({
      id: t.id, title: t.shortTitle, to: `/learn/${t.slug}`,
      chapterIds: t.chapters.map((c) => c.id), Icon: t.icon,
    })),
    ...CS_SUBJECTS.map((s) => ({
      id: s.id, title: s.abbr, to: '/cs-fundamentals',
      chapterIds: s.chapters.map((c) => c.id), Icon: s.icon,
    })),
  ];

  const totalDone = topicRows.reduce((n, r) => n + topicProgress(r.chapterIds).done, 0);
  const totalAll = topicRows.reduce((n, r) => n + r.chapterIds.length, 0);
  const overallPct = totalAll ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// dashboard</p>
        <h1 className="section-title mt-3">Your Progress</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Chapter completion, bookmarks and practice history — stored locally per user.
        </p>
      </div>

      {/* auth prompt / identity */}
      <div className="glass mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-2xl p-5 shadow-card-sm">
        {user ? (
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="h-11 w-11 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/20 font-bold text-accent">
                {(user.displayName ?? 'U')[0]?.toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-sm font-semibold">{user.displayName}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            {demoMode && <span className="badge border-warn/40 bg-warn/10 text-warn">demo session</span>}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">Sign in with Google to keep your progress under your account.</p>
            <button type="button" onClick={() => void signInWithGoogle()} className="btn-secondary">
              <GoogleG size={15} /> Sign in with Google
            </button>
          </>
        )}
      </div>

      {/* overall */}
      <div className="glass-strong mx-auto mt-5 flex max-w-3xl flex-wrap items-center gap-6 rounded-2xl p-6 shadow-card">
        <ProgressRing pct={overallPct} size={96} stroke={7} label={`Overall ${overallPct}% complete`} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-semibold"><Trophy size={16} className="text-warn" /> {totalDone} / {totalAll} chapters complete</p>
          <p className="mt-1 text-sm text-muted">Keep the streak alive — one chapter a day compounds fast.</p>
        </div>
      </div>

      {/* per-track rows */}
      <section className="mx-auto mt-10 max-w-3xl" aria-label="Per-track progress">
        <h2 className="text-lg font-bold tracking-tight">By track</h2>
        <div className="mt-4 space-y-2.5">
          {topicRows.map((r) => {
            const p = topicProgress(r.chapterIds);
            const Icon = r.Icon;
            return (
              <Link
                key={r.id}
                to={r.to}
                className="focus-ring glass card-hover flex items-center gap-4 rounded-xl p-4 shadow-card-sm"
              >
                <Icon size={18} className="shrink-0 text-accent" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{r.title}</span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-elevated">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-700"
                      style={{ width: `${p.pct}%` }}
                    />
                  </span>
                </span>
                <span className="font-mono text-xs text-muted">{p.done}/{p.total}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* bookmarks + history */}
      <div className="mx-auto mt-12 grid max-w-3xl gap-5 sm:grid-cols-2">
        <div className="glass rounded-2xl p-5 shadow-card-sm">
          <p className="flex items-center gap-2 text-sm font-semibold"><BookmarkCheck size={15} className="text-accent" /> Bookmarks</p>
          {bookmarks.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing saved yet. Bookmark tracks and questions as you go.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {bookmarks.slice(0, 8).map((b) => (
                <li key={b} className="rounded-lg border border-line bg-elevated/60 px-3 py-2 font-mono text-xs">{b}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="glass rounded-2xl p-5 shadow-card-sm">
          <p className="flex items-center gap-2 text-sm font-semibold"><History size={15} className="text-accent2" /> Practice history</p>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No sessions yet. Finish a mock interview on the Interview Prep page.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.slice(0, 8).map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-lg border border-line bg-elevated/60 px-3 py-2 text-sm">
                  <span>{h.label}</span>
                  <span className="font-mono text-accent">{h.score}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {totalDone === 0 && (
        <div className="mx-auto mt-10 max-w-3xl">
          <EmptyState
            icon={BookOpen}
            title="No progress yet"
            hint="Open any track and mark chapters complete — your dashboard updates instantly."
            action={<Link to="/learning-path" className="btn-primary">Go to Learning Path</Link>}
          />
        </div>
      )}
    </div>
  );
}
