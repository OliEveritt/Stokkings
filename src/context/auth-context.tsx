"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useFirebaseAuth } from "./FirebaseAuthContext";
import type { User, Role } from "@/types";

export interface AuthContextValue extends User {
  role: Role;
  group_id?: number;
  user_id?: string;
}

export const AuthCtx = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, loading } = useFirebaseAuth();
  const [authValue, setAuthValue] = useState<AuthContextValue | null>(null);

  useEffect(() => {
    if (!loading) {
      if (firebaseUser) {
        setAuthValue({
          name: firebaseUser.name,
          email: firebaseUser.email || "",
          avatar: null,
          role: firebaseUser.role,
          group: "Stokvel Group",
          user_id: firebaseUser.uid,
          group_id: undefined
        });
      } else {
        setAuthValue(null);
      }
    }
  }, [firebaseUser, loading]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthCtx.Provider value={authValue}>
      {children}
    </AuthCtx.Provider>
  );
}
