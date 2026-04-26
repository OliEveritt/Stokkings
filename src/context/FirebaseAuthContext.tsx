"use client";

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

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
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
  );
}

export const useFirebaseAuth = () => {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  return ctx;
};
