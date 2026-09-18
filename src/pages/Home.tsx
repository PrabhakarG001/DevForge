import { useMemo, useState } from 'react';
import { GitBranch, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import FloatingRoadmap from '../components/FloatingRoadmap';
import LearningCard from '../components/LearningCard';
import { TOPICS } from '../data/topics';
import type { Difficulty } from '../types';

const FILTERS: Array<{ id: 'all' | Difficulty; label: string }> = [
  { id: 'all', label: 'All levels' },
  { id: 'Beginner', label: 'Beginner' },
  { id: 'Intermediate', label: 'Intermediate' },
  { id: 'Advanced', label: 'Advanced' },
];

export default function Home() {
  const [filter, setFilter] = useState<'all' | Difficulty>('all');
  const topics = useMemo(
    () => (filter === 'all' ? TOPICS : TOPICS.filter((t) => t.difficulty === filter)),
    [filter],
  );

  return (
    <>
      <Hero />
      <FloatingRoadmap />

      {/* topic grid */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6" aria-labelledby="topics-heading">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// learning tracks</p>
            <h2 id="topics-heading" className="section-title mt-2">Every skill, one platform</h2>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Each track has structured chapters, curated lectures/notes slots and progress tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`focus-ring rounded-lg border px-3.5 py-1.5 text-sm font-medium transition ${
                  filter === f.id
                    ? 'border-accent/60 bg-accent/10 text-accent'
                    : 'border-line text-muted hover:border-accent/40 hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {topics.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line py-16 text-center">
            <Search size={22} className="text-muted" />
            <p className="mt-3 font-semibold">No tracks at this level</p>
            <p className="mt-1 text-sm text-muted">Try a different difficulty filter.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t, i) => (
              <LearningCard key={t.id} topic={t} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl p-8 text-center shadow-card sm:p-12">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgb(var(--c-accent)/0.12) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-accent)/0.12) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <GitBranch size={26} className="relative mx-auto text-accent" />
          <h2 className="section-title relative mt-4">Consistency beats intensity.</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
            One chapter a day compounds into an offer. Track your progress, prepare like an engineer,
            and walk into interviews with proof of work.
          </p>
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <a href="#topics-heading" className="btn-secondary">Browse tracks</a>
            <Link to="/interview-prep" className="btn-primary">Start Interview Prep</Link>
          </div>
        </div>
      </section>
    </>
  );
}
