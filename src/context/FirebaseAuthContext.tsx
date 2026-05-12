/**
 * US-3.6: Edit Profile Information
 * Firebase Auth Context with refreshUser method and phone number support
 */

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Role } from "@/types";

export interface AppUser {
  uid: string;
  email: string | null;
  name: string;
  phone?: string;
  role: Role;
  groupId?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signup: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (data: { name?: string; phone?: string; email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadAppUser(fbUser: FirebaseUser): Promise<AppUser> {
  const snap = await getDoc(doc(db, "users", fbUser.uid));
  const data = snap.exists() ? snap.data() : {};
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    name: (data.name as string) || (data.fullName as string) || fbUser.displayName || "User",
    phone: data.phone as string || "",
    role: (data.role as Role) || "Member",
    groupId: data.groupId as string | undefined,
  };
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const appUser = await loadAppUser(fbUser);
          setUser(appUser);
        } catch (err) {
          console.error("Failed to load user profile:", err);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || "User",
            role: "Member",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshUser = async () => {
    if (firebaseUser) {
      const appUser = await loadAppUser(firebaseUser);
      setUser(appUser);
    }
  };

  const updateUserProfile = async (data: { name?: string; phone?: string; email?: string }) => {
    if (!user?.uid) throw new Error("No user logged in");

    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, "users", user.uid), updates);
    }

    if (data.email !== undefined && firebaseUser && data.email !== firebaseUser.email) {
      await updateEmail(firebaseUser, data.email);
    }

    await refreshUser();
  };

  const signup = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", result.user.uid), {
        email,
        name: fullName,
        phone: phone || null,
        role: "Member",
        createdAt: new Date(),
      });
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        throw new Error("This email is already registered. Please sign in.");
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, refreshUser, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useFirebaseAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  return ctx;
};
