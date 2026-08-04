import { supabase } from "../supabase/client";
import { getFunctionErrorMessage } from "./functionErrors";
import type { ContactMessageActivity } from "../types";

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

export type ContactMessageStatus = "new" | "in_progress" | "replied" | "resolved" | "spam" | "Read";
export type ContactMessagePriority = "low" | "normal" | "high" | "urgent";

export interface UpdateStatusResult {
  success: boolean;
  error: string | null;
}

export interface AssignResult {
  success: boolean;
  error: string | null;
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
   const { data, error } = await supabase.functions.invoke("submit-contact", {
      body: {
        full_name: payload.fullName,
        email: payload.email,
        subject: payload.subject,
        message: payload.message,
      },
    });

    if (error) {
      throw new Error(
        await getFunctionErrorMessage(error, "Failed to submit message"),
      );
    }

    if (!data?.success) {
      throw new Error(data?.error ?? "Failed to submit message");
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

export async function updateContactMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<UpdateStatusResult> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function updateContactMessagePriority(
  id: string,
  priority: ContactMessagePriority,
): Promise<UpdateStatusResult> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ priority })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function assignContactMessage(
  id: string,
  adminUserId: string,
): Promise<AssignResult> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ assigned_to: adminUserId })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function updateContactMessageNotes(
  id: string,
  notes: string,
): Promise<UpdateStatusResult> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ admin_notes: notes })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function markContactMessageReplied(
  id: string,
): Promise<UpdateStatusResult> {
  const { error } = await supabase
    .from("contact_messages")
    .update({ status: "replied", replied_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function deleteContactMessage(
  id: string,
): Promise<UpdateStatusResult> {
  const { error } = await supabase
    .from("contact_messages")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getContactMessageActivity(
  messageId: string,
): Promise<{ success: boolean; data: ContactMessageActivity[] | null; error: string | null }> {
  const { data, error } = await supabase
    .from("contact_message_activities")
    .select("*")
    .eq("contact_message_id", messageId)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, data: null, error: error.message };
  }

  return { success: true, data: (data ?? []) as ContactMessageActivity[], error: null };
}