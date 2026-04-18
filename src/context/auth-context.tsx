"use client";

import { createContext, useContext } from "react";
import type { User, Role } from "@/types";

export interface AuthContextValue extends User {
  role: Role;
  group_id?: number;
}

export const AuthCtx = createContext<AuthContextValue | null>(null);
export const useAuth = () => useContext(AuthCtx);
