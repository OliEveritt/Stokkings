import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getOrInitApp(): FirebaseApp {
  if (_app) return _app;
  const existing = getApps()[0];
  if (existing) {
    _app = existing;
    return _app;
  }
  _app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return _app;
}

function getAuthInstance(): Auth {
  if (!_auth) _auth = getAuth(getOrInitApp());
  return _auth;
}

function getDbInstance(): Firestore {
  if (!_db) _db = getFirestore(getOrInitApp());
  return _db;
}

// Backwards-compatible exports — use Proxy so consumers can keep doing
// `import { db, auth } from '@/lib/firebase'` and pass them straight to
// collection() / getAuth(...). Init happens on first property read,
// not on module import (so prerender/build doesn't crash if envs are
// missing or wrong at build time).
export const app = new Proxy({} as FirebaseApp, {
  get(_t, prop) {
    const target = getOrInitApp();
    const value = (target as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
});

export const auth = new Proxy({} as Auth, {
  get(_t, prop) {
    const target = getAuthInstance();
    const value = (target as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
});

export const db = new Proxy({} as Firestore, {
  get(_t, prop) {
    const target = getDbInstance();
    const value = (target as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(target) : value;
  },
});
