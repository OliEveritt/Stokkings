"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, increment, updateDoc } from 'firebase/firestore';
import type { Role } from '@/types/enums';

interface AuthUser {
  uid: string;
  email: string | null;
  name: string;
  role: Role;
  getIdToken: () => Promise<string>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  userRole: Role;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string, name: string) => Promise<UserCredential>;
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
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();
        
        // Fallback: Create doc if it doesn't exist (e.g., if signup was interrupted)
        if (!userData) {
          const metaRef = doc(db, 'meta', 'counts');
          const metaSnap = await getDoc(metaRef);
          const userCount = metaSnap.exists() ? metaSnap.data()?.userCount || 0 : 0;
          const role: Role = userCount === 0 ? 'Admin' : 'Member';
          
          userData = {
            email: fbUser.email,
            name: fbUser.email?.split('@')[0] || 'User',
            role,
            createdAt: new Date().toISOString(),
          };
          
          await setDoc(userDocRef, userData);
          await setDoc(metaRef, { userCount: increment(1) }, { merge: true });
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

  const login = async (email: string, password: string): Promise<UserCredential> => {
    // Return the result so LoginPage can access .user.getIdToken()
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string): Promise<UserCredential> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    const metaRef = doc(db, 'meta', 'counts');
    const metaSnap = await getDoc(metaRef);
    const userCount = metaSnap.exists() ? metaSnap.data()?.userCount || 0 : 0;
    const role: Role = userCount === 0 ? 'Admin' : 'Member';
    
    await setDoc(doc(db, 'users', result.user.uid), {
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    });
    
    // Atomically increment the count
    await setDoc(metaRef, { userCount: increment(1) }, { merge: true });
    
    return result;
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

  const userRole: Role = user?.role ?? 'Member';

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, userRole, login, signup, logout, refreshUser }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  return ctx;
};