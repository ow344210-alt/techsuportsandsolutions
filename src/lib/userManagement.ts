import { supabase } from "../supabase/client";

export type UserRole = "admin" | "customer";

export interface ManagedUser {
  id: string;
  email: string;
  role: UserRole;
  is_disabled: boolean;
  created_at: string;
}

interface RawManagedUser {
  id?: unknown;
  email?: unknown;
  role?: unknown;
  is_disabled?: unknown;
  created_at?: unknown;
}

// Converts a row returned by the get_all_users RPC into a fully-normalized
// ManagedUser. Every field is guaranteed to have a safe, non-null value, so
// callers never crash on malformed or missing database values.
function normalizeManagedUser(raw: RawManagedUser): ManagedUser | null {
  if (typeof raw.id !== "string" || !raw.id) {
    return null;
  }

  return {
    id: raw.id,
    email:
      typeof raw.email === "string" && raw.email.trim()
        ? raw.email.trim()
        : "Unknown email",
    role: raw.role === "admin" ? "admin" : "customer",
    is_disabled: Boolean(raw.is_disabled),
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
  };
}

export async function fetchAllUsers(): Promise<ManagedUser[]> {
  const { data, error } = await supabase.rpc("get_all_users");

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return (data as RawManagedUser[])
    .map(normalizeManagedUser)
    .filter((user): user is ManagedUser => user !== null);
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { error } = await supabase.rpc("admin_update_user_role", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    throw error;
  }
}

export async function setUserDisabled(userId: string, isDisabled: boolean) {
  const { error } = await supabase.rpc("admin_set_user_disabled", {
    p_user_id: userId,
    p_disabled: isDisabled,
  });

  if (error) {
    throw error;
  }
}