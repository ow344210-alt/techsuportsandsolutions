import { supabase } from "../supabase/client";

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  description: string;
  created_at: string;
}

export async function fetchRecentActivity(limit = 8): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}