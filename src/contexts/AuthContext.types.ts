import { createContext, type ReactNode } from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";

export type UserRole = "admin" | "customer" | null;

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  roleLoading: boolean;

  signUp: (email: string, password: string, options?: { data?: { full_name?: string; }; }) => Promise<{ data: { user: User | null; session: Session | null; }; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null; }; error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: unknown; error: AuthError | null }>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}