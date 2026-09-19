import { useMemo } from 'react';
import type { IQuestion, QuestionAttempt } from '../data/interview/types';
import { ALL_QUESTIONS } from '../data/interview/questions';
import { INTERVIEW_TOPICS, INTERVIEW_TOPIC_IDS } from '../data/interview/topics';
import { useInterviewData, todayStr } from '../hooks/useInterviewData';
import type { InterviewState } from '../hooks/useInterviewData';

/* ── Deterministic RNG ──────────────────────────────────────── */

/** xmur3 + mulberry32: tiny seeded PRNG so a given day+mode+user always yields
 * the same question set until that day's set is persisted. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const shuffled = <T,>(arr: T[]): T[] => seededShuffle(arr, Math.random);

/* ── Attempt-aware weighting (intelligent selection, spec §16) ── */

export interface TopicStat {
  topic: string;
  attempts: number;
  correct: number;
  /** 0-100, 50 when no data */
  accuracy: number;
  avgConfidence: number; // 0-100, 50 when no data
  avgTime: number; // seconds
  recentAttempts: number; // attempts in the last 7 days
}

export function topicStats(attempts: QuestionAttempt[]): Map<string, TopicStat> {
  const now = Date.now();
  const m = new Map<string, TopicStat>();
  for (const a of attempts) {
    const st =
      m.get(a.topic) ??
      { topic: a.topic, attempts: 0, correct: 0, accuracy: 0, avgConfidence: 0, avgTime: 0, recentAttempts: 0 };
    st.attempts += 1;
    if (a.isCorrect) st.correct += 1;
    const conf = a.confidencePercentage ?? 50;
    st.avgConfidence = (st.avgConfidence * (st.attempts - 1) + conf) / st.attempts;
    st.avgTime = (st.avgTime * (st.attempts - 1) + a.timeTaken) / st.attempts;
    if (now - new Date(a.attemptedAt).getTime() < 7 * 86_400_000) st.recentAttempts += 1;
    m.set(a.topic, st);
  }
  for (const st of m.values()) st.accuracy = st.attempts ? Math.round((st.correct / st.attempts) * 100) : 0;
  return m;
}

/** Weak areas: low accuracy or low confidence, with at least a few attempts. */
export function weakTopics(attempts: QuestionAttempt[], minAttempts = 2): TopicStat[] {
  return Array.from(topicStats(attempts).values())
    .filter((s) => s.attempts >= minAttempts)
    .filter((s) => s.accuracy < 70 || s.avgConfidence < 60)
    .sort((a, b) => a.accuracy - b.accuracy || a.avgConfidence - b.avgConfidence);
}

/** Per-question recentness penalty: how recently was this exact question served/attempted? */
function questionPenalty(q: IQuestion, state: InterviewState): number {
  // attempts: strong penalty receding with time
  const attempts = state.attempts.filter((a) => a.questionId === q.id);
  let penalty = 0;
  const today = todayStr();
  for (const a of attempts) {
    const d = new Date(a.attemptedAt);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ageDays = Math.max(0, Math.round((new Date(`${today}T00:00:00`).getTime() - new Date(`${dayKey}T00:00:00`).getTime()) / 86_400_000));
    if (ageDays <= 1) penalty += 10;
    else if (ageDays <= 3) penalty += 5;
    else if (ageDays <= 7) penalty += 2;
  }
  // served recently (daily sets) — mild penalty to avoid immediate repetition
  for (const ids of Object.values(state.servedLog)) {
    if (ids.includes(q.id)) penalty += 3;
  }
  return penalty;
}

/* ── Distribution for a mixed SDE mock (spec: question-type mix) ── */

export interface DistributionSlot {
  topics: string[] | null; // null = any interview topic
  types: string[] | null;
  count: number;
}

/** 10-question balanced SDE interview mix; scaled proportionally for other sizes. */
export const MIXED_DISTRIBUTION: DistributionSlot[] = [
  { topics: ['cs-fundamentals'], types: ['conceptual', 'scenario', 'comparison'], count: 2 },
  { topics: ['development'], types: ['code-analysis', 'debugging', 'coding'], count: 2 },
  { topics: ['postgresql', 'databases'], types: ['sql', 'mcq', 'scenario'], count: 1 },
  { topics: ['aiml'], types: null, count: 1 },
  { topics: ['devops', 'testing-security'], types: null, count: 1 },
  { topics: ['system-design'], types: ['system-design', 'scenario'], count: 1 },
  { topics: ['development', 'system-design', 'cs-fundamentals'], types: ['project-based', 'behavioral-technical'], count: 2 },
];

function scaleDistribution(total: number): DistributionSlot[] {
  if (total === 10) return MIXED_DISTRIBUTION;
  const base = MIXED_DISTRIBUTION.reduce((n, s) => n + s.count, 0); // 10
  const scaled = MIXED_DISTRIBUTION.map((s) => ({ ...s, count: Math.max(1, Math.round((s.count / base) * total)) }));
  // trim or pad to hit the exact total
  let sum = scaled.reduce((n, s) => n + s.count, 0);
  for (let i = scaled.length - 1; i >= 0 && sum > total; i--) {
    const cut = Math.min(scaled[i].count - 1, sum - total);
    scaled[i].count -= cut;
    sum -= cut;
  }
  let i = 0;
  while (sum < total) {
    scaled[i % scaled.length].count += 1;
    sum += 1;
    i += 1;
  }
  return scaled.filter((s) => s.count > 0);
}

/* ── Core selection ─────────────────────────────────────────── */

export interface SelectOptions {
  topics: string[] | null; // null = all interview topics
  types?: string[] | null;
  difficulty?: 'all' | 'easy' | 'medium' | 'hard';
  count: number;
  /** force recency-aware de-prioritization (default true) */
  avoidRecent?: boolean;
  /** bias towards weak topics (0-1) */
  weakBias?: number;
}

function poolFor(opts: SelectOptions): IQuestion[] {
  return ALL_QUESTIONS.filter((q) => {
    if (opts.topics && !opts.topics.includes(q.topic)) return false;
    if (opts.types && !opts.types.includes(q.questionType)) return false;
    if (opts.difficulty && opts.difficulty !== 'all' && q.difficulty !== opts.difficulty) return false;
    return true;
  });
}

/** General-purpose intelligent picker: weighted shuffle avoiding recent repeats. */
export function selectQuestions(opts: SelectOptions, state: InterviewState): IQuestion[] {
  const pool = poolFor(opts);
  if (pool.length === 0) return [];
  const weighted = pool.map((q) => {
    const stat = topicStats(state.attempts).get(q.topic);
    let score = Math.random();
    const penalty = opts.avoidRecent === false ? 0 : questionPenalty(q, state);
    score -= penalty / 100;
    if (stat && opts.weakBias) {
      const weakness = (100 - stat.accuracy) / 100; // 0..1
      score += opts.weakBias * weakness * 0.5;
    }
    // prefer less-recently-used questions overall
    score += (20 - Math.min(20, attemptsOf(state, q.id))) * 0.01;
    return { q, score };
  });
  weighted.sort((a, b) => b.score - a.score);
  return weighted.slice(0, Math.min(opts.count, pool.length)).map((w) => w.q);
}

function attemptsOf(state: InterviewState, questionId: string): number {
  return state.attempts.filter((a) => a.questionId === questionId).length;
}

/** Seeded daily set — deterministic per (owner, day, mode) until persisted. */
export function buildDailySet(mode: string, count: number, owner: string, state: InterviewState, date = todayStr()): IQuestion[] {
  const seed = hashStr(`${owner}|${date}|${mode}`);
  const rand = mulberry32(seed);
  const modeTopics = modeTopicsOf(mode);

  // Prefer questions not served in the last 3 days, then weight by weakness.
  const pool = ALL_QUESTIONS.filter((q) => {
    if (modeTopics && !modeTopics.includes(q.topic)) return false;
    return true;
  });
  const fresh: IQuestion[] = [];
  const stale: IQuestion[] = [];
  // ids served in the last 3 days (daily sets) — these are the "stale" pool
  const recentIds = new Set<string>();
  for (const ids of Object.values(state.servedLog)) {
    for (const id of ids) recentIds.add(id);
  }
  for (const q of pool) {
    (recentIds.has(q.id) || state.attempts.some((a) => a.questionId === q.id && a.attemptedAt.slice(0, 10) >= recent3DaysStart())
      ? stale
      : fresh
    ).push(q);
  }

  const weakMap = topicStats(state.attempts);
  const score = (q: IQuestion) => {
    let s = rand();
    const stat = weakMap.get(q.topic);
    if (stat) s += ((100 - stat.accuracy) / 100) * 0.25 + ((100 - stat.avgConfidence) / 100) * 0.15;
    return s;
  };

  const pickFrom = (arr: IQuestion[], n: number) =>
    arr
      .map((q) => ({ q, s: score(q) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, Math.max(0, n))
      .map((w) => w.q);

  const primary = pickFrom(fresh, count);
  const remaining = count - primary.length;
  const stalePicks = remaining > 0 ? pickFrom(stale.filter((q) => !primary.includes(q)), remaining) : [];
  return [...primary, ...stalePicks].slice(0, count);
}

const recent3DaysStart = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function modeTopicsOf(mode: string): string[] | null {
  switch (mode) {
    case 'mixed':
    case 'daily':
      return null;
    case 'postgresql':
      return ['postgresql'];
    case 'cs-fundamentals':
      return ['cs-fundamentals'];
    case 'development':
      return ['development'];
    case 'aiml':
      return ['aiml'];
    case 'system-design':
      return ['system-design'];
    case 'devops':
      return ['devops'];
    default:
      return null;
  }
}

/** Distribution-aware mixed mock builder (spec: balanced question-type mix). */
export function buildMixedMock(count: number, state: InterviewState, opts?: { difficulty?: 'all' | 'easy' | 'medium' | 'hard' }): IQuestion[] {
  const slots = scaleDistribution(count);
  const used = new Set<string>();
  const out: IQuestion[] = [];
  for (const slot of slots) {
    let candidates = poolFor({
      topics: slot.topics,
      types: slot.types,
      difficulty: opts?.difficulty ?? 'all',
      count: 1,
    }).filter((q) => !used.has(q.id));
    if (candidates.length === 0) {
      // relax the type constraint before giving up
      candidates = poolFor({ topics: slot.topics, types: null, difficulty: opts?.difficulty ?? 'all', count: 1 }).filter(
        (q) => !used.has(q.id),
      );
    }
    if (candidates.length === 0) {
      candidates = poolFor({ topics: null, types: slot.types, difficulty: 'all', count: 1 }).filter((q) => !used.has(q.id));
    }
    const ranked = candidates
      .map((q) => ({ q, s: Math.random() - questionPenalty(q, state) / 100 }))
      .sort((a, b) => b.s - a.s);
    for (const { q } of ranked.slice(0, slot.count)) {
      used.add(q.id);
      out.push(q);
    }
  }
  // top up from the whole bank if the distribution left us short
  if (out.length < count) {
    const rest = poolFor({ topics: null, types: null, difficulty: opts?.difficulty ?? 'all', count: 1 })
      .filter((q) => !used.has(q.id))
      .map((q) => ({ q, s: Math.random() - questionPenalty(q, state) / 100 }))
      .sort((a, b) => b.s - a.s)
      .slice(0, count - out.length);
    for (const { q } of rest) out.push(q);
  }
  return out.slice(0, count);
}

/** Revision candidates → runnable question list (uses store's revisionCandidates). */
export function buildRevisionSet(questions: ReturnType<typeof revisionCandidatesOf>, count: number): IQuestion[] {
  return questions.slice(0, count).map((r) => r.question);
}

// import indirection to avoid a circular import at module scope
import { revisionCandidates as revisionCandidatesOf } from '../hooks/useInterviewData';

/* ── Hook API ───────────────────────────────────────────────── */

export function useSelectionEngine() {
  const { state, owner } = useInterviewData();
  return useMemo(
    () => ({
      state,
      owner,
      daily: (mode: string, count: number) => buildDailySet(mode, count, owner, state),
      mixed: (count: number, difficulty?: 'all' | 'easy' | 'medium' | 'hard') => buildMixedMock(count, state, { difficulty }),
      pick: (opts: SelectOptions) => selectQuestions(opts, state),
      topicStats: () => topicStats(state.attempts),
      weakTopics: () => weakTopics(state.attempts),
      questionsForTopic: (topicId: string) => ALL_QUESTIONS.filter((q) => q.topic === topicId),
      allTopics: INTERVIEW_TOPICS,
      allTopicIds: INTERVIEW_TOPIC_IDS,
    }),
    [state, owner],
  );
}
