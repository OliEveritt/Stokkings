import type { Role } from "./enums";
export type { Role } from "./enums";

export interface User {
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
  group: string;
}

export interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
}

export interface Rates {
  repo: number;
  prime: number;
  updated: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: Role[];
  path: string;
}