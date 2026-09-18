/* ── Interview simulation domain ────────────────────────────── */

/**
 * Interview question types. Non-MCQ open types are answered in prose, a code
 * editor, a SQL editor or a structured design workspace depending on the type.
 */
export type IQuestionType =
  | 'mcq'
  | 'coding'
  | 'sql'
  | 'system-design'
  | 'conceptual'
  | 'scenario'
  | 'code-analysis'
  | 'debugging'
  | 'technical-explanation'
  | 'comparison'
  | 'project-based'
  | 'behavioral-technical';

/** Types answered in a code editor (Monaco) — language decides the mode. */
export const CODE_TYPES: IQuestionType[] = ['coding', 'code-analysis', 'debugging'];

/** Open-ended types answered in prose (textarea). */
export const PROSE_TYPES: IQuestionType[] = [
  'conceptual', 'scenario', 'technical-explanation', 'comparison', 'project-based', 'behavioral-technical',
];
export type ILanguage = 'cpp' | 'java' | 'python' | 'javascript' | 'typescript' | 'sql';
export type IDifficulty = 'easy' | 'medium' | 'hard';

export interface IQuestion {
  id: string;
  topic: string;
  subTopic: string;
  difficulty: IDifficulty;
  questionType: IQuestionType;
  language?: ILanguage;
  estimatedTime: number; // seconds
  question: string;
  /** MCQ options; present when questionType === 'mcq' */
  options?: string[];
  /** index into options for MCQs */
  correctOption?: number;
  /** starter code for coding/sql editors */
  starterCode?: string;
  /** canonical answer (solution code, SQL, prose) */
  answer: string;
  explanation: string;
  commonMistakes?: string;
  interviewTip?: string;
  relatedConcepts?: string[];
}

export interface QuestionAttempt {
  userId: string;
  questionId: string;
  attemptedAt: string; // ISO
  isCorrect: boolean;
  /** null when timed out without an answer */
  confidencePercentage: number | null;
  timeTaken: number; // seconds
  difficulty: IDifficulty;
  topic: string;
  language?: string;
  /** timed out / skipped without submission */
  timedOut?: boolean;
}

export interface UserStreak {
  current: number;
  longest: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface StreakMilestone {
  days: 15 | 30 | 60 | 90 | 120 | 150 | 180;
}

export const STREAK_MILESTONES: StreakMilestone['days'][] = [15, 30, 60, 90, 120, 150, 180];

export interface BadgeState {
  unlocked: Array<{ days: StreakMilestone['days']; unlockedAt: string }>;
}

export interface DailyTopicStats {
  topic: string;
  total: number;
  correct: number;
  avgConfidence: number; // 0-100
}

export interface DailyInterviewStats {
  date: string; // YYYY-MM-DD
  completed: number;
  accuracy: number; // 0-100
  avgConfidence: number; // 0-100
  avgTime: number; // seconds
}

/* ── Mock session ───────────────────────────────────────────── */

export type MockModeId =
  | 'daily'
  | 'topic'
  | 'mixed'
  | 'postgresql'
  | 'cs-fundamentals'
  | 'development'
  | 'aiml'
  | 'system-design'
  | 'revision'
  | 'revise-3-days';

export interface MockSettings {
  /** auto-advance to next question on timeout/submit */
  autoAdvance: boolean;
}

export interface SessionQuestion {
  question: IQuestion;
  /** seconds actually used (-1 if skipped) */
  timeTaken: number;
  status: 'pending' | 'answered' | 'timed-out' | 'skipped';
  isCorrect: boolean | null;
  confidencePercentage: number | null;
}

export interface SessionResult {
  mode: MockModeId;
  completedAt: string;
  questions: SessionQuestion[];
  accuracy: number;
  avgConfidence: number;
  totalSeconds: number;
}
