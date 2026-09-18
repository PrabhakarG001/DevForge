import { CalendarDays, Filter, Timer } from 'lucide-react';

const STEPS = [
  {
    icon: CalendarDays,
    step: 'Step 1',
    title: "Open Today's Questions",
    body: (
      <>
        <p>
          Click <strong>Today's Questions</strong>. The system automatically generates a randomized
          interview set based on your selected topics and previous activity — questions never appear
          in the same order every day.
        </p>
        <p className="mt-2 text-muted">
          Recent misses are fed back in; recently served questions are pushed out.
        </p>
      </>
    ),
  },
  {
    icon: Filter,
    step: 'Step 2',
    title: 'Select your topics',
    body: (
      <>
        <p>
          Pick CS Fundamentals, Development, PostgreSQL, AI/ML, DevOps, Testing &amp; Security,
          System Design or Aptitude — or hit <strong>Mixed Interview</strong> to combine questions
          from multiple topics in one balanced SDE mock.
        </p>
      </>
    ),
  },
  {
    icon: Timer,
    step: 'Step 3',
    title: 'Question difficulty adapts the timer',
    body: (
      <>
        <p>
          Every question carries Easy / Medium / Hard. The per-question time limit changes with
          difficulty <em>and</em> question type — easy conceptual questions get shorter time, hard
          system-design questions get longer. No fixed timer.
        </p>
      </>
    ),
  },
];

/** Visual step-by-step guide shown on the Interview Prep page. */
export default function HowToGuide() {
  return (
    <section aria-labelledby="howto-heading" className="mt-14">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// getting started</p>
        <h2 id="howto-heading" className="section-title mt-2">How to Use This Website for Interview Mocks</h2>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.step} className="glass card-hover relative rounded-2xl p-5 shadow-card-sm">
              <span className="absolute right-4 top-3 font-mono text-4xl font-extrabold text-line/80" aria-hidden>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
                <Icon size={18} />
              </span>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-accent">{s.step}</p>
              <p className="mt-1 font-bold">{s.title}</p>
              <div className="mt-2 text-sm leading-relaxed text-muted">{s.body}</div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
