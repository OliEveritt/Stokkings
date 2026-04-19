"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  role: 'Admin' | 'Treasurer' | 'Member';
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const FirebaseAuthContext = createContext<AuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up onAuthStateChanged listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged triggered:", firebaseUser?.email);
      if (firebaseUser) {
        console.log("User found:", firebaseUser.uid);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        let userData = userDoc.data();
        
        console.log("Firestore user data:", userData);
        
        if (!userData) {
          console.log("No Firestore doc, creating one");
          const usersSnapshot = await getDoc(doc(db, 'meta', 'counts'));
          const userCount = usersSnapshot.exists() ? usersSnapshot.data()?.userCount || 0 : 0;
          const role = userCount === 0 ? 'Admin' : 'Member';
          
          userData = {
            email: firebaseUser.email,
            name: firebaseUser.email?.split('@')[0] || 'User',
            role,
            createdAt: new Date().toISOString(),
          };
          
          await setDoc(doc(db, 'users', firebaseUser.uid), userData);
          await setDoc(doc(db, 'meta', 'counts'), { userCount: userCount + 1 });
        }
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: userData.name,
          role: userData.role,
          getIdToken: () => firebaseUser.getIdToken(),
        });
      } else {
        console.log("No user found");
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    console.log("Login called for:", email);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", result.user.email);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    console.log("Signup called for:", email);
    const result = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Signup successful:", result.user.uid);
    
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

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return ctx;
};
