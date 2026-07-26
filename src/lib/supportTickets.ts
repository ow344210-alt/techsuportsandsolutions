import { supabase } from "../supabase/client";

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export async function createTicket(
  subject: string,
  message: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Please login first.");

  const { error } = await supabase
    .from("support_tickets")
    .insert([
      {
        user_id: user.id,
        subject,
        message,
        status: "Open",
      },
    ]);

  if (error) throw error;
}

export async function getMyTickets() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data as SupportTicket[];
}