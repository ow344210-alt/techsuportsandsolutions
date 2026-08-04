import {
  useEffect,
  useState,
} from "react";

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext.types";
import type { AuthContextType, AuthProviderProps, UserRole } from "./AuthContext.types";

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);

  const [session, setSession] = useState<Session | null>(null);

  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  async function loadRole(userId: string | undefined) {
    if (!userId) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("role, is_disabled")
      .eq("id", userId)
      .single();

    if (error || !data) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

     if (data.is_disabled) {
       toast.error("Your account has been disabled. Please contact support.");
       await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      setRoleLoading(false);
      return;
    }

    setRole(data.role as UserRole);
    setRoleLoading(false);
  }

  useEffect(() => {
    async function getCurrentSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      await loadRole(session?.user?.id);
    }

    getCurrentSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session) {
          const {
            data: {
              user
            }
          } = await supabase.auth.getUser();

          setUser(user);

          await loadRole(user?.id);
        } else {
          setUser(null);
          setRole(null);
          setRoleLoading(false);
        }

        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function refreshUser() {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();

    setUser(user);
    await loadRole(user?.id);
  }

  async function signUp(
    email: string,
    password: string,
    options?: {
      data?: {
        full_name?: string;
      };
    }
  ) {
    return await supabase.auth.signUp({
      email,
      password,
      options
    });
  }

  async function signIn(
    email: string,
    password: string
  ) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async function resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email);
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    role,
    roleLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
