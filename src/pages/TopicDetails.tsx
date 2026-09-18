import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookMarked, BookOpen, Clock3, ListTree, PlayCircle } from 'lucide-react';
import { getTopicBySlug, TOPICS } from '../data/topics';
import { DIFFICULTY_META } from '../types';
import ChapterList from '../components/ChapterList';
import ProgressRing from '../components/ui/ProgressRing';
import EmptyState from '../components/ui/EmptyState';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import { useProgress } from '../hooks/useProgress';

const DIFF_FILTERS = ['all', 'Beginner', 'Intermediate', 'Advanced'] as const;

export default function TopicDetails() {
  const { slug = '' } = useParams();
  const topic = getTopicBySlug(slug);
  const [filter, setFilter] = useState<(typeof DIFF_FILTERS)[number]>('all');
  const { isBookmarked, toggleBookmark, topicProgress } = useProgress();

  const filteredChapters = useMemo(() => {
    if (!topic) return [];
    return filter === 'all'
      ? topic.chapters
      : topic.chapters.filter((c) => c.difficulty === filter);
  }, [topic, filter]);

  if (!topic) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <EmptyState
          icon={ListTree}
          title="Track not found"
          hint={`No learning track matches “${slug}”. Browse all tracks from the home page.`}
          action={<Link to="/" className="btn-primary">Back to Home</Link>}
        />
      </div>
    );
  }

  const prog = topicProgress(topic.chapters.map((c) => c.id));
  const dm = DIFFICULTY_META[topic.difficulty];
  const Icon = topic.icon;
  const bookmarkKey = `topic-${topic.id}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted">
        <Link to="/" className="focus-ring rounded hover:text-accent">Home</Link>
        <span>/</span>
        <span className="text-ink">{topic.shortTitle}</span>
      </nav>

      {/* header card */}
      <header className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-card sm:p-9">
        <div
          aria-hidden
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--c-accent)/0.15) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-accent)/0.15) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-elevated shadow-card-sm">
                <Icon size={22} className="text-accent" aria-hidden />
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-muted">{topic.categoryLabel}</span>
              <ImportanceBadge level={topic.importance} />
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{topic.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{topic.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`badge ${dm.bg} ${dm.border} ${dm.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dm.dot}`} /> {topic.difficulty}
              </span>
              <span className="badge border-line text-muted"><Clock3 size={12} /> {topic.chapters.length} chapters</span>
              <span className="badge border-line text-muted"><PlayCircle size={12} /> {topic.lectureCount} lectures</span>
              <span className="badge border-line text-muted"><BookOpen size={12} /> {topic.noteCount} notes</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <ProgressRing pct={prog.pct} size={84} stroke={6} label={`${topic.shortTitle} ${prog.pct}% complete`} />
            <span className="text-xs text-muted">{prog.done}/{prog.total} chapters</span>
            <button
              type="button"
              onClick={() => toggleBookmark(bookmarkKey)}
              aria-pressed={isBookmarked(bookmarkKey)}
              className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                isBookmarked(bookmarkKey)
                  ? 'border-accent/60 bg-accent/10 text-accent'
                  : 'border-line text-muted hover:border-accent/40 hover:text-accent'
              }`}
            >
              <BookMarked size={14} /> {isBookmarked(bookmarkKey) ? 'Bookmarked' : 'Bookmark track'}
            </button>
          </div>
        </div>
      </header>

      {/* chapter browser */}
      <section className="mt-10" aria-label="Chapters">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Chapters</h2>
          <div className="flex flex-wrap gap-2">
            {DIFF_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`focus-ring rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  filter === f ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line text-muted hover:text-ink'
                }`}
              >
                {f === 'all' ? 'All levels' : f}
              </button>
            ))}
          </div>
        </div>

        {filteredChapters.length === 0 ? (
          <EmptyState icon={ListTree} title="No chapters at this level" hint="Try another difficulty filter." />
        ) : (
          <ChapterList chapters={filteredChapters} />
        )}
      </section>

      {/* prev / next topic navigation */}
      <PrevNext slug={topic.slug} />
    </div>
  );
}

function PrevNext({ slug }: { slug: string }) {
  const idx = TOPICS.findIndex((t) => t.slug === slug);
  const prev = idx > 0 ? TOPICS[idx - 1] : undefined;
  const next = idx >= 0 && idx < TOPICS.length - 1 ? TOPICS[idx + 1] : undefined;
  if (!prev && !next) return null;
  return (
    <nav aria-label="Track pagination" className="mt-10 flex items-center justify-between gap-4">
      {prev ? (
        <Link to={`/learn/${prev.slug}`} className="focus-ring glass card-hover group flex items-center gap-3 rounded-2xl p-4 text-left">
          <ArrowLeft size={18} className="text-muted transition group-hover:text-accent" />
          <span>
            <span className="block text-xs text-muted">Previous track</span>
            <span className="block font-semibold">{prev.shortTitle}</span>
          </span>
        </Link>
      ) : <span />}
      {next ? (
        <Link to={`/learn/${next.slug}`} className="focus-ring glass card-hover group flex items-center gap-3 rounded-2xl p-4 text-right">
          <span>
            <span className="block text-xs text-muted">Next track</span>
            <span className="block font-semibold">{next.shortTitle}</span>
          </span>
          <ArrowRight size={18} className="text-muted transition group-hover:text-accent" />
        </Link>
      ) : <span />}
    </nav>
  );
}
