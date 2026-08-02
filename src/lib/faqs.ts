// Handles all FAQ CRUD operations. FAQs are scoped by "page" (e.g. "home",
// "contact") so different pages can show different question sets, all
// unlimited and fully admin-managed.
import { supabase } from "../supabase/client";
import { cachedQuery } from "./dataCache";

export interface Faq {
  id: string;
  page: string;
  question: string;
  answer: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FaqPayload {
  question: string;
  answer: string;
  is_active: boolean;
}

// Admin: all FAQs for a page, including hidden ones.
export async function fetchFaqsForAdmin(page: string): Promise<Faq[]> {
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("page", page)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Faq[];
}

// Public: only active FAQs for a page, in display order.
export function fetchActiveFaqs(page: string): Promise<Faq[]> {
  return cachedQuery(`faqs:active:${page}`, async () => {
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .eq("page", page)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Faq[];
  });
}

export async function createFaq(page: string, payload: FaqPayload, nextOrderIndex: number): Promise<Faq> {
  const { data, error } = await supabase
    .from("faqs")
    .insert([{ ...payload, page, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as Faq;
}

export async function updateFaq(id: string, payload: FaqPayload): Promise<Faq> {
  const { data, error } = await supabase
    .from("faqs")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Faq;
}

export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) throw error;
}

export async function swapFaqOrder(a: Faq, b: Faq): Promise<void> {
  const { error: errorA } = await supabase.from("faqs").update({ order_index: b.order_index }).eq("id", a.id);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase.from("faqs").update({ order_index: a.order_index }).eq("id", b.id);
  if (errorB) throw errorB;
}