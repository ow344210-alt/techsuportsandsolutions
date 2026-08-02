// Typed data-access layer for the public.marquee_items table. Both the public
// marquee strips and the admin Marquee manager use these helpers exclusively.
import { supabase } from "../supabase/client";

export type MarqueeRow = "left" | "right";

export interface MarqueeItem {
  id: string;
  label: string;
  row: MarqueeRow;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarqueeItemPayload {
  label: string;
  row: MarqueeRow;
  is_active: boolean;
}

// Public strip: active items only, ordered by row then order_index with a
// stable created_at fallback so the order never jumps around.
export async function getPublicMarqueeItems(): Promise<MarqueeItem[]> {
  const { data, error } = await supabase
    .from("marquee_items")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MarqueeItem[];
}

// Admin manager: every item including drafts/inactive ones.
export async function getAdminMarqueeItems(): Promise<MarqueeItem[]> {
  const { data, error } = await supabase
    .from("marquee_items")
    .select("*")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as MarqueeItem[];
}

export async function createMarqueeItem(
  payload: MarqueeItemPayload,
  nextOrderIndex: number
): Promise<MarqueeItem> {
  const { data, error } = await supabase
    .from("marquee_items")
    .insert([{ ...payload, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as MarqueeItem;
}

export async function updateMarqueeItem(
  id: string,
  payload: MarqueeItemPayload
): Promise<MarqueeItem> {
  const { data, error } = await supabase
    .from("marquee_items")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as MarqueeItem;
}

export async function deleteMarqueeItem(id: string): Promise<void> {
  const { error } = await supabase.from("marquee_items").delete().eq("id", id);
  if (error) throw error;
}

// Persists the display order for a list of ids (one row at a time in the
// manager, so each row keeps its own 0..n sequence).
export async function reorderMarqueeItems(
  ordered: { id: string; order_index: number }[]
): Promise<void> {
  if (ordered.length === 0) return;
  const { error } = await supabase
    .from("marquee_items")
    .upsert(ordered, { onConflict: "id" });
  if (error) throw error;
}

// One clean realtime subscription on public.marquee_items. Any INSERT/UPDATE/
// DELETE fires the callback; the caller refetches the (RLS-filtered) list so
// unpublishing or hiding an item removes it immediately. Returns an unsubscribe
// function. Call it from a useEffect (with stable deps) so a new channel is
// never opened on every render.
export function subscribeToMarqueeItems(onChange: () => void): () => void {
  const channel = supabase
    .channel("public-marquee-items")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "marquee_items" },
      () => {
        onChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
