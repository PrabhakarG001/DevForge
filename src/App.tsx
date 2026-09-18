import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './hooks/useTheme';
import { ProgressProvider } from './hooks/useProgress';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InterviewDataProvider } from './hooks/useInterviewData';

const Home = lazy(() => import('./pages/Home'));
const LearningPath = lazy(() => import('./pages/LearningPath'));
const TopicDetails = lazy(() => import('./pages/TopicDetails'));
const CSFundamentals = lazy(() => import('./pages/CSFundamentals'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep'));
const Resources = lazy(() => import('./pages/Resources'));
const Progress = lazy(() => import('./pages/Progress'));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="font-mono text-xs uppercase tracking-widest text-muted">loading module…</p>
      </div>
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-6xl font-extrabold text-accent">404</p>
      <p className="mt-4 text-lg font-semibold">Page not found</p>
      <p className="mt-1 text-sm text-muted">The route you requested does not exist on this deployment.</p>
      <a href="/" className="btn-primary mt-6">Back to Home</a>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
      >
        <Suspense fallback={<PageFallback />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="/learn/:slug" element={<TopicDetails />} />
            <Route path="/cs-fundamentals" element={<CSFundamentals />} />
            <Route path="/interview-prep" element={<InterviewPrep />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );
}

function Providers() {
  const { user } = useAuth();
  return (
    <ProgressProvider>
      <InterviewDataProvider uid={user?.uid ?? null}>
        <BrowserRouter>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">
              <AnimatedRoutes />
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </InterviewDataProvider>
    </ProgressProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Providers />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
