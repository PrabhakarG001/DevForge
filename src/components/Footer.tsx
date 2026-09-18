import { Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-line/70 bg-surface/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
            <Terminal size={15} className="text-accent" />
          </span>
          <div>
            <p className="text-sm font-bold tracking-tight">Dev<span className="text-accent">Forge</span></p>
            <p className="text-xs text-muted">Master the skills. Earn the offer.</p>
          </div>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
          <Link to="/learning-path" className="focus-ring rounded hover:text-accent">Learning Path</Link>
          <Link to="/interview-prep" className="focus-ring rounded hover:text-accent">Interview Prep</Link>
          <Link to="/resources" className="focus-ring rounded hover:text-accent">Resources</Link>
          <Link to="/progress" className="focus-ring rounded hover:text-accent">Progress</Link>
        </nav>
        <p className="font-mono text-[11px] text-muted">© {new Date().getFullYear()} DevForge · built for SDE aspirants</p>
      </div>
    </footer>
  );
}
