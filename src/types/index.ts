import type { LucideIcon } from 'lucide-react';

/* ── Themes ─────────────────────────────────────────────────── */

export type ThemeId = 'dark' | 'light' | 'midnight' | 'violet' | 'forest';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  hint: string;
}

/* ── Difficulty ─────────────────────────────────────────────── */

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export const DIFFICULTY_META: Record<
  Difficulty,
  { text: string; bg: string; border: string; dot: string }
> = {
  Beginner: { text: 'text-good', bg: 'bg-good/10', border: 'border-good/30', dot: 'bg-good' },
  Intermediate: { text: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30', dot: 'bg-warn' },
  Advanced: { text: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30', dot: 'bg-bad' },
};

/** Interview questions use the LeetCode-style scale. */
export type QDifficulty = 'Easy' | 'Medium' | 'Hard';

export const Q_DIFFICULTY_META: Record<
  QDifficulty,
  { text: string; bg: string; border: string; dot: string }
> = {
  Easy: { text: 'text-good', bg: 'bg-good/10', border: 'border-good/30', dot: 'bg-good' },
  Medium: { text: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30', dot: 'bg-warn' },
  Hard: { text: 'text-bad', bg: 'bg-bad/10', border: 'border-bad/30', dot: 'bg-bad' },
};

/* ── Resources ──────────────────────────────────────────────── */

export type ResourceKind = 'lecture' | 'notes' | 'practice';

export interface ResourceLink {
  kind: ResourceKind;
  title: string;
  url: string;
  provider: string;
  /** true when the URL is a real, verified destination */
  verified: boolean;
  minutes?: number;
}

/** A learning resource that may not exist yet — rendered honestly. */
export interface ResourceSlot {
  title: string;
  description: string;
  available: boolean;
  link?: ResourceLink;
}

/* ── Topics / curriculum ────────────────────────────────────── */

export type TopicCategoryId =
  | 'dsa'
  | 'fullstack'
  | 'aiml'
  | 'cs-fundamentals'
  | 'devops-testing-security'
  | 'gen-ai'
  | 'number-theory'
  | 'system-design'
  | 'aptitude'
  | 'testing'
  | 'security'
  | 'auth'
  | 'devops';

export type Importance = 'standard' | 'important' | 'very-important';

export interface Topic {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: TopicCategoryId;
  categoryLabel: string;
  icon: LucideIcon;
  difficulty: Difficulty;
  lectureCount: number;
  noteCount: number;
  tags: string[];
  importance: Importance;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  summary: string;
  difficulty: Difficulty;
  minutes: number;
  lectures: ResourceSlot[];
  notes: ResourceSlot[];
  practice: ResourceSlot[];
}

/* ── CS Fundamentals ────────────────────────────────────────── */

export interface CSSubject {
  id: string;
  abbr: string;
  name: string;
  description: string;
  icon: LucideIcon;
  chapters: Chapter[];
}

/* ── Interview prep ─────────────────────────────────────────── */

export type InterviewCategoryId =
  | 'dsa'
  | 'cs-fundamentals'
  | 'fullstack'
  | 'aiml'
  | 'system-design'
  | 'devops'
  | 'assessments'
  | 'behavioral';

export type QodDomain =
  | 'DSA'
  | 'OOPs'
  | 'DBMS'
  | 'OS'
  | 'CN'
  | 'Full Stack'
  | 'AI/ML'
  | 'System Design'
  | 'DevOps';

export interface InterviewCategory {
  id: InterviewCategoryId;
  title: string;
  description: string;
  icon: LucideIcon;
  subtopics: string[];
  accent: string; // tailwind text color class for the icon
}

export interface InterviewQuestion {
  id: string;
  domain: QodDomain;
  categoryId: InterviewCategoryId;
  difficulty: QDifficulty;
  question: string;
  answer: string;
  explanation?: string;
  tags: string[];
}

export interface MockRunQuestion {
  questionId: string;
  revealed: boolean;
  selfRating: 'got-it' | 'shaky' | 'missed' | null;
}

/* ── Auth ───────────────────────────────────────────────────── */

export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/* ── Search ─────────────────────────────────────────────────── */

export type SearchHitKind = 'topic' | 'subject' | 'chapter' | 'question' | 'path';

export interface SearchHit {
  id: string;
  kind: SearchHitKind;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  to: string;
}
