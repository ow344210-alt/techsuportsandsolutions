import { supabase } from "../supabase/client";

export const PAGES = ["home", "about", "services", "process", "contact"] as const;
export type PageKey = (typeof PAGES)[number];

export interface CardGroup {
  id: string;
  page: string;
  group_key: string;
  group_title: string;
  group_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ContentCard {
  id: string;
  group_id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentCardPayload {
  title: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ===== Groups =====

export async function fetchGroupsForPage(page: string, adminMode = false): Promise<CardGroup[]> {
  let query = supabase
    .from("content_card_groups")
    .select("*")
    .eq("page", page)
    .order("group_order", { ascending: true });

  if (!adminMode) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CardGroup[];
}

export async function createGroup(page: string, title: string, nextOrder: number): Promise<CardGroup> {
  const groupKey = `${slugify(title)}-${Date.now().toString(36)}`;

  const { data, error } = await supabase
    .from("content_card_groups")
    .insert([{ page, group_key: groupKey, group_title: title, group_order: nextOrder, is_active: true }])
    .select()
    .single();

  if (error) throw error;
  return data as CardGroup;
}

export async function updateGroup(id: string, title: string, isActive: boolean): Promise<CardGroup> {
  const { data, error } = await supabase
    .from("content_card_groups")
    .update({ group_title: title, is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CardGroup;
}

export async function deleteGroup(id: string): Promise<void> {
  const { error } = await supabase.from("content_card_groups").delete().eq("id", id);
  if (error) throw error;
}

export async function swapGroupOrder(a: CardGroup, b: CardGroup): Promise<void> {
  const { error: errorA } = await supabase
    .from("content_card_groups")
    .update({ group_order: b.group_order })
    .eq("id", a.id);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase
    .from("content_card_groups")
    .update({ group_order: a.group_order })
    .eq("id", b.id);
  if (errorB) throw errorB;
}

// ===== Cards =====

export async function fetchCardsForGroup(groupId: string, adminMode = false): Promise<ContentCard[]> {
  let query = supabase
    .from("content_cards")
    .select("*")
    .eq("group_id", groupId)
    .order("order_index", { ascending: true });

  if (!adminMode) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ContentCard[];
}

export async function createCard(
  groupId: string,
  payload: ContentCardPayload,
  nextOrderIndex: number,
): Promise<ContentCard> {
  const { data, error } = await supabase
    .from("content_cards")
    .insert([{ ...payload, group_id: groupId, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as ContentCard;
}

export async function updateCard(id: string, payload: ContentCardPayload): Promise<ContentCard> {
  const { data, error } = await supabase
    .from("content_cards")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ContentCard;
}

export async function deleteCard(id: string): Promise<void> {
  const { error } = await supabase.from("content_cards").delete().eq("id", id);
  if (error) throw error;
}

export async function swapCardOrder(a: ContentCard, b: ContentCard): Promise<void> {
  const { error: errorA } = await supabase
    .from("content_cards")
    .update({ order_index: b.order_index })
    .eq("id", a.id);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase
    .from("content_cards")
    .update({ order_index: a.order_index })
    .eq("id", b.id);
  if (errorB) throw errorB;
}

export async function uploadCardImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("content-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("content-images").getPublicUrl(fileName);
  return data.publicUrl;
}

// ===== Combined fetch for public pages =====

export interface PageSectionData {
  group: CardGroup;
  cards: ContentCard[];
}

// Fetches all card groups for a page AND their cards in parallel (instead of
// sequentially looping), cutting load time roughly by the number of groups.
export async function fetchPageSections(page: string): Promise<PageSectionData[]> {
  const groups = await fetchGroupsForPage(page, false);

  const results = await Promise.all(
    groups.map(async (group) => {
      const cards = await fetchCardsForGroup(group.id, false);
      return { group, cards };
    }),
  );

  return results.filter((section) => section.cards.length > 0);
}

// Fetch active cards for a single group, identified by its group_key
// (used by ContentCardsGrid to embed one specific group inline in a page,
// as opposed to fetchPageSections which renders every group for a page)
export async function fetchActiveCards(groupKey: string): Promise<ContentCard[]> {
  const { data: group, error: groupError } = await supabase
    .from("content_card_groups")
    .select("id")
    .eq("group_key", groupKey)
    .eq("is_active", true)
    .maybeSingle();

  if (groupError) {
    throw groupError;
  }

  if (!group) {
    return [];
  }

  return fetchCardsForGroup(group.id, false);
}