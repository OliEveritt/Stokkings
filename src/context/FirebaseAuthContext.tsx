"use client";

import type { FirebaseError } from "firebase/app";
import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential, // Added for the updated signup return type
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// 1. Define the Context Interface
interface AuthContextType {
  user: User | null;
  userRole: string | null;
  userName: string | null;
  loading: boolean;
  signup: (email: string, password: string, fullName: string, phone?: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. The Provider Component (NAMED EXPORT)
export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role || "Member");
            setUserName(data.fullName || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User");
          } else {
            setUserRole("Member");
            setUserName(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User");
          }
        } catch (err) {
          console.error("Failed to fetch user role", err);
          setUserRole("Member");
          setUserName(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User");
        }
      } else {
        setUserRole(null);
        setUserName(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, fullName: string, phone?: string): Promise<UserCredential> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = result.user;

      // Initial user document creation
      await setDoc(doc(db, "users", newUser.uid), {
        email,
        fullName,
        phone: phone || null,
        role: "Member", // Matches capitalized casing for security rules
        createdAt: new Date(),
      });

      return result; // Returning the credential so SignUpPage can access the UID
    } catch (error) {
      const fbError = error as FirebaseError;
      if (fbError.code === "auth/email-already-in-use") {
        throw new Error("This email is already registered. Please sign in instead.");
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const fbError = error as FirebaseError;
      if (fbError.code === "auth/invalid-credential" || fbError.code === "auth/user-not-found") {
        throw new Error("Invalid email or password. If you haven't signed up yet, please register first.");
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, userName, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. The Custom Hook (NAMED EXPORT)
export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  }
  return context;
};