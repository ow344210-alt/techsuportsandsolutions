import { supabase } from "../supabase/client";

export type UserRole = "admin" | "customer";

export interface ManagedUser {
  id: string;
  email: string;
  role: UserRole;
  is_disabled: boolean;
  created_at: string;
}

// Run sql/user_management.sql once in the Supabase SQL editor before using this file.

export async function fetchAllUsers(): Promise<ManagedUser[]> {
  const { data, error } = await supabase.rpc("get_all_users");

  if (error) {
    throw error;
  }

  return (data ?? []) as ManagedUser[];
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function setUserDisabled(userId: string, isDisabled: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_disabled: isDisabled })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}