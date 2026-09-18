import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { AppUser } from '../types';
import { firebaseConfigured as authConfigured, getFirebaseAuth } from '../lib/firebase';

/**
 * Google-only authentication.
 *
 * - With `VITE_FIREBASE_*` env vars set: real Firebase Google sign-in.
 * - Without them: a clearly-labelled "demo session" so the UI (protected
 *   routes, profile menu, per-user progress) can be exercised locally.
 *   No passwords are ever collected or stored; the demo session lives in
 *   localStorage only and never pretends to be a real Google account.
 */

const DEMO_KEY = 'devforge.demoUser';

const toAppUser = (u: User): AppUser => ({
  uid: u.uid,
  displayName: u.displayName,
  email: u.email,
  photoURL: u.photoURL,
});

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  demoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authConfigured) {
      // demo session restore
      try {
        const raw = localStorage.getItem(DEMO_KEY);
        if (raw) setUser(JSON.parse(raw) as AppUser);
      } catch {
        /* ignore */
      }
      setLoading(false);
      return;
    }
    let unsub = () => {};
    void (async () => {
      const auth = await getFirebaseAuth();
      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u ? toAppUser(u) : null);
        setLoading(false);
      });
    })();
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!authConfigured) {
      const demo: AppUser = {
        uid: 'demo-user',
        displayName: 'Demo Developer',
        email: 'demo@devforge.local',
        photoURL: null,
      };
      try {
        localStorage.setItem(DEMO_KEY, JSON.stringify(demo));
      } catch {
        /* ignore */
      }
      setUser(demo);
      return;
    }
    try {
      const auth = await getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed. Try again.');
    }
  }, []);

  const logout = useCallback(async () => {
    if (!authConfigured) {
      try {
        localStorage.removeItem(DEMO_KEY);
      } catch {
        /* ignore */
      }
      setUser(null);
      return;
    }
    try {
      const auth = await getFirebaseAuth();
      await signOut(auth);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-out failed.');
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, demoMode: !authConfigured, signInWithGoogle, logout, error }),
    [user, loading, signInWithGoogle, logout, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
