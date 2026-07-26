// src/lib/techStack.ts
import { supabase } from "../supabase/client";

export interface TechItem {
  id: string;
  name: string;
  category: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface TechItemPayload {
  name: string;
  category: string;
  is_active: boolean;
}

export async function fetchTechForAdmin(): Promise<TechItem[]> {
  const { data, error } = await supabase.from("tech_stack").select("*").order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TechItem[];
}

export async function fetchActiveTech(): Promise<TechItem[]> {
  const { data, error } = await supabase.from("tech_stack").select("*").eq("is_active", true).order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TechItem[];
}

export async function createTech(payload: TechItemPayload, nextOrderIndex: number): Promise<TechItem> {
  const { data, error } = await supabase.from("tech_stack").insert([{ ...payload, order_index: nextOrderIndex }]).select().single();
  if (error) throw error;
  return data as TechItem;
}

export async function updateTech(id: string, payload: TechItemPayload): Promise<TechItem> {
  const { data, error } = await supabase.from("tech_stack").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as TechItem;
}

export async function deleteTech(id: string): Promise<void> {
  const { error } = await supabase.from("tech_stack").delete().eq("id", id);
  if (error) throw error;
}

export async function swapTechOrder(a: TechItem, b: TechItem): Promise<void> {
  const { error: e1 } = await supabase.from("tech_stack").update({ order_index: b.order_index }).eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("tech_stack").update({ order_index: a.order_index }).eq("id", b.id);
  if (e2) throw e2;
}