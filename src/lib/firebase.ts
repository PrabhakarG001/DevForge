import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/**
 * Lazy, optional Firebase. When env vars are missing the app keeps working
 * with local-only data (demo mode) — no network calls are made.
 */

export const firebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (app) return app;
  const { initializeApp, getApps } = await import('firebase/app');
  app = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
        appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
      });
  return app;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (auth) return auth;
  const { getAuth } = await import('firebase/auth');
  auth = getAuth(await getFirebaseApp());
  return auth;
}

export async function getDb(): Promise<Firestore> {
  if (db) return db;
  const { getFirestore } = await import('firebase/firestore');
  db = getFirestore(await getFirebaseApp());
  return db;
}
