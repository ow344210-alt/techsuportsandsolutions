import { supabase } from "../supabase/client";

export interface ContactMessagePayload {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  status: string;
  user_id: string | null;
}

// Run this once in the Supabase SQL editor:
// CREATE TABLE IF NOT EXISTS contact_messages (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   full_name TEXT NOT NULL,
//   email TEXT NOT NULL,
//   subject TEXT NOT NULL,
//   message TEXT NOT NULL,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
//   status TEXT NOT NULL DEFAULT 'New'
// );
//
// See sql/roles_and_account.sql for the user_id column + RLS policies.

export async function submitContactMessage(payload: ContactMessagePayload) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("contact_messages")
    .insert([
      {
        full_name: payload.fullName.trim(),
        email: payload.email.trim(),
        subject: payload.subject.trim(),
        message: payload.message.trim(),
        created_at: new Date().toISOString(),
        status: "New",
        user_id: user?.id ?? null,
      },
    ]);

  if (error) {
    throw error;
  }
}

// Customer account page: messages submitted by the currently logged-in user
export async function fetchMyMessages(userId: string): Promise<ContactMessage[]> {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ContactMessage[];
}