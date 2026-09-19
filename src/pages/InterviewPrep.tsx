import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Database,
  Gauge, History, ListChecks, Play, Sparkles, Target, Timer, TrendingDown, Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { IQuestion, MockModeId } from '../data/interview/types';
import { ALL_QUESTIONS } from '../data/interview/questions';
import { INTERVIEW_TOPICS, MOCK_MODES, topicLabel, QUESTION_TYPE_META } from '../data/interview/topics';
import { useSelectionEngine, weakTopics, shuffled } from '../hooks/useSelectionEngine';
import { todayStr, useInterviewData, revisionCandidates } from '../hooks/useInterviewData';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../hooks/useProgress';
import MockRunner from '../components/interview/MockRunner';
import StreakPanel from '../components/interview/StreakPanel';
import ReviseCard from '../components/interview/ReviseCard';
import HowToGuide from '../components/interview/HowToGuide';
import { Q_DIFFICULTY_META } from '../types';

type Phase = 'lobby' | 'mock';

const DAILY_COUNT = 10;
const TOPIC_COUNT = 8;

const fmtDate = (d = new Date()) =>
  d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const fmtDuration = (totalSeconds: number) => {
  const m = Math.round(totalSeconds / 60);
  if (m < 60) return `~${m} min`;
  return `~${Math.floor(m / 60)}h ${m % 60}m`;
};

export default function InterviewPrep() {
  const { user } = useAuth();
  const data = useInterviewData();
  const engine = useSelectionEngine();
  const { addHistory } = useProgress();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [activeMock, setActiveMock] = useState<{ mode: MockModeId | string; label: string; questions: IQuestion[] } | null>(null);

  const today = todayStr();

  /* ── today's set (persisted so it is stable for the day) ────── */
  const todaySet = useMemo(() => {
    const key = `daily:${today}`;
    const persisted = data.state.dailySets[key];
    if (persisted?.length) {
      const byId = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));
      const qs = persisted.map((id) => byId.get(id)).filter((q): q is IQuestion => Boolean(q));
      if (qs.length) return qs;
    }
    return null;
  }, [data.state.dailySets, today]);

  const todayMeta = useMemo(() => {
    if (!todaySet) return null;
    const byTopic = new Map<string, number>();
    let est = 0;
    const diff = { easy: 0, medium: 0, hard: 0 };
    for (const q of todaySet) {
      byTopic.set(q.topic, (byTopic.get(q.topic) ?? 0) + 1);
      est += q.estimatedTime;
      diff[q.difficulty] += 1;
    }
    return { topics: byTopic, est, diff };
  }, [todaySet]);

  // generate + persist today's set lazily (seeded → stable per day)
  useEffect(() => {
    if (todaySet) return;
    const t = setTimeout(() => {
      const qs = engine.daily('daily', DAILY_COUNT);
      if (qs.length) data.logServed('daily', today, qs.map((q) => q.id));
    }, 400);
    return () => clearTimeout(t);
  }, [todaySet, engine, data, today]);

  const completedToday = data.state.lastCompletedDate === today;

  /* ── dashboard stats ────────────────────────────────────────── */
  const stats = useMemo(() => {
    const attemptsToday = data.state.attempts.filter((a) => a.attemptedAt.slice(0, 10) === today);
    const correct = attemptsToday.filter((a) => a.isCorrect).length;
    const confs = attemptsToday.filter((a) => a.confidencePercentage != null).map((a) => a.confidencePercentage!);
    return {
      completedToday: attemptsToday.length,
      accuracyToday: attemptsToday.length ? Math.round((correct / attemptsToday.length) * 100) : 0,
      confidenceToday: confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 0,
      avgTimeToday: attemptsToday.length ? Math.round(attemptsToday.reduce((n, a) => n + a.timeTaken, 0) / attemptsToday.length) : 0,
      totalAttempts: data.state.attempts.length,
    };
  }, [data.state.attempts, today]);

  const weak = useMemo(() => weakTopics(data.state.attempts), [data.state.attempts]);
  const revisionCount = useMemo(
    () => revisionCandidates(data.state, ALL_QUESTIONS).length,
    [data.state],
  );

  /* ── start helpers ──────────────────────────────────────────── */
  const startWith = (mode: MockModeId | string, label: string, questions: IQuestion[]) => {
    if (!questions.length) return;
    setActiveMock({ mode, label, questions });
    setPhase('mock');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startDaily = () => {
    const qs = todaySet ?? engine.daily('daily', DAILY_COUNT);
    startWith('daily', "Today's Questions", qs);
  };

  const startMode = (modeId: MockModeId) => {
    const def = MOCK_MODES.find((m) => m.id === modeId);
    const label = def?.label ?? modeId;
    if (modeId === 'revise-3-days') {
      const qs = revisionCandidates(data.state, ALL_QUESTIONS).map((r) => r.question);
      startWith(modeId, label, qs);
      return;
    }
    if (modeId === 'revision') {
      // true revision: prioritize the user's actual weak history; fall back to
      // weak-topic-biased picks when there is not enough history yet
      const rev = revisionCandidates(data.state, ALL_QUESTIONS).map((r) => r.question);
      const qs = rev.length >= 3 ? rev.slice(0, TOPIC_COUNT) : engine.pick({ topics: null, types: null, count: TOPIC_COUNT, weakBias: 1 });
      startWith(modeId, label, qs);
      return;
    }
    if (modeId === 'mixed') {
      startWith(modeId, label, engine.mixed(TOPIC_COUNT));
      return;
    }
    if (modeId === 'daily') {
      startDaily();
      return;
    }
    // topic mocks (postgresql, cs-fundamentals, development, aiml, system-design)
    const topics = def?.topics ?? null;
    startWith(modeId, label, engine.pick({ topics, types: null, count: TOPIC_COUNT }));
  };

  const startCustomTopic = (topicId: string) => {
    startWith(`topic:${topicId}`, topicLabel(topicId), engine.pick({ topics: [topicId], types: null, count: TOPIC_COUNT }));
  };

  /** PostgreSQL-focused revision: wrong/low-confidence PG questions first,
   * then unattempted PG questions to fill the set. */
  const pgRevisionQuestions = () => {
    const rev = revisionCandidates(data.state, ALL_QUESTIONS)
      .filter((r) => r.question.topic === 'postgresql')
      .map((r) => r.question);
    if (rev.length >= TOPIC_COUNT) return rev.slice(0, TOPIC_COUNT);
    const used = new Set(rev.map((q) => q.id));
    const fresh = ALL_QUESTIONS.filter((q) => q.topic === 'postgresql' && !used.has(q.id));
    return [...rev, ...shuffled(fresh)].slice(0, TOPIC_COUNT);
  };

  if (phase === 'mock' && activeMock) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <MockRunner
          mode={activeMock.mode}
          modeLabel={activeMock.label}
          questions={activeMock.questions}
          data={data}
          onFinish={(summaries) => {
            const answered = summaries.filter((s) => s.isCorrect != null || s.timedOut);
            void data.completeSession(activeMock.mode, summaries);
            if (answered.length > 0) {
              const correct = answered.filter((s) => s.isCorrect === true).length;
              addHistory({
                id: `${activeMock.mode}-${Date.now()}`,
                label: activeMock.label,
                score: `${correct}/${answered.length} · ${answered.length ? Math.round((correct / answered.length) * 100) : 0}%`,
                at: Date.now(),
              });
            }
            setActiveMock(null);
            setPhase('lobby');
          }}
          onExit={() => {
            setActiveMock(null);
            setPhase('lobby');
          }}
        />
      </div>
    );
  }

  /* ── lobby ──────────────────────────────────────────────────── */
  const signInHint = user ? null : (
    <p className="badge mx-auto mt-4 border-accent/40 bg-accent/10 text-accent">
      Sign in with Google — attempts, streak and badges sync to your account
    </p>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// interview preparation</p>
        <h1 className="section-title mt-3">Your Personalized SDE Interview Simulator</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Timed mock interviews across CS fundamentals, development, PostgreSQL, AI/ML, DevOps,
          security, system design and aptitude — with self-assessed knowledge tracking and smart revision.
        </p>
        {signInHint}
      </div>

      {/* DSA notice */}
      <section className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl border border-warn/40 bg-warn/5 p-6 shadow-card-sm" aria-labelledby="dsa-notice">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--c-warn)/0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-warn)/0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="badge border-warn/60 bg-warn/15 text-warn shadow-glow-sm">
              <AlertTriangle size={11} className="animate-pulse-soft" /> Important
            </span>
            <h2 className="text-lg font-bold tracking-tight">DSA Problems Are Not Included Here</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            <strong>DSA is the soul of software engineering interviews.</strong> You are already
            practicing DSA separately through the dedicated DSA learning and problem-solving section.
            Therefore, the Interview Preparation section does <strong>not</strong> contain a separate
            DSA problem bank.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Instead, use this section to test your understanding of <strong>CS Fundamentals,
            Development, AI/ML, PostgreSQL, DevOps, Security, System Design, Aptitude</strong> and
            other interview topics.
          </p>
          <Link to="/learning-path" className="btn-secondary mt-4 !py-1.5 !text-xs">
            Go to DSA practice <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* main grid */}
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {/* left column */}
        <div className="space-y-5 lg:col-span-2">
          <TodaysQuestionsCard
            set={todaySet}
            meta={todayMeta}
            completedToday={completedToday}
            streak={data.state.streak.current}
            onStart={startDaily}
          />

          {/* PostgreSQL dedicated card */}
          <PostgresCard
            onBrowse={() => startWith('pg-revision', 'PostgreSQL Revision', pgRevisionQuestions())}
            onStartMock={() => startMode('postgresql')}
          />
        </div>

        {/* right column */}
        <div className="space-y-5">
          <StreakPanel />
          <ReviseCard onStart={(count) => {
            const qs = revisionCandidates(data.state, ALL_QUESTIONS).slice(0, count).map((r) => r.question);
            startWith('revise-3-days', 'Revise Last 3 Days', qs);
          }} />
        </div>
      </div>

      {/* mock modes */}
      <section className="mt-14" aria-labelledby="modes-heading">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// interview modes</p>
          <h2 id="modes-heading" className="section-title mt-2">Pick your mock</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => startMode(m.id)}
              disabled={m.id === 'revise-3-days' && revisionCount === 0}
              className="glass card-hover focus-ring group rounded-2xl p-5 text-left shadow-card-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <Play size={16} className="text-accent transition group-hover:scale-110" />
                {m.id === 'revise-3-days' && (
                  <span className="badge border-accent2/40 bg-accent2/10 text-accent2">{revisionCount}</span>
                )}
              </div>
              <p className="mt-3 font-bold">{m.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{m.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition group-hover:opacity-100">
                Start mock <ArrowRight size={12} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* topic browser */}
      <section className="mt-14" aria-labelledby="topics-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// topic-wise practice</p>
            <h2 id="topics-heading" className="section-title mt-2">Topic mocks</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTERVIEW_TOPICS.map((t) => {
            const count = ALL_QUESTIONS.filter((q) => q.topic === t.id).length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => startCustomTopic(t.id)}
                className="glass card-hover focus-ring group rounded-2xl p-5 text-left shadow-card-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold">{t.label}</p>
                  <span className="badge border-line text-muted">{count} Qs</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {t.subtopics.slice(0, 5).map((s) => (
                    <span key={s} className="badge border-line text-muted">{s}</span>
                  ))}
                  {t.subtopics.length > 5 && <span className="badge border-line text-muted">+{t.subtopics.length - 5}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* dashboard */}
      <section className="mt-14" aria-labelledby="dash-heading">
        <div className="mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// interview dashboard</p>
          <h2 id="dash-heading" className="section-title mt-2">Performance</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {/* today's progress */}
          <div className="glass-strong rounded-2xl p-5 shadow-card">
            <p className="flex items-center gap-2 text-sm font-semibold"><Gauge size={15} className="text-accent" /> Today's progress</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DashStat label="Questions completed" value={String(stats.completedToday)} />
              <DashStat label="Accuracy" value={stats.completedToday ? `${stats.accuracyToday}%` : '—'} />
              <DashStat label="Avg confidence" value={stats.completedToday ? `${stats.confidenceToday}%` : '—'} />
              <DashStat label="Avg time" value={stats.completedToday ? `${stats.avgTimeToday}s` : '—'} />
            </div>
            <p className="mt-3 text-[11px] text-muted">
              {stats.completedToday === 0
                ? 'No attempts yet today — start a mock above.'
                : stats.accuracyToday >= 70
                  ? 'Strong day. Keep the streak alive tomorrow.'
                  : 'Revisit missed questions via Revise Last 3 Days.'}
            </p>
          </div>

          {/* all-time performance */}
          <div className="glass-strong rounded-2xl p-5 shadow-card">
            <p className="flex items-center gap-2 text-sm font-semibold"><Trophy size={15} className="text-warn" /> Performance</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DashStat label="Current streak" value={`${data.state.streak.current}d`} />
              <DashStat label="Longest streak" value={`${data.state.streak.longest}d`} />
              <DashStat label="Badges" value={`${data.state.badges.unlocked.length}`} />
              <DashStat label="Total attempts" value={String(stats.totalAttempts)} />
            </div>
          </div>

          {/* weak areas */}
          <div className="glass-strong rounded-2xl p-5 shadow-card">
            <p className="flex items-center gap-2 text-sm font-semibold"><TrendingDown size={15} className="text-bad" /> Weak areas</p>
            {weak.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Not enough data yet — finish a few mocks and your weakest topics will surface here
                automatically.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {weak.slice(0, 4).map((w) => (
                  <li key={w.topic} className="rounded-lg border border-line bg-elevated/60 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{topicLabel(w.topic)}</span>
                      <span className="font-mono text-bad">{w.accuracy}% acc</span>
                    </div>
                    <div className="mt-1 text-muted">
                      confidence {Math.round(w.avgConfidence)}% · {w.attempts} attempts
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* revision strip */}
        <div className="glass mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 shadow-card-sm">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold"><History size={15} className="text-accent2" /> Questions ready for revision</p>
            <p className="mt-1 text-xs text-muted">Wrong answers, low confidence, timeouts and saved questions — prioritized automatically.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-extrabold text-accent2">{revisionCount}</span>
            {revisionCount > 0 && (
              <button type="button" className="btn-secondary" onClick={() => startMode('revise-3-days')}>
                Revise Last 3 Days
              </button>
            )}
          </div>
        </div>
      </section>

      <HowToGuide />

      <QuestionBank />
    </div>
  );
}

/* ── Today's Questions card ─────────────────────────────────── */

function TodaysQuestionsCard({
  set, meta, completedToday, streak, onStart,
}: {
  set: IQuestion[] | null;
  meta: { topics: Map<string, number>; est: number; diff: { easy: number; medium: number; hard: number } } | null;
  completedToday: boolean;
  streak: number;
  onStart: () => void;
}) {
  return (
    <div className="glass-strong relative overflow-hidden rounded-2xl p-6 shadow-card">
      <div
        aria-hidden
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--c-accent)/0.15) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-accent)/0.15) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            <CalendarDays size={13} /> Today's Questions
          </p>
          <span className="badge border-warn/40 bg-warn/10 text-warn">🔥 {streak}-day streak</span>
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight">A fresh randomized interview set generated for you every day.</h2>
        <p className="mt-1 text-sm text-muted">{fmtDate()}</p>

        {set && meta ? (
          <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <InfoChip icon={<ListChecks size={13} />} label="Questions" value={String(set.length)} />
              <InfoChip icon={<Timer size={13} />} label="Est. duration" value={fmtDuration(meta.est)} />
              <InfoChip icon={<Target size={13} />} label="Streak" value={`${streak} days`} />
              <InfoChip
                icon={<CheckCircle2 size={13} />}
                label="Status"
                value={completedToday ? 'Done today ✓' : 'Ready'}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {Array.from(meta.topics.entries()).map(([t, n]) => (
                <span key={t} className="badge border-line text-muted">{topicLabel(t)} × {n}</span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span>Difficulty distribution:</span>
              <span className="badge border-good/30 bg-good/10 text-good">Easy {meta.diff.easy}</span>
              <span className="badge border-warn/30 bg-warn/10 text-warn">Medium {meta.diff.medium}</span>
              <span className="badge border-bad/30 bg-bad/10 text-bad">Hard {meta.diff.hard}</span>
            </div>
          </>
        ) : (
          <div className="mt-5 h-20 animate-pulse rounded-xl bg-elevated/60" />
        )}

        <button type="button" className="btn-primary relative mt-6" onClick={onStart} disabled={!set}>
          <Play size={15} /> Start Today's Mock
        </button>
      </div>
    </div>
  );
}

/* ── PostgreSQL dedicated card ──────────────────────────────── */

function PostgresCard({ onBrowse, onStartMock }: { onBrowse: () => void; onStartMock: () => void }) {
  const pg = ALL_QUESTIONS.filter((q) => q.topic === 'postgresql');
  const diff = {
    easy: pg.filter((q) => q.difficulty === 'easy').length,
    medium: pg.filter((q) => q.difficulty === 'medium').length,
    hard: pg.filter((q) => q.difficulty === 'hard').length,
  };
  return (
    <div className="glass-strong relative overflow-hidden rounded-2xl p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Database size={16} className="text-accent2" /> PostgreSQL Interview Questions
        </p>
        <span className="badge border-accent2/40 bg-accent2/10 text-accent2">dedicated track</span>
      </div>
      <p className="mt-2 text-sm text-muted">
        Not generic SQL — PostgreSQL-specific: MVCC, isolation levels, EXPLAIN ANALYZE, window
        functions, JSONB, partitioning, connection pooling and more.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="badge border-good/30 bg-good/10 text-good">Beginner {diff.easy}</span>
        <span className="badge border-warn/30 bg-warn/10 text-warn">Intermediate {diff.medium}</span>
        <span className="badge border-bad/30 bg-bad/10 text-bad">Advanced {diff.hard}</span>
        <span className="badge border-line text-muted">{pg.length} questions available</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button type="button" className="btn-primary !py-2" onClick={onStartMock}>
          <Play size={14} /> Start PostgreSQL Mock
        </button>
        <button type="button" className="btn-secondary !py-2" onClick={onBrowse}>
          <BookOpen size={14} /> Revision mode
        </button>
      </div>
    </div>
  );
}

/* ── Question bank browser ──────────────────────────────────── */

function QuestionBank() {
  const [topic, setTopic] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      ALL_QUESTIONS.filter(
        (q) => (topic === 'all' || q.topic === topic) && (difficulty === 'all' || q.difficulty === difficulty),
      ),
    [topic, difficulty],
  );

  return (
    <section className="mt-14" aria-labelledby="bank-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// question bank</p>
          <h2 id="bank-heading" className="section-title mt-2">Browse all questions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input !w-auto !py-1.5 !text-xs" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter by topic">
            <option value="all">All topics</option>
            {INTERVIEW_TOPICS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <div className="flex gap-1.5">
            {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setDifficulty(f)}
                className={`focus-ring rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                  difficulty === f ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line text-muted hover:text-ink'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((q) => {
          const dm = Q_DIFFICULTY_META[q.difficulty === 'easy' ? 'Easy' : q.difficulty === 'medium' ? 'Medium' : 'Hard'];
          const open = openId === q.id;
          return (
            <div key={q.id} className="glass rounded-2xl p-5 shadow-card-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${dm.bg} ${dm.border} ${dm.text}`}>{q.difficulty}</span>
                <span className="badge border-line text-muted">{topicLabel(q.topic)}</span>
                <span className="badge border-line text-muted">{QUESTION_TYPE_META[q.questionType].label}</span>
                <span className="ml-auto font-mono text-[11px] text-muted">{Math.round(q.estimatedTime / 60)}m</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed">{q.question}</p>
              {open && (
                <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                  {q.options && (
                    <ul className="space-y-1 text-muted">
                      {q.options.map((o, i) => (
                        <li key={i} className={i === q.correctOption ? 'font-semibold text-good' : ''}>
                          {String.fromCharCode(65 + i)}. {o} {i === q.correctOption && <CheckCircle2 size={12} className="inline" />}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="whitespace-pre-wrap text-muted">{q.answer}</p>
                  <p className="text-xs text-muted"><span className="font-medium text-ink">Why:</span> {q.explanation}</p>
                  {q.interviewTip && (
                    <p className="flex items-start gap-1.5 text-xs text-muted">
                      <Sparkles size={12} className="mt-0.5 shrink-0 text-warn" /> {q.interviewTip}
                    </p>
                  )}
                </div>
              )}
              <button type="button" className="btn-ghost mt-3 !py-1 !text-xs" onClick={() => setOpenId(open ? null : q.id)}>
                {open ? 'Hide answer' : 'Reveal answer'}
              </button>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No questions match those filters yet.
        </p>
      )}
    </section>
  );
}

/* ── small bits ─────────────────────────────────────────────── */

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-elevated/60 px-3.5 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-muted">{icon} {label}</p>
      <p className="mt-0.5 font-mono text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function DashStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-elevated/60 p-3">
      <p className="font-mono text-lg font-bold text-accent">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{label}</p>
    </div>
  );
}
