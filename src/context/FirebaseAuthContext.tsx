"use client";

<<<<<<< Updated upstream
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  role: 'Admin' | 'Treasurer' | 'Member';
  getIdToken: () => Promise<string>;
=======
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
>>>>>>> Stashed changes
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const FirebaseAuthContext = createContext<AuthContextType | null>(null);

// 2. The Provider Component (NAMED EXPORT)
export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
<<<<<<< Updated upstream
  const [user, setUser] = useState<AuthUser | null>(null);
=======
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
>>>>>>> Stashed changes
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);

  // Listen to real-time updates for the user's Firestore document
  useEffect(() => {
    if (!firebaseUser) return;

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name,
          role: userData.role,
          getIdToken: () => firebaseUser.getIdToken(),
        });
      }
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
<<<<<<< Updated upstream
    console.log("Setting up onAuthStateChanged listener");
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        console.log("User found:", fbUser.uid);
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        let userData = userDoc.data();
        
        console.log("Firestore user data:", userData);
        
        if (!userData) {
          console.log("No Firestore doc, creating one");
          const usersSnapshot = await getDoc(doc(db, 'meta', 'counts'));
          const userCount = usersSnapshot.exists() ? usersSnapshot.data()?.userCount || 0 : 0;
          const role = userCount === 0 ? 'Admin' : 'Member';
          
          userData = {
            email: fbUser.email,
            name: fbUser.email?.split('@')[0] || 'User',
            role,
            createdAt: new Date().toISOString(),
          };
          
          await setDoc(doc(db, 'users', fbUser.uid), userData);
          await setDoc(doc(db, 'meta', 'counts'), { userCount: userCount + 1 });
        }
        
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          name: userData.name,
          role: userData.role,
          getIdToken: () => fbUser.getIdToken(),
        });
      } else {
        setUser(null);
=======
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
>>>>>>> Stashed changes
      }
      setLoading(false);
    });

<<<<<<< Updated upstream
    return () => unsubscribe();
  }, []);
=======
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
>>>>>>> Stashed changes

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

  const signup = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    const usersSnapshot = await getDoc(doc(db, 'meta', 'counts'));
    const userCount = usersSnapshot.exists() ? usersSnapshot.data()?.userCount || 0 : 0;
    const role = userCount === 0 ? 'Admin' : 'Member';
    
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    });
    
    await setDoc(doc(db, 'meta', 'counts'), { userCount: userCount + 1 });
  };

  const logout = async () => {
    await signOut(auth);
  };

<<<<<<< Updated upstream
  const refreshUser = async () => {
    if (firebaseUser) {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();
      if (userData) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name,
          role: userData.role,
          getIdToken: () => firebaseUser.getIdToken(),
        });
      }
    }
  };

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </FirebaseAuthContext.Provider>
=======
  return (
    <AuthContext.Provider value={{ user, userRole, userName, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
>>>>>>> Stashed changes
  );
}

// 3. The Custom Hook (NAMED EXPORT)
export const useFirebaseAuth = () => {
<<<<<<< Updated upstream
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return ctx;
};
=======
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useFirebaseAuth must be used within FirebaseAuthProvider");
  }
  return context;
};
>>>>>>> Stashed changes
