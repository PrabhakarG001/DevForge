import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  LogOut,
  Map,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/learning-path', label: 'Learning Path', end: false },
  { to: '/interview-prep', label: 'Interview Prep', end: false },
  { to: '/resources', label: 'Resources', end: false },
  { to: '/progress', label: 'Progress', end: false },
];

/** Small multicolor "G" matching Google's brand shapes. */
export function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86a5.4 5.4 0 0 1-5.06-3.7H.94v2.34A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.94 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.94a9 9 0 0 0 0 8.12l3-2.34Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .94 4.94l3 2.34A5.4 5.4 0 0 1 9 3.58Z"
      />
    </svg>
  );
}

function ThemeMenu() {
  const { theme, setTheme, themes: allThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border text-muted transition hover:border-accent/50 hover:text-accent"
        aria-label="Change theme"
        aria-expanded={open}
      >
        <Settings2 size={17} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute right-0 top-11 z-50 w-64 rounded-xl p-2 shadow-card"
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-widest text-muted">
              Theme
            </p>
            {allThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`focus-ring flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                  theme === t.id ? 'bg-accent/15 text-accent' : 'hover:bg-elevated'
                }`}
              >
                <span>
                  <span className="block font-medium">{t.name}</span>
                  <span className="block text-xs text-muted">{t.hint}</span>
                </span>
                {theme === t.id && <span className="text-xs font-bold">●</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/** Full-screen ⌘K search with categorized results and recent searches. */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('devforge.recentSearches') ?? '[]') as string[];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => searchDocsSafe(query), [query]);

  const commit = (term: string) => {
    setRecent((prev) => {
      const next = [term, ...prev.filter((t) => t !== term)].slice(0, 5);
      try {
        localStorage.setItem('devforge.recentSearches', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const go = (to: string, term?: string) => {
    if (term) commit(term);
    onClose();
    navigate(to);
  };

  const kindLabel: Record<string, string> = {
    topic: 'Topic',
    subject: 'Subject',
    chapter: 'Chapter',
    question: 'Question',
    path: 'Path',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 p-4 pt-[10vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass-strong mx-auto w-full max-w-xl overflow-hidden rounded-2xl shadow-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search DevForge"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={18} className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && results.length > 0) go(results[0].to, query);
                }}
                placeholder="Search topics, chapters, questions…"
                className="w-full bg-transparent py-4 text-base outline-none placeholder:text-muted"
                aria-label="Search query"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="text-muted hover:text-ink">
                  <X size={16} />
                </button>
              )}
              <kbd className="hidden rounded border border-line bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
                ESC
              </kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {query.trim() === '' ? (
                <div className="p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Recent</p>
                  {recent.length === 0 ? (
                    <p className="px-1 py-3 text-sm text-muted">No recent searches yet. Try “dynamic programming” or “RAG”.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {recent.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setQuery(t)}
                          className="focus-ring rounded-full border border-line bg-elevated px-3 py-1 text-xs text-muted transition hover:border-accent/50 hover:text-accent"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-semibold">No results for “{query}”</p>
                  <p className="mt-1 text-sm text-muted">Try a broader term like “graphs”, “react” or “system design”.</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {results.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => go(r.to, query)}
                        className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-elevated"
                      >
                        <span className="badge border-line bg-elevated text-muted">{kindLabel[r.kind] ?? r.kind}</span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{r.title}</span>
                          <span className="block truncate text-xs text-muted">{r.subtitle}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// imported late to avoid a circular import with the data layer in fast refresh
import { searchDocs } from '../data/learningResources';
function searchDocsSafe(q: string) {
  return searchDocs(q);
}

export default function Navbar() {
  const { user, signInWithGoogle, logout, demoMode } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ⌘K / Ctrl+K opens search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    if (userOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userOpen]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `focus-ring rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'text-accent' : 'text-muted hover:text-ink'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-base/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* logo */}
          <Link to="/" className="focus-ring flex items-center gap-2.5 rounded-lg" aria-label="DevForge home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shadow-glow-sm">
              <Terminal size={18} className="text-white" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Dev<span className="text-accent">Forge</span>
            </span>
          </Link>

          {/* desktop links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkCls}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* right cluster */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="focus-ring flex h-9 items-center gap-2 rounded-lg border px-3 text-sm text-muted transition hover:border-accent/50 hover:text-accent"
              aria-label="Open search"
            >
              <Search size={16} />
              <kbd className="hidden rounded border border-line bg-elevated px-1.5 font-mono text-[10px] md:block">⌘K</kbd>
            </button>
            <ThemeMenu />

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((v) => !v)}
                  className="focus-ring flex items-center gap-2 rounded-full border p-1 pr-2.5 transition hover:border-accent/50"
                  aria-label="Account menu"
                  aria-expanded={userOpen}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {(user.displayName ?? 'U')[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:block">{user.displayName ?? 'Account'}</span>
                  <ChevronDown size={14} className="text-muted" />
                </button>
                <AnimatePresence>
                  {userOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="glass-strong absolute right-0 top-12 z-50 w-64 rounded-xl p-2 shadow-card"
                    >
                      <div className="border-b border-line px-2.5 pb-3 pt-2">
                        <p className="truncate text-sm font-semibold">{user.displayName}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                        {demoMode && (
                          <span className="badge mt-2 border-warn/40 bg-warn/10 text-warn">demo session · configure Firebase for real Google login</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUserOpen(false);
                          navigate('/progress');
                        }}
                        className="focus-ring mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition hover:bg-elevated"
                      >
                        <BookOpen size={15} /> My Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserOpen(false);
                          void logout();
                        }}
                        className="focus-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-bad transition hover:bg-bad/10"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button type="button" onClick={() => void signInWithGoogle()} className="btn-secondary !py-2">
                <GoogleG /> <span className="hidden sm:inline">Sign in</span> <span className="hidden sm:inline text-muted">with Google</span>
              </button>
            )}

            {/* mobile menu button */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border text-muted lg:hidden"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={17} /> : <Map size={17} />}
            </button>
          </div>
        </div>

        {/* mobile links */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-line/70 bg-base/95 lg:hidden"
              aria-label="Mobile"
            >
              <div className="space-y-1 px-4 py-3">
                {NAV_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `focus-ring block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-elevated hover:text-ink'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <p className="flex items-center gap-2 px-3 pb-1 pt-3 text-xs text-muted">
                  <Sparkles size={12} className="text-accent2" /> Master the skills. Earn the offer.
                </p>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
