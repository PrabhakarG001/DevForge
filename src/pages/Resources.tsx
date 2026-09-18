import { useMemo, useState } from 'react';
import { BookOpen, Filter, FileText, PlayCircle, Search } from 'lucide-react';
import { TOPICS, CS_SUBJECTS } from '../data/topics';
import type { ResourceSlot } from '../types';
import EmptyState from '../components/ui/EmptyState';

type Row = { topic: string; chapter: string; slot: ResourceSlot };

const KINDS = [
  { id: 'all', label: 'Everything' },
  { id: 'notes', label: 'Notes' },
  { id: 'lectures', label: 'Lectures' },
] as const;

function collect(kind: 'notes' | 'lectures'): Row[] {
  const rows: Row[] = [];
  for (const t of TOPICS) {
    for (const c of t.chapters) {
      for (const s of (kind === 'notes' ? c.notes : c.lectures)) {
        rows.push({ topic: t.shortTitle, chapter: c.title, slot: s });
      }
    }
  }
  for (const s of CS_SUBJECTS) {
    for (const c of s.chapters) {
      for (const slot of (kind === 'notes' ? c.notes : c.lectures)) {
        rows.push({ topic: s.abbr, chapter: c.title, slot });
      }
    }
  }
  return rows;
}

export default function Resources() {
  const [kind, setKind] = useState<(typeof KINDS)[number]['id']>('all');
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const base = kind === 'all' ? [...collect('notes'), ...collect('lectures')] : collect(kind);
    const q = query.trim().toLowerCase();
    return q ? base.filter((r) => `${r.topic} ${r.chapter} ${r.slot.title}`.toLowerCase().includes(q)) : base;
  }, [kind, query]);

  const availableCount = rows.filter((r) => r.slot.available).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">// resources</p>
        <h1 className="section-title mt-3">Lectures &amp; Notes Library</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          Every resource slot across all tracks. Verified links open official documentation;
          unavailable slots are clearly labelled — never presented as real content.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              className={`focus-ring flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-sm font-medium transition ${
                kind === k.id ? 'border-accent/60 bg-accent/10 text-accent' : 'border-line text-muted hover:text-ink'
              }`}
            >
              {k.id === 'notes' ? <FileText size={14} /> : k.id === 'lectures' ? <PlayCircle size={14} /> : <Filter size={14} />}
              {k.label}
            </button>
          ))}
        </div>
        <div className="flex w-full items-center gap-2 sm:w-72">
          <Search size={15} className="shrink-0 text-muted" />
          <input
            className="input"
            placeholder="Filter by topic or chapter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter resources"
          />
        </div>
      </div>

      <p className="mt-4 font-mono text-xs text-muted">
        {rows.length} resources · {availableCount} verified · {rows.length - availableCount} awaiting content
      </p>

      {rows.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={BookOpen}
            title="No matching resources"
            hint="Try a different filter or clear the search box."
            action={<button type="button" onClick={() => { setQuery(''); setKind('all'); }} className="btn-secondary">Reset filters</button>}
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {rows.map((r, i) => (
            <div key={i} className="glass card-hover flex items-center gap-3 rounded-xl p-4 shadow-card-sm">
              {r.slot.available ? <PlayCircle size={16} className="shrink-0 text-accent2" /> : <FileText size={16} className="shrink-0 text-muted" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.slot.title}</p>
                <p className="truncate text-xs text-muted">{r.topic} · {r.chapter}</p>
              </div>
              {r.slot.available && r.slot.link ? (
                <a
                  href={r.slot.link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="focus-ring badge border-accent/40 bg-accent/10 text-accent"
                >
                  open
                </a>
              ) : (
                <span className="badge border-line text-muted">pending</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
