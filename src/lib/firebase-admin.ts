import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';

let app: App | null = null;

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env');
  }

  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return app;
}

let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
  return _adminAuth;
}

// Backwards-compatible Proxy exports — defer init until first property access.
export const adminDb = new Proxy({} as Firestore, {
  get(_t, prop) {
    const target = getAdminDb();
    const value = (target as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_t, prop) {
    const target = getAdminAuth();
    const value = (target as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
});
