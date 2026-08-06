// CRUD + media upload for the homepage Hero Slider. Supports image or video
// backgrounds, custom CTA buttons, overlay strength, and admin-controlled order.
import { supabase } from "../supabase/client";
import { cachedQuery } from "./dataCache";
import { optimizeImageFile } from "./imageOptimization";

export type MediaType = "image" | "video";
export type AnimationType = "fade" | "slide";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  media_type: MediaType;
  media_url: string | null;
  overlay_opacity: number;
  animation_type: AnimationType;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HeroSlidePayload {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  media_type: MediaType;
  media_url: string | null;
  overlay_opacity: number;
  animation_type: AnimationType;
  is_active: boolean;
}

export async function fetchSlidesForAdmin(): Promise<HeroSlide[]> {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as HeroSlide[];
}

export function fetchActiveSlides(): Promise<HeroSlide[]> {
  return cachedQuery("hero_slides:active", async () => {
    const { data, error } = await supabase
      .from("hero_slides")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return (data ?? []) as HeroSlide[];
  });
}

export async function createSlide(payload: HeroSlidePayload, nextOrderIndex: number): Promise<HeroSlide> {
  const { data, error } = await supabase
    .from("hero_slides")
    .insert([{ ...payload, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as HeroSlide;
}

export async function updateSlide(id: string, payload: HeroSlidePayload): Promise<HeroSlide> {
  const { data, error } = await supabase
    .from("hero_slides")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as HeroSlide;
}

export async function deleteSlide(id: string): Promise<void> {
  const { error } = await supabase.from("hero_slides").delete().eq("id", id);
  if (error) throw error;
}

export async function swapSlideOrder(a: HeroSlide, b: HeroSlide): Promise<void> {
  const { error: errorA } = await supabase.from("hero_slides").update({ order_index: b.order_index }).eq("id", a.id);
  if (errorA) throw errorA;

  const { error: errorB } = await supabase.from("hero_slides").update({ order_index: a.order_index }).eq("id", b.id);
  if (errorB) throw errorB;
}

export async function uploadSlideMedia(file: File): Promise<string> {
  const optimized = await optimizeImageFile(file);
  const fileExt = optimized.file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("hero-slides")
    .upload(fileName, optimized.file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("hero-slides").getPublicUrl(fileName);
  return data.publicUrl;
}