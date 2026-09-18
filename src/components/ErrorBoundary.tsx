import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string | null }

/** Catches render errors and shows a recoverable state instead of a white screen. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook a real telemetry service (Sentry etc.) here in production.
    console.error('DevForge render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="glass max-w-md rounded-2xl p-8 text-center shadow-card">
          <AlertTriangle size={26} className="mx-auto text-warn" />
          <h1 className="mt-4 text-lg font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted">{this.state.message ?? 'An unexpected render error occurred.'}</p>
          <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-6">
            Reload DevForge
          </button>
        </div>
      </div>
    );
  }
}
