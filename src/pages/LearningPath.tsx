import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Flag } from 'lucide-react';
import { LEARNING_PATH } from '../data/learningResources';
import { TOPICS } from '../data/topics';
import { useProgress } from '../hooks/useProgress';
import { Link } from 'react-router-dom';

/** Maps path node labels to the closest track for deep links. */
const NODE_LINKS: Record<string, string> = {
  arrays: '/learn/dsa', strings: '/learn/dsa', linked: '/learn/dsa', stacks: '/learn/dsa',
  recursion: '/learn/dsa', search: '/learn/dsa', trees: '/learn/dsa', heaps: '/learn/dsa',
  graphs: '/learn/dsa', greedy: '/learn/dsa', dp: '/learn/dsa', tries: '/learn/dsa',
  fe: '/learn/full-stack-development', be: '/learn/full-stack-development', db: '/learn/full-stack-development',
  deploy: '/learn/devops', test: '/learn/testing',
  ml: '/learn/ai-ml-development', dl: '/learn/ai-ml-development', llm: '/learn/generative-ai',
  rag: '/learn/generative-ai', agents: '/learn/generative-ai',
  oop: '/cs-fundamentals', dbms: '/cs-fundamentals', os: '/cs-fundamentals', cn: '/cs-fundamentals', coa: '/cs-fundamentals',
  sd: '/learn/system-design',
};

export default function LearningPath() {
  const { isChapterComplete } = useProgress();
  const totalChapters = TOPICS.reduce((n, t) => n + t.chapters.length, 0);
  const doneCount = TOPICS.reduce(
    (n, t) => n + t.chapters.filter((c) => isChapterComplete(c.id)).length, 0,
  );
  const overallPct = totalChapters ? Math.round((doneCount / totalChapters) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// the path</p>
        <h1 className="section-title mt-3">Your Learning Path</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Five phases from first data structure to interview-ready engineer. Chapters marked complete
          on any track light up here.
        </p>
      </div>

      {/* overall progress */}
      <div className="glass mx-auto mt-8 flex max-w-3xl items-center gap-4 rounded-2xl p-5 shadow-card-sm">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Overall completion</span>
            <span className="font-mono text-accent">{doneCount}/{totalChapters} · {overallPct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        <Flag size={20} className="text-accent2" />
      </div>

      {/* phases */}
      <ol className="relative mx-auto mt-12 max-w-3xl space-y-10 border-l border-line pl-8">
        {LEARNING_PATH.map((phase, pi) => (
          <motion.li
            key={phase.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: pi * 0.06 }}
            className="relative"
          >
            <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-accent/50 bg-base">
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
            <div className="glass rounded-2xl p-6 shadow-card-sm">
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent2">{phase.stage}</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">{phase.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{phase.outcome}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {phase.nodes.map((n) => {
                  const to = NODE_LINKS[n.id];
                  const content = (
                    <>
                      <span className="font-medium">{n.label}</span>
                      <span className="block text-[11px] text-muted">{n.detail}</span>
                    </>
                  );
                  const cls = 'focus-ring block rounded-xl border border-line bg-elevated/60 p-3 text-left transition hover:border-accent/50';
                  return to ? (
                    <Link key={n.id} to={to} className={`${cls} w-full sm:w-[calc(50%-0.375rem)]`}>{content}</Link>
                  ) : (
                    <div key={n.id} className={`${cls} w-full sm:w-[calc(50%-0.375rem)]`}>{content}</div>
                  );
                })}
              </div>
            </div>
          </motion.li>
        ))}
        <li className="relative">
          <span className="absolute -left-[41px] top-1 flex h-5 w-5 items-center justify-center rounded-full border border-good/60 bg-base">
            <CheckCircle2 size={12} className="text-good" />
          </span>
          <div className="rounded-2xl border border-good/30 bg-good/5 p-5">
            <p className="font-semibold text-good">Interview-ready</p>
            <p className="mt-1 text-sm text-muted">
              When every phase feels like review, you are ready for the <Link to="/interview-prep" className="text-accent underline-offset-2 hover:underline">Interview Prep</Link> dashboard.
            </p>
          </div>
        </li>
      </ol>

      <p className="mt-10 flex items-center justify-center gap-2 text-xs text-muted">
        <Circle size={10} className="text-accent" /> Progress is stored locally per user and updates across cards, tracks and this path.
      </p>
    </div>
  );
}
