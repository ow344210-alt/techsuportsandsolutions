import { supabase } from "../supabase/client";

export type SupportStatus = "Open" | "In Progress" | "Resolved";

export interface SupportRequest {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  status: SupportStatus;
  created_at: string;
}

export interface SupportRequestPayload {
  full_name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitSupportRequest(
  payload: SupportRequestPayload,
  userId: string | undefined,
): Promise<SupportRequest> {
  const { data, error } = await supabase
    .from("support_requests")
    .insert([{ ...payload, user_id: userId ?? null }])
    .select()
    .single();

  if (error) throw error;
  return data as SupportRequest;
}

export async function fetchMySupportRequests(userId: string): Promise<SupportRequest[]> {
  const { data, error } = await supabase
    .from("support_requests")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as SupportRequest[];
}