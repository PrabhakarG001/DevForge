import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint: string;
  action?: React.ReactNode;
}

/** Friendly empty state with icon, title, hint and optional action button. */
export default function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <div className="mb-4 rounded-xl border border-line bg-elevated/60 p-3.5 text-muted">
        <Icon size={22} aria-hidden />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
