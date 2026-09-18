import { motion } from 'framer-motion';
import { ArrowRight, Target, Trophy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import SceneBackground from '../three/SceneBackground';
import { PLATFORM_STATS } from '../data/learningResources';

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** Floating pseudo-terminal snippets that orbit the hero copy. */
function FloatingSnippets() {
  const snippets = [
    { text: 'dp[i] = dp[i-1] + dp[i-2];', cls: 'left-[2%] top-[16%] animate-float-slow', delay: '0s' },
    { text: 'SELECT * FROM skills WHERE level > 9;', cls: 'right-[4%] top-[24%] animate-float', delay: '1.2s' },
    { text: 'useEffect(() => ship(), []);', cls: 'left-[6%] bottom-[12%] animate-float', delay: '0.6s' },
    { text: 'worker.postMessage({ commit: true })', cls: 'right-[8%] bottom-[20%] animate-float-slow', delay: '1.8s' },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
      {snippets.map((s) => (
        <div
          key={s.text}
          style={{ animationDelay: s.delay }}
          className={`absolute rounded-lg border border-line bg-surface/70 px-3 py-1.5 font-mono text-xs text-muted shadow-card-sm backdrop-blur ${s.cls}`}
        >
          <span className="mr-2 text-accent2">$</span>
          {s.text}
        </div>
      ))}
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <SceneBackground />
      <FloatingSnippets />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="badge mx-auto border-accent/40 bg-accent/10 text-accent"
          >
            <Zap size={12} /> For SDE interns, SDE-1 &amp; product-company placements
          </motion.p>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-6 text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl"
          >
            If You Want a <span className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">10+ LPA Job</span>,
            <br className="hidden sm:block" /> Master These Skills First.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
          >
            Build strong foundations in algorithms, software development, computer science,
            system design and modern engineering tools — the exact stack product companies test for.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/learning-path" className="btn-primary px-6">
              Start Learning <ArrowRight size={16} />
            </Link>
            <Link to="/interview-prep" className="btn-secondary px-6">
              <Target size={16} /> Explore Interview Prep
            </Link>
          </motion.div>

          <motion.dl
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {PLATFORM_STATS.map((s) => (
              <div key={s.label} className="glass rounded-xl px-4 py-3 text-left shadow-card-sm">
                <dd className="font-mono text-xl font-bold text-accent">{s.value}</dd>
                <dt className="mt-0.5 text-xs text-muted">{s.label}</dt>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mx-auto mt-14 flex items-center justify-center gap-2 text-xs text-muted"
        >
          <Trophy size={13} className="text-warn" />
          Structured roadmaps · real fundamentals · honest resources — no fluff
        </motion.p>
      </div>
    </section>
  );
}
