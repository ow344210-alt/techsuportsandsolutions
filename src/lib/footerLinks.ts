// Manages the Footer's "Quick Links" column — fully admin-editable so links
// can be added, renamed, reordered, or hidden without touching code.
import { supabase } from "../supabase/client";

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface FooterLinkPayload {
  label: string;
  url: string;
  is_active: boolean;
}

export async function fetchFooterLinksForAdmin(): Promise<FooterLink[]> {
  const { data, error } = await supabase
    .from("footer_links")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FooterLink[];
}

export async function fetchActiveFooterLinks(): Promise<FooterLink[]> {
  const { data, error } = await supabase
    .from("footer_links")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as FooterLink[];
}

export async function createFooterLink(payload: FooterLinkPayload, nextOrderIndex: number): Promise<FooterLink> {
  const { data, error } = await supabase
    .from("footer_links")
    .insert([{ ...payload, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as FooterLink;
}

export async function updateFooterLink(id: string, payload: FooterLinkPayload): Promise<FooterLink> {
  const { data, error } = await supabase
    .from("footer_links")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as FooterLink;
}

export async function deleteFooterLink(id: string): Promise<void> {
  const { error } = await supabase.from("footer_links").delete().eq("id", id);
  if (error) throw error;
}

export async function swapFooterLinkOrder(a: FooterLink, b: FooterLink): Promise<void> {
  const { error: errorA } = await supabase.from("footer_links").update({ order_index: b.order_index }).eq("id", a.id);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase.from("footer_links").update({ order_index: a.order_index }).eq("id", b.id);
  if (errorB) throw errorB;
}