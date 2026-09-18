import { CheckCircle2, Circle, FileText, PlayCircle, ExternalLink } from 'lucide-react';
import type { Chapter } from '../types';
import { DIFFICULTY_META } from '../types';
import { useProgress } from '../hooks/useProgress';

function ResourceRow({ slot }: { slot: Chapter['lectures'][number] }) {
  if (slot.available && slot.link) {
    return (
      <a
        href={slot.link.url}
        target="_blank"
        rel="noreferrer noopener"
        className="focus-ring group flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-elevated"
      >
        {slot.link.kind === 'lecture'
          ? <PlayCircle size={15} className="mt-0.5 shrink-0 text-accent2" />
          : <FileText size={15} className="mt-0.5 shrink-0 text-accent" />}
        <span className="min-w-0">
          <span className="block font-medium group-hover:text-accent">{slot.title}</span>
          <span className="block text-xs text-muted">{slot.description}</span>
        </span>
        <ExternalLink size={12} className="ml-auto mt-1 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
      </a>
    );
  }
  return (
    <div className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted">
      {slot.link?.kind === 'lecture'
        ? <PlayCircle size={15} className="mt-0.5 shrink-0" />
        : <FileText size={15} className="mt-0.5 shrink-0" />}
      <span>
        <span className="block">{slot.title}</span>
        <span className="block text-xs">{slot.description}</span>
      </span>
    </div>
  );
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const { isChapterComplete, toggleChapter } = useProgress();
  const done = isChapterComplete(chapter.id);
  const dm = DIFFICULTY_META[chapter.difficulty];
  return (
    <article id={chapter.id} className="glass scroll-mt-24 rounded-2xl p-5 shadow-card-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold tracking-tight">{chapter.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{chapter.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${dm.bg} ${dm.border} ${dm.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dm.dot}`} /> {chapter.difficulty}
          </span>
          <span className="badge border-line text-muted">~{chapter.minutes} min</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">Lectures</p>
          <div className="space-y-0.5">
            {chapter.lectures.map((s, i) => <ResourceRow key={i} slot={s} />)}
          </div>
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">Notes</p>
          <div className="space-y-0.5">
            {chapter.notes.map((s, i) => <ResourceRow key={i} slot={s} />)}
          </div>
        </div>
        <div>
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted">Practice</p>
          <div className="space-y-0.5">
            {chapter.practice.map((s, i) => <ResourceRow key={i} slot={s} />)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
        <button
          type="button"
          onClick={() => toggleChapter(chapter.id)}
          className={`btn ${done ? 'bg-good/15 text-good border border-good/40' : 'btn-secondary'} !py-1.5 !text-xs`}
          aria-pressed={done}
        >
          {done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          {done ? 'Completed' : 'Mark complete'}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{chapter.id}</span>
      </div>
    </article>
  );
}

export default function ChapterList({ chapters }: { chapters: Chapter[] }) {
  return (
    <div className="space-y-4">
      {chapters.map((c) => <ChapterCard key={c.id} chapter={c} />)}
    </div>
  );
}
