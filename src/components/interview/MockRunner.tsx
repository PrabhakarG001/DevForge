import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, Bookmark, BookmarkCheck, CheckCircle2, ChevronRight, Code2, Database, Eye,
  Lightbulb, ListChecks, Pause, Play, RotateCcw, Server, Square, Timer, Trophy, Volume2, X, XCircle,
} from 'lucide-react';
import Editor from './MonacoEditor';
import type { IQuestion, ILanguage, SessionQuestion } from '../../data/interview/types';
import { CODE_TYPES, PROSE_TYPES } from '../../data/interview/types';
import { Q_DIFFICULTY_META } from '../../types';
import { topicLabel, QUESTION_TYPE_META } from '../../data/interview/topics';
import { useSpeech } from '../../hooks/useSpeech';
import type { useInterviewData } from '../../hooks/useInterviewData';
import type { SessionSummary } from '../../hooks/useInterviewData';

type InterviewData = ReturnType<typeof useInterviewData>;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const editorLanguageOf = (q: IQuestion): ILanguage => q.language ?? 'javascript';

/** Which editor surface does this question need?
 * MCQ wins over everything: some code-analysis/debugging questions present
 * their "what does this print?" snippet in the question body with MCQ options. */
function surfaceOf(q: IQuestion): 'mcq' | 'editor' | 'sql' | 'design' | 'prose' {
  if (q.questionType === 'mcq') return 'mcq';
  if (q.options && q.correctOption != null) return 'mcq';
  if (q.questionType === 'sql') return 'sql';
  if (q.questionType === 'system-design') return 'design';
  if (q.language === 'sql') return 'sql';
  if (CODE_TYPES.includes(q.questionType)) return 'editor';
  if (PROSE_TYPES.includes(q.questionType)) return 'prose';
  return 'prose';
}

interface MockRunnerProps {
  mode: string;
  modeLabel: string;
  questions: IQuestion[];
  data: InterviewData;
  onFinish: (summaries: SessionSummary[]) => void;
  onExit: () => void;
}

/**
 * The focused interview environment: per-question timer, MCQ/editor/SQL/design
 * surfaces, confidence self-assessment before answers, knowledge popup,
 * view-answer panel with voice, and a results screen.
 */
export default function MockRunner({ mode, modeLabel, questions, data, onFinish, onExit }: MockRunnerProps) {
  const [session, setSession] = useState<SessionQuestion[]>(() =>
    questions.map((question) => ({
      question,
      timeTaken: 0,
      status: 'pending' as const,
      isCorrect: null,
      confidencePercentage: null,
    })),
  );
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'question' | 'confidence' | 'recorded' | 'done'>('question');
  const [secondsLeft, setSecondsLeft] = useState(questions[0]?.estimatedTime ?? 60);
  const [confirmExit, setConfirmExit] = useState(false);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [proseValue, setProseValue] = useState('');
  const [designSections, setDesignSections] = useState<Record<string, string>>({});

  const [knowledgePct, setKnowledgePct] = useState(50);
  const [attemptRecorded, setAttemptRecorded] = useState(false);

  /** Live slider value — submitCurrent reads this at grade time so the grade
   * always reflects the confidence the user actually entered. */
  const confidenceRef = useRef(knowledgePct);
  useEffect(() => {
    confidenceRef.current = knowledgePct;
  }, [knowledgePct]);

  const current = session[idx];
  const surface = surfaceOf(current.question);
  const dm = Q_DIFFICULTY_META[current.question.difficulty === 'easy' ? 'Easy' : current.question.difficulty === 'medium' ? 'Medium' : 'Hard'];

  /* ── timer ─────────────────────────────────────────────────── */
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (phase !== 'question' && phase !== 'confidence') return;
    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tickRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, idx]);

  const submitCurrent = useCallback(
    async (opts: { timedOut?: boolean; skipped?: boolean } = {}) => {
      if (attemptRecorded) return;
      setAttemptRecorded(true);
      if (tickRef.current) clearInterval(tickRef.current);

      const q = current.question;
      const used = opts.timedOut ? q.estimatedTime : q.estimatedTime - secondsLeft;

      // Confidence entered by the user on this question (never the slider default).
      const confidence: number | null = opts.timedOut || opts.skipped ? null : knowledgePct;

      // Correctness evaluation per surface. Open-ended answers are graded by
      // the confidence the user actually enters in the next step — a ref that
      // is kept in sync so the grade reflects the final slider value.
      let isCorrect: boolean;
      if (opts.timedOut || opts.skipped) {
        isCorrect = false; // unanswered = incorrect (recorded as timeout/skip)
      } else if (surface === 'mcq') {
        isCorrect = selectedOption === q.correctOption;
      } else {
        isCorrect = confidenceRef.current >= 50;
      }

      setSession((ss) =>
        ss.map((sq, i) =>
          i === idx
            ? {
                ...sq,
                timeTaken: Math.max(1, Math.round(used)),
                status: opts.timedOut ? 'timed-out' : opts.skipped ? 'skipped' : 'answered',
                isCorrect,
                confidencePercentage: confidence,
              }
            : sq,
        ),
      );

      const attempt = {
        userId: data.owner,
        questionId: q.id,
        attemptedAt: new Date().toISOString(),
        isCorrect,
        confidencePercentage: confidence,
        timeTaken: Math.max(1, Math.round(used)),
        difficulty: q.difficulty,
        topic: q.topic,
        language: q.language,
        timedOut: Boolean(opts.timedOut),
      };
      await data.recordAttempt(attempt);

      if (opts.timedOut || opts.skipped) {
        // straight to the recorded view; no confidence step for timeouts
        setPhase('recorded');
      } else {
        setPhase('confidence');
      }
    },
    [attemptRecorded, current, data, idx, secondsLeft, selectedOption, surface],
  );

  // auto-submit on timeout
  useEffect(() => {
    if (secondsLeft === 0 && (phase === 'question' || phase === 'confidence')) {
      void submitCurrent({ timedOut: true });
    }
  }, [secondsLeft, phase, submitCurrent]);

  /* ── per-question reset ────────────────────────────────────── */
  useEffect(() => {
    setSelectedOption(null);
    setEditorValue(current.question.starterCode ?? '');
    setProseValue('');
    setDesignSections(
      current.question.questionType === 'system-design'
        ? { Requirements: '', APIs: '', 'Data Model': '', Architecture: '', 'Scaling & Caching': '', 'Trade-offs': '' }
        : {},
    );
    setKnowledgePct(50);
    confidenceRef.current = 50;
    setAttemptRecorded(false);
    setSecondsLeft(current.question.estimatedTime);
  }, [idx, current]);

  /* ── navigation ────────────────────────────────────────────── */
  const advance = useCallback(() => {
    if (idx + 1 < session.length) {
      setIdx(idx + 1);
      setPhase('question');
    } else {
      setPhase('done');
    }
  }, [idx, session.length]);

  const lastRecorded = useMemo(() => session[idx], [session, idx]);

  /* ── speech ────────────────────────────────────────────────── */
  const speech = useSpeech();
  useEffect(() => speech.stop, [speech.stop]);
  const speakAnswer = () =>
    speech.play(`${current.question.answer}. ${current.question.explanation}`);

  /* ── done screen data ──────────────────────────────────────── */
  const answered = session.filter((s) => s.status !== 'pending');
  const correctCount = session.filter((s) => s.isCorrect === true).length;
  const confidences = answered.filter((s) => s.confidencePercentage != null).map((s) => s.confidencePercentage!);
  const avgConfidence = confidences.length ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length) : 0;
  const totalTime = session.reduce((n, s) => n + (s.timeTaken > 0 ? s.timeTaken : 0), 0);

  if (phase === 'done') {
    const weak = session.filter((s) => s.isCorrect === false || (s.confidencePercentage != null && s.confidencePercentage < 60));
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-2xl p-6 shadow-card sm:p-8">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-accent">
          <Trophy size={13} /> session complete
        </p>
        <h2 className="section-title mt-2">{modeLabel}</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Accuracy" value={`${correctCount}/${session.length}`} />
          <Stat label="Avg confidence" value={`${avgConfidence}%`} />
          <Stat label="Total time" value={fmt(totalTime)} />
          <Stat label="Timed out" value={String(session.filter((s) => s.status === 'timed-out').length)} />
        </div>
        {weak.length > 0 && (
          <div className="mt-6 rounded-xl border border-warn/30 bg-warn/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-warn">
              <AlertTriangle size={14} /> Recommended revisions ({weak.length})
            </p>
            <ul className="mt-2 space-y-1.5">
              {weak.slice(0, 5).map((s) => (
                <li key={s.question.id} className="text-sm text-muted">
                  <span className="font-medium text-ink">{topicLabel(s.question.topic)}</span> — {s.question.subTopic}
                  {s.confidencePercentage != null && <span className="ml-2 font-mono text-xs">({s.confidencePercentage}%)</span>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">These were added to your 3-day revision queue automatically.</p>
          </div>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={() => onFinish(session.map((s) => ({
            questionId: s.question.id,
            isCorrect: s.isCorrect,
            confidencePercentage: s.confidencePercentage,
            timeTaken: s.timeTaken,
            timedOut: s.status === 'timed-out',
          })))}>
            <RotateCcw size={15} /> Back to Interview Prep
          </button>
        </div>
      </motion.div>
    );
  }

  const timeLow = secondsLeft <= 15 && secondsLeft > 0;
  const answeredAlready = current.status !== 'pending';

  return (
    <div className="glass-strong relative overflow-hidden rounded-2xl shadow-card">
      {/* top bar */}
      <div className="border-b border-line/70 px-5 py-3.5 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono font-bold text-accent">{idx + 1} / {session.length}</span>
            <span className="badge border-line text-muted">{topicLabel(current.question.topic)}</span>
            <span className={`badge ${dm.bg} ${dm.border} ${dm.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dm.dot}`} /> {current.question.difficulty}
            </span>
            <span className="badge border-line text-muted">{QUESTION_TYPE_META[current.question.questionType].label}</span>
            <span className="badge border-accent2/40 bg-accent2/10 text-accent2">{modeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums ${timeLow ? 'animate-pulse-soft text-bad' : 'text-ink'}`}>
              <Timer size={15} className={timeLow ? 'text-bad' : 'text-accent'} /> {fmt(secondsLeft)}
            </span>
            <button type="button" className="btn-ghost !px-2.5 !py-1.5 !text-xs text-bad" onClick={() => setConfirmExit(true)}>
              <X size={14} /> Exit
            </button>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent2 transition-all duration-500"
            style={{ width: `${((idx + (answeredAlready ? 1 : 0)) / session.length) * 100}%` }}
          />
        </div>
      </div>

      {/* question area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${idx}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
          className="p-5 sm:p-6"
        >
          <p className="whitespace-pre-wrap text-base font-semibold leading-relaxed">{current.question.question}</p>

          {/* answer surfaces */}
          {phase === 'question' && (
            <div className="mt-5">
              {surface === 'mcq' && (
                <div className="grid gap-2">
                  {current.question.options?.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedOption(i)}
                      className={`focus-ring flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
                        selectedOption === i ? 'border-accent bg-accent/10' : 'border-line hover:border-accent/40'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${selectedOption === i ? 'border-accent bg-accent text-white' : 'border-line text-muted'}`}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="whitespace-pre-wrap">{opt}</span>
                    </button>
                  ))}
                </div>
              )}

              {surface === 'editor' && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
                    <Code2 size={13} /> {editorLanguageOf(current.question)} editor
                  </p>
                  <Editor
                    language={editorLanguageOf(current.question)}
                    value={editorValue}
                    onChange={setEditorValue}
                    height={280}
                  />
                </div>
              )}

              {surface === 'sql' && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
                    <Database size={13} /> PostgreSQL editor
                  </p>
                  <Editor language="sql" value={editorValue} onChange={setEditorValue} height={280} />
                </div>
              )}

              {surface === 'design' && (
                <div className="space-y-3">
                  <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
                    <Server size={13} /> Design workspace
                  </p>
                  {Object.entries(designSections).map(([title, val]) => (
                    <div key={title}>
                      <label className="mb-1 block text-xs font-semibold text-muted">{title}</label>
                      <textarea
                        className="input min-h-[72px] resize-y"
                        value={val}
                        onChange={(e) => setDesignSections((s) => ({ ...s, [title]: e.target.value }))}
                        placeholder={`${title}…`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {surface === 'prose' && (
                <textarea
                  className="input min-h-[140px] resize-y"
                  value={proseValue}
                  onChange={(e) => setProseValue(e.target.value)}
                  placeholder="Answer as you would speak it in the interview…"
                />
              )}
            </div>
          )}

          {/* submit / next actions */}
          {phase === 'question' && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-primary"
                disabled={surface === 'mcq' && selectedOption == null}
                onClick={() => void submitCurrent()}
              >
                Submit answer <ChevronRight size={15} />
              </button>
              <button type="button" className="btn-secondary" onClick={() => void submitCurrent({ skipped: true })}>
                Skip question
              </button>
              {surface === 'mcq' && selectedOption == null && (
                <span className="text-xs text-muted">Select an option to submit — or skip.</span>
              )}
            </div>
          )}

          {/* confidence self-assessment */}
          {phase === 'confidence' && (
            <div className="mt-6 rounded-xl border border-accent/40 bg-accent/5 p-5">
              <p className="text-base font-bold">How confident are you about your answer?</p>
              <p className="mt-1 text-sm text-muted">How much of this problem/topic did you actually know?</p>
              <div className="mt-4 flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={knowledgePct}
                  onChange={(e) => setKnowledgePct(Number(e.target.value))}
                  className="h-2 w-full accent-[rgb(var(--c-accent))]"
                  aria-label="Confidence percentage"
                />
                <span className="w-14 shrink-0 text-right font-mono text-xl font-bold text-accent">{knowledgePct}%</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setKnowledgePct(v)}
                    className={`focus-ring rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      knowledgePct === v ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={() => {
                  // record confidence, then show popup
                  setSession((ss) =>
                    ss.map((sq, i) => (i === idx ? { ...sq, confidencePercentage: knowledgePct } : sq)),
                  );
                  setPhase('recorded');
                }}
              >
                Record knowledge
              </button>
            </div>
          )}

          {/* knowledge recorded popup + view answer */}
          {phase === 'recorded' && lastRecorded && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 space-y-4">
              <div className="rounded-xl border border-good/40 bg-good/5 p-5 shadow-card-sm">
                <p className="flex items-center gap-2 font-bold text-good">
                  <CheckCircle2 size={16} /> Knowledge Recorded
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  You marked your knowledge as{' '}
                  <span className="font-mono font-bold text-accent">{lastRecorded.confidencePercentage ?? 0}%</span> for this topic.
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                  <span>
                    Your answer:{' '}
                    <span className={`font-semibold ${lastRecorded.isCorrect ? 'text-good' : 'text-bad'}`}>
                      {lastRecorded.isCorrect ? 'Correct' : lastRecorded.status === 'timed-out' ? 'Timed out' : 'Incorrect'}
                    </span>
                  </span>
                  <span className="text-muted">Confidence: <span className="font-mono text-ink">{lastRecorded.confidencePercentage ?? '—'}%</span></span>
                  <span className="text-muted">Time: <span className="font-mono text-ink">{fmt(lastRecorded.timeTaken)}</span></span>
                  <span className="text-muted">Topic: <span className="text-ink">{topicLabel(lastRecorded.question.topic)}</span></span>
                  <span className="text-muted">Difficulty: <span className="capitalize text-ink">{lastRecorded.question.difficulty}</span></span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary" onClick={advance}>
                    Next question <ChevronRight size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => data.toggleSaved(lastRecorded.question.id)}
                    title="Mark for revision"
                  >
                    {data.isSaved(lastRecorded.question.id) ? <BookmarkCheck size={15} className="text-accent" /> : <Bookmark size={15} />}
                    {data.isSaved(lastRecorded.question.id) ? 'Saved for revision' : 'Mark for revision'}
                  </button>
                </div>
              </div>
              <AnswerPanel question={lastRecorded.question} speech={speech} onListen={speakAnswer} />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* exit confirm */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setConfirmExit(false)}
          >
            <div className="glass-strong w-full max-w-sm rounded-2xl p-6 text-center shadow-card" onClick={(e) => e.stopPropagation()}>
              <p className="font-bold">Exit this mock?</p>
              <p className="mt-1 text-sm text-muted">Answered questions are already recorded — the rest will be discarded.</p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" className="btn-secondary" onClick={() => setConfirmExit(false)}>Keep going</button>
                <button type="button" className="btn-primary !bg-bad !shadow-none" onClick={onExit}>Exit mock</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── View Answer panel ──────────────────────────────────────── */

function AnswerPanel({
  question, speech, onListen,
}: {
  question: IQuestion;
  speech: ReturnType<typeof useSpeech>;
  onListen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isCode = question.language != null && question.questionType !== 'mcq';
  return (
    <div className="rounded-xl border border-line bg-elevated/50">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
        <button type="button" className="btn-ghost !px-2 !py-1.5 !text-sm font-semibold" onClick={() => setOpen((v) => !v)}>
          <Eye size={15} className="text-accent" /> {open ? 'Hide answer' : 'View answer'}
        </button>
        {speech.supported && (
          <div className="flex items-center gap-1">
            {speech.status === 'idle' && (
              <button type="button" className="btn-ghost !px-2 !py-1.5 !text-xs" onClick={onListen}>
                <Volume2 size={14} /> Listen to answer
              </button>
            )}
            {speech.status === 'playing' && (
              <>
                <button type="button" className="btn-ghost !px-2 !py-1.5 !text-xs" onClick={speech.pause} aria-label="Pause">
                  <Pause size={14} />
                </button>
                <button type="button" className="btn-ghost !px-2 !py-1.5 !text-xs" onClick={speech.stop} aria-label="Stop">
                  <Square size={14} />
                </button>
              </>
            )}
            {speech.status === 'paused' && (
              <>
                <button type="button" className="btn-ghost !px-2 !py-1.5 !text-xs" onClick={speech.resume} aria-label="Resume">
                  <Play size={14} />
                </button>
                <button type="button" className="btn-ghost !px-2 !py-1.5 !text-xs" onClick={speech.stop} aria-label="Stop">
                  <Square size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {open && (
        <div className="space-y-3 border-t border-line px-4 py-4 text-sm leading-relaxed">
          <div className="rounded-lg border border-good/30 bg-good/5 p-3">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-good"><ListChecks size={13} /> Correct answer</p>
            {isCode ? (
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed">{question.answer}</pre>
            ) : (
              <p className="whitespace-pre-wrap">{question.answer}</p>
            )}
          </div>
          <div>
            <p className="font-semibold">Explanation</p>
            <p className="mt-1 text-muted">{question.explanation}</p>
          </div>
          {question.commonMistakes && (
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-bad"><XCircle size={13} /> Common mistakes</p>
              <p className="mt-1 text-muted">{question.commonMistakes}</p>
            </div>
          )}
          {question.interviewTip && (
            <div>
              <p className="flex items-center gap-1.5 font-semibold text-warn"><Lightbulb size={13} /> Interview tip</p>
              <p className="mt-1 text-muted">{question.interviewTip}</p>
            </div>
          )}
          {question.relatedConcepts && question.relatedConcepts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted">Related:</span>
              {question.relatedConcepts.map((c) => (
                <span key={c} className="badge border-line text-muted">{c}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-elevated/60 p-3.5 text-center">
      <p className="font-mono text-lg font-bold text-accent">{value}</p>
      <p className="mt-0.5 text-xs text-muted">{label}</p>
    </div>
  );
}

export type { SessionSummary };
