"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User, Role } from "@/types";

export interface AuthContextValue extends User {
  role: Role;
  group_id?: number;
  user_id?: number;
}

export const AuthCtx = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authValue, setAuthValue] = useState<AuthContextValue | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAuthValue(null);
          setLoading(false);
          return;
        }

        // Fetch user from database with role
        const response = await fetch(`/api/user/role?authId=${user.id}`);
        const data = await response.json();
        
        if (data.user) {
          setAuthValue({
            name: `${data.user.first_name} ${data.user.surname}`,
            email: data.user.email,
            avatar: null,
            role: data.user.role_name as Role,
            group: data.user.group_name || "",
            user_id: data.user.user_id,
            group_id: data.user.group_id
          });
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setAuthValue(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <AuthCtx.Provider value={authValue}>
      {children}
    </AuthCtx.Provider>
  );
}
