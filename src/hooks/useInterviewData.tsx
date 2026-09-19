import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { getDb, firebaseConfigured } from '../lib/firebase';
import type {
  IQuestion, QuestionAttempt, UserStreak, BadgeState,
} from '../data/interview/types';
import { STREAK_MILESTONES } from '../data/interview/types';

/* ── Shape ──────────────────────────────────────────────────── */

export interface InterviewState {
  attempts: QuestionAttempt[];
  streak: UserStreak;
  badges: BadgeState;
  /** question ids marked for revision by the user */
  saved: string[];
  /** generated per day per mode: key `${mode}:${YYYY-MM-DD}` -> question ids */
  dailySets: Record<string, string[]>;
  /** date -> ids served that day (any mode); used to avoid instant repetition */
  servedLog: Record<string, string[]>;
  /** the last date (YYYY-MM-DD) a mock session was completed */
  lastCompletedDate: string | null;
}

export const emptyInterviewState: InterviewState = {
  attempts: [],
  streak: { current: 0, longest: 0, lastActiveDate: '' },
  badges: { unlocked: [] },
  saved: [],
  dailySets: {},
  servedLog: {},
  lastCompletedDate: null,
};

export const todayStr = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const dateNdaysAgoStr = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayStr(d);
};

const daysBetween = (a: string, b: string): number => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const da = new Date(`${a}T00:00:00`).getTime();
  const dbb = new Date(`${b}T00:00:00`).getTime();
  return Math.round((dbb - da) / 86_400_000);
};

/** Firestore doc id-safe owner key. */
const ownerKey = (uid: string) => `u_${uid.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

export interface SessionSummary {
  questionId: string;
  isCorrect: boolean | null;
  confidencePercentage: number | null;
  timeTaken: number;
  timedOut: boolean;
}

interface InterviewDataContextValue {
  state: InterviewState;
  owner: string;
  /** true when Firestore persistence is active */
  cloudSynced: boolean;
  loading: boolean;
  recordAttempt: (a: QuestionAttempt) => Promise<void>;
  completeSession: (mode: string, summaries: SessionSummary[]) => Promise<void>;
  /** persist a generated set so it stays stable for the day + avoids repeats */
  logServed: (mode: string, date: string, ids: string[]) => void;
  toggleSaved: (questionId: string) => void;
  isSaved: (questionId: string) => boolean;
  getAttemptsForQuestion: (questionId: string) => QuestionAttempt[];
}

const InterviewDataContext = createContext<InterviewDataContextValue | null>(null);

const LS_KEY = 'devforge.interview.v1';
const MAX_ATTEMPTS = 500;

function normalize(s: InterviewState): InterviewState {
  return {
    ...s,
    attempts: s.attempts.slice(-MAX_ATTEMPTS),
    servedLog: Object.fromEntries(Object.entries(s.servedLog).slice(-14)),
  };
}

function loadLocal(owner: string): InterviewState {
  try {
    const raw = localStorage.getItem(`${LS_KEY}.${owner}`);
    if (!raw) return { ...emptyInterviewState };
    const parsed = JSON.parse(raw) as Partial<InterviewState>;
    return normalize({
      ...emptyInterviewState,
      ...parsed,
      streak: { ...emptyInterviewState.streak, ...(parsed.streak ?? {}) },
      badges: parsed.badges ?? { unlocked: [] },
    });
  } catch {
    return { ...emptyInterviewState };
  }
}

function saveLocal(owner: string, s: InterviewState) {
  try {
    localStorage.setItem(`${LS_KEY}.${owner}`, JSON.stringify(s));
  } catch {
    /* quota — ignore */
  }
}

/** remote wins for scalars; attempts merged and de-duplicated */
function mergeStates(remote: InterviewState, local: InterviewState): InterviewState {
  const key = (a: QuestionAttempt) => `${a.questionId}|${a.attemptedAt}|${a.timeTaken}`;
  const seen = new Set(remote.attempts.map(key));
  const merged = [...remote.attempts, ...local.attempts.filter((a) => !seen.has(key(a)))];
  return normalize({
    ...remote,
    attempts: merged.sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt)),
  });
}

export function InterviewDataProvider({ uid, children }: { uid: string | null; children: ReactNode }) {
  const owner = uid ? ownerKey(uid) : 'guest';
  const [state, setState] = useState<InterviewState>(() => loadLocal(owner));
  const [cloudSynced, setCloudSynced] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load local for the (possibly new) owner, then hydrate from Firestore.
  useEffect(() => {
    setState(loadLocal(owner));
    setCloudSynced(false);
    if (!firebaseConfigured || !uid) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const db = await getDb();
        const ref = doc(db, 'interviewData', ownerKey(uid));
        const snap = await getDoc(ref);
        if (cancelled) return;
        if (snap.exists()) {
          const remote = snap.data() as Partial<InterviewState>;
          // Guard against a previously-clobbered zeroed streak on the server:
          // keep whichever of (remote, local) is stronger.
          const local = loadLocal(owner);
          const rStreak = remote.streak ?? emptyInterviewState.streak;
          const lStreak = local.streak;
          const streak =
            rStreak.current + rStreak.longest >= lStreak.current + lStreak.longest ? rStreak : lStreak;
          const remoteState = normalize({
            ...emptyInterviewState,
            ...remote,
            streak,
            badges: remote.badges ?? { unlocked: [] },
          });
          setState(mergeStates(remoteState, local));
        }
        setCloudSynced(true);
      } catch (e) {
        console.warn('[interview] Firestore hydrate failed; staying local.', e);
        setCloudSynced(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [owner, uid]);

  // Persist locally on every change (source of truth for the session).
  useEffect(() => {
    saveLocal(owner, state);
  }, [owner, state]);

  /** Best-effort patch to Firestore. */
  const pushToCloud = useCallback(
    async (patch: Partial<InterviewState> & { attempt?: QuestionAttempt }) => {
      if (!firebaseConfigured || !uid) return;
      try {
        const db = await getDb();
        const ref = doc(db, 'interviewData', ownerKey(uid));
        const { attempt, ...rest } = patch;
        await setDoc(ref, { ...rest, updatedAt: serverTimestamp() }, { merge: true });
        if (attempt) await updateDoc(ref, { attempts: arrayUnion(attempt) });
      } catch (e) {
        console.warn('[interview] cloud push failed (kept locally).', e);
      }
    },
    [uid],
  );

  const recordAttempt = useCallback(
    async (a: QuestionAttempt) => {
      setState((s) => normalize({ ...s, attempts: [...s.attempts, a] }));
      await pushToCloud({ attempt: a });
    },
    [pushToCloud],
  );

  const completeSession = useCallback(
    async (_mode: string, _summaries: SessionSummary[]) => {
      const date = todayStr();
      // Compute the new streak from the LATEST local state (a setState updater
      // runs asynchronously — reading a closure variable here could push a
      // stale/zeroed streak to Firestore).
      const streak: UserStreak = await new Promise<UserStreak>((resolve) => {
        setState((s) => {
          const prevGap = daysBetween(s.lastCompletedDate ?? '', date);
          const current = prevGap === 0 ? s.streak.current : prevGap === 1 ? s.streak.current + 1 : 1;
          const next: UserStreak = {
            current,
            longest: Math.max(s.streak.longest, current),
            lastActiveDate: date,
          };
          resolve(next);
          const unlockedSet = new Set(s.badges.unlocked.map((b) => b.days));
          const newly = STREAK_MILESTONES.filter((d) => d <= current && !unlockedSet.has(d));
          return normalize({
            ...s,
            streak: next,
            lastCompletedDate: date,
            badges: {
              unlocked: [
                ...s.badges.unlocked,
                ...newly.map((days) => ({ days, unlockedAt: new Date().toISOString() })),
              ],
            },
          });
        });
      });
      await pushToCloud({ streak, lastCompletedDate: date });
    },
    [pushToCloud],
  );

  const logServed = useCallback(
    (mode: string, date: string, ids: string[]) => {
      const key = `${mode}:${date}`;
      setState((s) => {
        const existing = s.dailySets[key];
        if (existing && existing.length >= ids.length) return s; // already persisted
        return normalize({
          ...s,
          dailySets: { ...s.dailySets, [key]: ids },
          servedLog: { ...s.servedLog, [date]: Array.from(new Set([...(s.servedLog[date] ?? []), ...ids])) },
        });
      });
    },
    [],
  );

  const toggleSaved = useCallback((questionId: string) => {
    setState((s) => ({
      ...s,
      saved: s.saved.includes(questionId)
        ? s.saved.filter((x) => x !== questionId)
        : [...s.saved, questionId],
    }));
  }, []);

  // Push saved-list changes to cloud (debounced).
  const saved = state.saved;
  useEffect(() => {
    if (!firebaseConfigured || !uid) return;
    const t = setTimeout(() => {
      void pushToCloud({ saved });
    }, 800);
    return () => clearTimeout(t);
  }, [saved, uid, pushToCloud]);

  const isSaved = useCallback((questionId: string) => state.saved.includes(questionId), [state.saved]);

  const getAttemptsForQuestion = useCallback(
    (questionId: string) => state.attempts.filter((a) => a.questionId === questionId),
    [state.attempts],
  );

  const value = useMemo(
    () => ({
      state,
      owner,
      cloudSynced,
      loading,
      recordAttempt,
      completeSession,
      logServed,
      toggleSaved,
      isSaved,
      getAttemptsForQuestion,
    }),
    [state, owner, cloudSynced, loading, recordAttempt, completeSession, logServed, toggleSaved, isSaved, getAttemptsForQuestion],
  );

  return <InterviewDataContext.Provider value={value}>{children}</InterviewDataContext.Provider>;
}

/** revision candidates from the last 3 days: wrong, low-confidence, timed-out, saved */
export function revisionCandidates(s: InterviewState, questions: IQuestion[]) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const cutoff = dateNdaysAgoStr(3);
  const reasons = new Map<string, string[]>();

  for (const a of s.attempts) {
    if (a.attemptedAt.slice(0, 10) < cutoff) continue;
    const list = reasons.get(a.questionId) ?? [];
    if (a.timedOut) list.push('timed out');
    else if (!a.isCorrect) list.push('answered incorrectly');
    else if (a.confidencePercentage != null && a.confidencePercentage < 60) list.push(`low confidence (${a.confidencePercentage}%)`);
    if (list.length) reasons.set(a.questionId, list);
  }
  for (const id of s.saved) {
    if (!reasons.has(id)) reasons.set(id, ['marked for revision']);
  }

  // prioritize: more severe reason first, then weakest confidence, then recency
  const severity = (rs: string[]) =>
    rs.includes('timed out') ? 0 : rs.includes('answered incorrectly') ? 1 : rs.some((r) => r.startsWith('low confidence')) ? 2 : 3;

  return Array.from(reasons.entries())
    .filter(([id]) => byId.has(id))
    .map(([id, rs]) => {
      const lastAttempt = [...s.attempts].reverse().find((a) => a.questionId === id);
      return {
        question: byId.get(id)!,
        reasons: Array.from(new Set(rs)),
        severity: severity(rs),
        lastConfidence: lastAttempt?.confidencePercentage ?? null,
      };
    })
    .sort((a, b) => a.severity - b.severity || (a.lastConfidence ?? 100) - (b.lastConfidence ?? 100));
}

export function useInterviewData(): InterviewDataContextValue {
  const ctx = useContext(InterviewDataContext);
  if (!ctx) throw new Error('useInterviewData must be used inside <InterviewDataProvider>');
  return ctx;
}
