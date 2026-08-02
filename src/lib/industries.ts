// src/lib/industries.ts
import { supabase } from "../supabase/client";
import { cachedQuery } from "./dataCache";

export interface Industry {
  id: string;
  name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface IndustryPayload {
  name: string;
  is_active: boolean;
}

export async function fetchIndustriesForAdmin(): Promise<Industry[]> {
  const { data, error } = await supabase.from("industries").select("*").order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Industry[];
}

export function fetchActiveIndustries(): Promise<Industry[]> {
  return cachedQuery("industries:active", async () => {
    const { data, error } = await supabase.from("industries").select("*").eq("is_active", true).order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Industry[];
  });
}

export async function createIndustry(payload: IndustryPayload, nextOrderIndex: number): Promise<Industry> {
  const { data, error } = await supabase.from("industries").insert([{ ...payload, order_index: nextOrderIndex }]).select().single();
  if (error) throw error;
  return data as Industry;
}

export async function updateIndustry(id: string, payload: IndustryPayload): Promise<Industry> {
  const { data, error } = await supabase.from("industries").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data as Industry;
}

export async function deleteIndustry(id: string): Promise<void> {
  const { error } = await supabase.from("industries").delete().eq("id", id);
  if (error) throw error;
}

export async function swapIndustryOrder(a: Industry, b: Industry): Promise<void> {
  const { error: e1 } = await supabase.from("industries").update({ order_index: b.order_index }).eq("id", a.id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("industries").update({ order_index: a.order_index }).eq("id", b.id);
  if (e2) throw e2;
}