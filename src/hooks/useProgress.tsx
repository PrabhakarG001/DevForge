import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'devforge.progress.v1';

export interface ProgressState {
  /** chapterIds marked complete, keyed by owner key (userId or 'guest') */
  completed: Record<string, string[]>;
  /** bookmarked item ids (topics, chapters, questions) */
  bookmarks: string[];
  /** interview practice history entries */
  history: Array<{ id: string; label: string; score: string; at: number }>;
}

const emptyState: ProgressState = { completed: {}, bookmarks: [], history: [] };

const load = (): ProgressState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completed: parsed.completed ?? {},
      bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return emptyState;
  }
};

interface ProgressContextValue extends ProgressState {
  owner: string;
  setOwner: (uid: string | null) => void;
  isChapterComplete: (chapterId: string) => boolean;
  toggleChapter: (chapterId: string) => void;
  topicProgress: (chapterIds: string[]) => { done: number; total: number; pct: number };
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  addHistory: (entry: ProgressState['history'][number]) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(load);
  const [owner, setOwnerState] = useState<string>(() => {
    try {
      return localStorage.getItem('devforge.progress.owner') ?? 'guest';
    } catch {
      return 'guest';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const setOwner = useCallback((uid: string | null) => {
    const next = uid ?? 'guest';
    setOwnerState(next);
    try {
      localStorage.setItem('devforge.progress.owner', next);
    } catch {
      /* ignore */
    }
  }, []);

  const doneSet = useMemo(
    () => new Set(state.completed[owner] ?? []),
    [state.completed, owner],
  );

  const isChapterComplete = useCallback(
    (chapterId: string) => doneSet.has(chapterId),
    [doneSet],
  );

  const toggleChapter = useCallback(
    (chapterId: string) =>
      setState((s) => {
        const cur = new Set(s.completed[owner] ?? []);
        if (cur.has(chapterId)) cur.delete(chapterId);
        else cur.add(chapterId);
        return { ...s, completed: { ...s.completed, [owner]: [...cur] } };
      }),
    [owner],
  );

  const topicProgress = useCallback(
    (chapterIds: string[]) => {
      const total = chapterIds.length || 1;
      const done = chapterIds.filter((id) => doneSet.has(id)).length;
      return { done, total: chapterIds.length, pct: Math.round((done / total) * 100) };
    },
    [doneSet],
  );

  const isBookmarked = useCallback(
    (id: string) => state.bookmarks.includes(id),
    [state.bookmarks],
  );

  const toggleBookmark = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        bookmarks: s.bookmarks.includes(id)
          ? s.bookmarks.filter((b) => b !== id)
          : [...s.bookmarks, id],
      })),
    [],
  );

  const addHistory = useCallback(
    (entry: ProgressState['history'][number]) =>
      setState((s) => ({ ...s, history: [entry, ...s.history].slice(0, 20) })),
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      owner,
      setOwner,
      isChapterComplete,
      toggleChapter,
      topicProgress,
      isBookmarked,
      toggleBookmark,
      addHistory,
    }),
    [state, owner, setOwner, isChapterComplete, toggleChapter, topicProgress, isBookmarked, toggleBookmark, addHistory],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}
