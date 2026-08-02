// CRUD for the dynamic Process page steps — unlimited, admin-managed,
// mirrors the faqs.ts pattern.
import { supabase } from "../supabase/client";
import { cachedQuery } from "./dataCache";

export interface ProcessStep {
  id: string;
  title: string;
  purpose: string;
  activities: string;
  deliverables: string;
  timeline: string;
  client_involvement: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProcessStepPayload {
  title: string;
  purpose: string;
  activities: string;
  deliverables: string;
  timeline: string;
  client_involvement: string;
  is_active: boolean;
}

export async function fetchStepsForAdmin(): Promise<ProcessStep[]> {
  const { data, error } = await supabase
    .from("process_steps")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProcessStep[];
}

export function fetchActiveSteps(): Promise<ProcessStep[]> {
  return cachedQuery("process_steps:active", async () => {
    const { data, error } = await supabase
      .from("process_steps")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return (data ?? []) as ProcessStep[];
  });
}

export async function createStep(payload: ProcessStepPayload, nextOrderIndex: number): Promise<ProcessStep> {
  const { data, error } = await supabase
    .from("process_steps")
    .insert([{ ...payload, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as ProcessStep;
}

export async function updateStep(id: string, payload: ProcessStepPayload): Promise<ProcessStep> {
  const { data, error } = await supabase
    .from("process_steps")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ProcessStep;
}

export async function deleteStep(id: string): Promise<void> {
  const { error } = await supabase.from("process_steps").delete().eq("id", id);
  if (error) throw error;
}

export async function swapStepOrder(a: ProcessStep, b: ProcessStep): Promise<void> {
  const { error: errorA } = await supabase.from("process_steps").update({ order_index: b.order_index }).eq("id", a.id);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase.from("process_steps").update({ order_index: a.order_index }).eq("id", b.id);
  if (errorB) throw errorB;
}