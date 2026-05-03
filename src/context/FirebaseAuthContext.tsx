"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", result.user.uid), {
        email,
        fullName,
        phone: phone || null,
        role: "Member",
        createdAt: new Date(),
      });
      // Optional meta update
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") throw new Error("This email is already registered. Please sign in.");
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, signup, login, logout }}>{children}</AuthContext.Provider>;
}

export const useFirebaseAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
};