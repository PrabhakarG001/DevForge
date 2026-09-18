import { useState } from 'react';
import { GraduationCap, Layers3 } from 'lucide-react';
import { CS_SUBJECTS } from '../data/topics';
import Modal from '../components/ui/Modal';
import ChapterList from '../components/ChapterList';
import type { Chapter } from '../types';

export default function CSFundamentals() {
  const [active, setActive] = useState<{ id: string; name: string; abbr: string; chapters: Chapter[] } | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// cs fundamentals</p>
        <h1 className="section-title mt-3">Computer Science Fundamentals</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          The five core subjects every product-company panel probes. Pick a subject to see chapters,
          lectures, notes and practice slots.
        </p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CS_SUBJECTS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive({ id: s.id, name: s.name, abbr: s.abbr, chapters: [...s.chapters] })}
              className="focus-ring glass card-hover group flex flex-col rounded-2xl p-6 text-left shadow-card-sm"
              id={s.id}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-elevated shadow-card-sm">
                <Icon size={22} className="text-accent" aria-hidden />
              </span>
              <span className="mt-4 flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-accent2">{s.abbr}</span>
                <span className="font-bold tracking-tight">{s.name}</span>
              </span>
              <span className="mt-2 text-sm leading-relaxed text-muted">{s.description}</span>
              <span className="mt-4 flex items-center gap-2 text-xs text-muted">
                <Layers3 size={13} /> {s.chapters.length} chapters
                <span className="ml-auto font-mono text-[11px] text-accent opacity-0 transition group-hover:opacity-100">→ open</span>
              </span>
            </button>
          );
        })}
      </div>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active ? `${active.name} (${active.abbr})` : ''}
        subtitle="Chapters include curated official-doc notes; lecture slots are labelled when pending."
        size="xl"
      >
        {active && <ChapterList chapters={active.chapters} />}
      </Modal>

      <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted">
        <GraduationCap size={14} className="text-accent" />
        Completion and bookmarks persist locally per user.
      </div>
    </div>
  );
}
