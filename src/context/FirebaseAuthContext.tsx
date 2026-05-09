"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, increment } from "firebase/firestore";
import type { Role } from "@/types/enums";

interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  role: Role;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  userRole: Role;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const FirebaseAuthContext = createContext<AuthContextType | null>(null);

async function setSessionCookie(idToken: string) {
  try {
    await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch (e) { console.error("Session cookie error:", e); }
}

async function clearSessionCookie() {
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch (e) { console.error("Clear session error:", e); }
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  useEffect(() => {
    if (!firebaseUser) return;
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: userData.name, role: userData.role, getIdToken: (f?: boolean) => firebaseUser.getIdToken(f) });
      }
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        await setSessionCookie(idToken);
        const userDoc = await getDoc(doc(db, "users", fbUser.uid));
        let userData = userDoc.data();
        if (!userData) {
          // Doc may not exist yet (signup in progress) - retry after delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryDoc = await getDoc(doc(db, "users", fbUser.uid));
          userData = retryDoc.data();
          if (!userData) {
            setLoading(false);
            return;
          }
        }
        setUser({ uid: fbUser.uid, email: fbUser.email, name: userData.name, role: userData.role, getIdToken: (f?: boolean) => fbUser.getIdToken(f) });
      } else {
        setUser(null);
        await clearSessionCookie();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();
    await setSessionCookie(idToken);
  };

  const signup = async (email: string, password: string, name: string, phone?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const metaRef = doc(db, "meta", "counts");
    const metaSnap = await getDoc(metaRef);
    const userCount = metaSnap.exists() ? metaSnap.data()?.userCount || 0 : 0;
    const role: Role = userCount === 0 ? "Admin" : "Member";
    const nameParts = name.trim().split(" ");
    await setDoc(doc(db, "users", result.user.uid), {
      email,
      name,
      firstName: nameParts[0] || "",
      surname: nameParts.slice(1).join(" ") || "",
      phone: phone || "",
      role,
      createdAt: new Date().toISOString(),
    });
    await setDoc(metaRef, { userCount: increment(1) }, { merge: true });
    const idToken = await result.user.getIdToken();
    await setSessionCookie(idToken);
  };

  const logout = async () => {
    await signOut(auth);
    await clearSessionCookie();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();
      if (userData) {
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: userData.name, role: userData.role, getIdToken: (f?: boolean) => firebaseUser.getIdToken(f) });
      }
    }
  };

  const userRole: Role = user?.role ?? "Member";

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, userRole, login, signup, logout, refreshUser }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  return ctx;
};





