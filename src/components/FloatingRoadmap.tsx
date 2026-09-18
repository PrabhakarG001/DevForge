import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Binary, Boxes, BrainCircuit, Globe, Lock, Network, Scale, Sparkles, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PopupContent } from '../data/learningResources';
import { DEVOPS_POPUP, GENAI_POPUP, NUMBER_THEORY_POPUP } from '../data/learningResources';
import { CS_SUBJECTS } from '../data/topics';
import ImportantPopup from './ImportantPopup';

interface RoadmapNode {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  to?: string;
  popup?: PopupContent;
  veryImportant?: boolean;
  accentCls: string;
}

/** The full skill graph — DSA root, three pillars, and the specialized nodes. */
function buildGraph(): RoadmapNode[] {
  return [
    { id: 'dsa', label: 'DSA', detail: 'Deep Algorithms & Problem Solving — the #1 interview filter', icon: Binary, to: '/learn/dsa', veryImportant: true, accentCls: 'text-accent2' },
    { id: 'fullstack', label: 'Full Stack', detail: 'React · Node · PostgreSQL · MongoDB — ship real products', icon: Globe, to: '/learn/full-stack-development', veryImportant: true, accentCls: 'text-accent' },
    { id: 'aiml', label: 'AI/ML', detail: 'ML core → PyTorch → LLM apps — build intelligence in', icon: BrainCircuit, to: '/learn/ai-ml-development', veryImportant: true, accentCls: 'text-accent2' },
    { id: 'cs', label: 'CS Fundamentals', detail: 'CN · OOPs · DBMS · OS · COA — the core subjects', icon: Boxes, to: '/cs-fundamentals', accentCls: 'text-good' },
    { id: 'devops', label: 'DevOps, Testing & Security', detail: 'Docker · CI/CD · K8s · Testing · Security · Auth · Aptitude · System Design', icon: Workflow, popup: DEVOPS_POPUP, veryImportant: true, accentCls: 'text-warn' },
    { id: 'genai', label: 'Generative AI & Automation', detail: 'LLMs · Prompting · RAG · Agents · AI workflows', icon: Sparkles, popup: GENAI_POPUP, veryImportant: true, accentCls: 'text-accent' },
    { id: 'numbertheory', label: 'Number Theory', detail: 'Primes · Sieve · Modular math · Combinatorics', icon: Scale, popup: NUMBER_THEORY_POPUP, accentCls: 'text-bad' },
    { id: 'auth-sd', label: 'Auth & System Design', detail: 'JWT · OAuth2 · Scalability · Caching · Load balancing', icon: Lock, to: '/learn/system-design', accentCls: 'text-warn' },
  ];
}

/** Skills clustered in a rail layout; SVG edge layer animates on scroll into view. */
export default function FloatingRoadmap() {
  const nodes = useRef(buildGraph());
  const [popup, setPopup] = useState<PopupContent | null>(null);
  const skillNodes = nodes.current.filter((n) => !['devops', 'genai', 'numbertheory'].includes(n.id));
  const popupNodes = nodes.current.filter((n) => ['devops', 'genai', 'numbertheory'].includes(n.id));

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6" aria-labelledby="roadmap-heading">
      <div className="relative">
        {/* floating card shell with 3D perspective */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 8 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformPerspective: 1200 }}
          className="glass-strong relative rounded-3xl border-line/80 p-6 shadow-card sm:p-10"
        >
          {/* header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// skill graph</p>
            <h2 id="roadmap-heading" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Your Roadmap to Becoming a Strong Software Engineer
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              Master these interconnected skills to prepare for internships, placements and software
              engineering interviews. Click any node to jump in — glow highlights mark the very-important tracks.
            </p>
          </div>

          {/* graph */}
          <div className="relative mt-10">
            {/* animated connector field */}
            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="rgb(var(--c-accent-2))" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {[
                'M 8% 50% C 18% 20%, 30% 20%, 42% 24%',
                'M 8% 50% C 18% 80%, 30% 80%, 42% 76%',
                'M 42% 24% C 55% 24%, 60% 40%, 68% 44%',
                'M 42% 76% C 55% 76%, 60% 60%, 68% 56%',
                'M 68% 44% C 78% 40%, 86% 44%, 94% 46%',
                'M 68% 56% C 78% 60%, 86% 56%, 94% 54%',
              ].map((d) => (
                <motion.path
                  key={d}
                  d={d}
                  fill="none"
                  stroke="url(#edge)"
                  strokeWidth="1.6"
                  initial={{ pathLength: 0, opacity: 0 }}
                  whileInView={{ pathLength: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
              ))}
            </svg>

            {/* node rails */}
            <div className="relative grid gap-10 lg:grid-cols-3">
              {/* pillar 1: DSA */}
              <div className="flex flex-col items-center gap-4">
                <PillarNode node={skillNodes[0]} big />
                <div className="flex flex-wrap justify-center gap-2">
                  {['Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 'Recursion', 'Backtracking', 'Searching', 'Sorting'].map((t) => (
                    <Chip key={t} label={t} />
                  ))}
                </div>
              </div>

              {/* pillar 2: Full Stack + AI/ML */}
              <div className="flex flex-col items-center gap-4">
                <PillarNode node={skillNodes[1]} big />
                <PillarNode node={skillNodes[2]} big />
                <div className="flex flex-wrap justify-center gap-2">
                  {['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind', 'Node.js', 'Express', 'REST APIs', 'Auth', 'PostgreSQL', 'MongoDB', 'Python', 'ML', 'Deep Learning', 'AI APIs', 'GenAI', 'AI Apps'].map((t) => (
                    <Chip key={t} label={t} />
                  ))}
                </div>
              </div>

              {/* pillar 3: CS Fundamentals */}
              <div className="flex flex-col items-center gap-4">
                <PillarNode node={skillNodes[3]} big />
                <div className="flex flex-wrap justify-center gap-2">
                  {CS_SUBJECTS.map((s) => (
                    <Link
                      key={s.id}
                      to="/cs-fundamentals"
                      className="focus-ring badge border-line bg-elevated/70 text-muted transition hover:border-accent/50 hover:text-accent"
                    >
                      {s.abbr}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* very-important rail */}
            <div className="mt-12 border-t border-line pt-8">
              <p className="mb-4 text-center font-mono text-[11px] uppercase tracking-[0.25em] text-warn">
                // high-signal categories
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {popupNodes.map((n) => (
                  <motion.button
                    key={n.id}
                    type="button"
                    onClick={() => setPopup(n.popup ?? null)}
                    whileHover={{ y: -4 }}
                    className="focus-ring glass card-hover group rounded-2xl p-5 text-left"
                  >
                    <span className="flex items-center justify-between">
                      <n.icon size={22} className={n.accentCls} aria-hidden />
                      <span className="badge border-warn/50 bg-warn/10 text-warn animate-pulse-soft">VERY IMPORTANT</span>
                    </span>
                    <span className="mt-3 block font-bold">{n.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{n.detail}</span>
                    <span className="mt-3 inline-block font-mono text-[11px] text-accent opacity-0 transition group-hover:opacity-100">
                      → open category
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* number theory + auth/system design footnote rail */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <motion.button
                type="button"
                onClick={() => setPopup(NUMBER_THEORY_POPUP)}
                whileHover={{ y: -4 }}
                className="focus-ring glass card-hover group flex items-center gap-4 rounded-2xl p-4 text-left"
              >
                <Scale size={20} className="text-bad" aria-hidden />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold">
                    Number Theory <span className="badge border-bad/40 bg-bad/10 text-bad">IMPORTANT</span>
                  </span>
                  <span className="block truncate text-xs text-muted">Primes · Sieve · Modular · Combinatorics — CP toolkit</span>
                </span>
              </motion.button>
              <Link to="/learn/system-design" className="focus-ring glass card-hover group flex items-center gap-4 rounded-2xl p-4 text-left">
                <Network size={20} className="text-warn" aria-hidden />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-semibold">
                    Auth &amp; System Design <span className="badge border-warn/40 bg-warn/10 text-warn">INTERVIEW CRITICAL</span>
                  </span>
                  <span className="block truncate text-xs text-muted">JWT · OAuth2 · Scalability · Caching · Load balancing</span>
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      <ImportantPopup open={popup !== null} onClose={() => setPopup(null)} content={popup ?? DEVOPS_POPUP} />
    </section>
  );
}

function PillarNode({ node, big = false }: { node: RoadmapNode; big?: boolean }) {
  const inner = (
    <>
      <span className={`flex ${big ? 'h-12 w-12' : 'h-10 w-10'} items-center justify-center rounded-xl border border-line bg-elevated shadow-card-sm`}>
        <node.icon size={big ? 22 : 18} className={node.accentCls} aria-hidden />
      </span>
      <span className="min-w-0 text-left">
        <span className="block font-bold leading-tight">{node.label}</span>
        <span className="block text-xs text-muted">{node.detail}</span>
      </span>
    </>
  );
  const cls = `focus-ring glass card-hover flex w-full items-center gap-3 rounded-2xl border-line/80 p-4 ${big ? 'sm:p-5' : ''}`;
  return node.to ? (
    <Link to={node.to} className={cls} title={node.detail}>{inner}</Link>
  ) : (
    <div className={cls} title={node.detail}>{inner}</div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-line bg-elevated/60 px-2 py-0.5 font-mono text-[11px] text-muted transition hover:border-accent/40 hover:text-ink">
      {label}
    </span>
  );
}
