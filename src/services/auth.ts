import { supabase } from "../supabase/client";
import { env } from "../config/env";

export async function login(
  email: string,
  password: string
) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function register(
  email: string,
  password: string
) {
  return await supabase.auth.signUp({
    email,
    password,
  });
}

export async function logout() {
  return await supabase.auth.signOut();
}

export async function forgotPassword(
  email: string
) {
  return await supabase.auth.resetPasswordForEmail(
    email,
    {
      redirectTo: `${env.APP_URL}/reset-password`,
    }
  );
}