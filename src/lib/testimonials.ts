import { supabase } from "../supabase/client";
import { cachedQuery } from "./dataCache";
import { optimizeImageFile } from "./imageOptimization";

export interface Testimonial {
  id: string;
  client_name: string;
  company_name: string | null;
  profile_image_url: string | null;
  review: string;
  rating: number;
  status: "Published" | "Draft";
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TestimonialPayload {
  client_name: string;
  company_name: string | null;
  profile_image_url: string | null;
  review: string;
  rating: number;
  status: "Published" | "Draft";
  is_active: boolean;
}

export async function fetchAllTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Testimonial[];
}

export function fetchActiveTestimonials(): Promise<Testimonial[]> {
  return cachedQuery("testimonials:active", async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .eq("status", "Published")
      .order("order_index", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Testimonial[];
  });
}

export async function createTestimonial(
  payload: TestimonialPayload,
  nextOrderIndex: number,
): Promise<Testimonial> {
  const { data, error } = await supabase
    .from("testimonials")
    .insert([{ ...payload, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as Testimonial;
}

export async function updateTestimonial(
  id: string,
  payload: TestimonialPayload,
): Promise<Testimonial> {
  const { data, error } = await supabase
    .from("testimonials")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Testimonial;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function swapTestimonialOrder(
  a: Testimonial,
  b: Testimonial,
): Promise<void> {
  const { error: errorA } = await supabase
    .from("testimonials")
    .update({ order_index: b.order_index })
    .eq("id", a.id);

  if (errorA) throw errorA;

  const { error: errorB } = await supabase
    .from("testimonials")
    .update({ order_index: a.order_index })
    .eq("id", b.id);

  if (errorB) throw errorB;
}

export async function uploadTestimonialImage(file: File): Promise<string> {
  const optimized = await optimizeImageFile(file);
  const fileExt = optimized.file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("testimonial-images")
    .upload(fileName, optimized.file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("testimonial-images").getPublicUrl(fileName);
  return data.publicUrl;
}