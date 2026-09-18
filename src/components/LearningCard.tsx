import { motion } from 'framer-motion';
import { BookMarked, BookOpen, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Topic } from '../types';
import { DIFFICULTY_META } from '../types';
import { useProgress } from '../hooks/useProgress';
import ImportanceBadge from './ui/ImportanceBadge';
import ProgressRing from './ui/ProgressRing';

interface LearningCardProps {
  topic: Topic;
  index?: number;
}

/** Gradient header block that stands in for topic artwork (no fake stock imagery). */
function TopicArt({ topic }: { topic: Topic }) {
  const Icon = topic.icon;
  const gradients: Record<string, string> = {
    dsa: 'from-indigo-500/25 via-surface to-cyan-500/10',
    fullstack: 'from-cyan-500/25 via-surface to-emerald-500/10',
    aiml: 'from-violet-500/25 via-surface to-pink-500/10',
    'gen-ai': 'from-fuchsia-500/25 via-surface to-indigo-500/10',
    'number-theory': 'from-amber-500/25 via-surface to-rose-500/10',
  };
  return (
    <div className={`relative flex h-28 items-center justify-center overflow-hidden rounded-t-2xl border-b border-line bg-gradient-to-br ${gradients[topic.id] ?? 'from-accent/20 via-surface to-accent2/10'}`}>
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'linear-gradient(rgb(var(--c-border)/0.25) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-border)/0.25) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-elevated/80 shadow-card-sm">
        <Icon size={26} className="text-accent" aria-hidden />
      </div>
    </div>
  );
}

export default function LearningCard({ topic, index = 0 }: LearningCardProps) {
  const { isBookmarked, toggleBookmark, topicProgress } = useProgress();
  const dm = DIFFICULTY_META[topic.difficulty];
  const chapterIds = topic.chapters.map((c) => c.id);
  const prog = topicProgress(chapterIds);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="glass card-hover group relative flex h-full flex-col rounded-2xl shadow-card-sm"
    >
      <TopicArt topic={topic} />
      <span className="absolute right-3 top-3 z-10">
        <ImportanceBadge level={topic.importance} />
      </span>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{topic.categoryLabel}</p>
            <h3 className="mt-1 truncate text-lg font-bold tracking-tight">{topic.title}</h3>
          </div>
          <button
            type="button"
            onClick={() => toggleBookmark(`topic-${topic.id}`)}
            aria-label={isBookmarked(`topic-${topic.id}`) ? `Remove ${topic.title} bookmark` : `Bookmark ${topic.title}`}
            aria-pressed={isBookmarked(`topic-${topic.id}`)}
            className={`focus-ring rounded-lg border p-2 transition ${
              isBookmarked(`topic-${topic.id}`)
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-line text-muted hover:border-accent/40 hover:text-accent'
            }`}
          >
            <BookMarked size={16} />
          </button>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{topic.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`badge ${dm.bg} ${dm.border} ${dm.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dm.dot}`} />
            {topic.difficulty}
          </span>
          <span className="badge border-line text-muted"><PlayCircle size={12} /> {topic.lectureCount} lectures</span>
          <span className="badge border-line text-muted"><BookOpen size={12} /> {topic.noteCount} notes</span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <ProgressRing pct={prog.pct} size={42} label={`${topic.shortTitle} ${prog.pct}% complete`} />
          <Link to={`/learn/${topic.slug}`} className="btn-primary flex-1 justify-center !py-2">
            <BookOpen size={15} /> Open Learning
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
