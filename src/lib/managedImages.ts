import { supabase } from "../supabase/client";

export interface ManagedImage {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  alt_text: string | null;
  section: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ManagedImagePayload {
  name: string;
  description: string | null;
  image_url: string;
  alt_text: string | null;
  section: string | null;
  is_active: boolean;
}

export async function fetchAllManagedImages(): Promise<ManagedImage[]> {
  const { data, error } = await supabase
    .from("managed_images")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ManagedImage[];
}

export async function fetchActiveManagedImages(): Promise<ManagedImage[]> {
  const { data, error } = await supabase
    .from("managed_images")
    .select("*")
    .eq("is_active", true);

  if (error) throw error;
  return (data ?? []) as ManagedImage[];
}

export async function createManagedImage(payload: ManagedImagePayload): Promise<ManagedImage> {
  const { data, error } = await supabase
    .from("managed_images")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data as ManagedImage;
}

export async function updateManagedImage(id: string, payload: ManagedImagePayload): Promise<ManagedImage> {
  const { data, error } = await supabase
    .from("managed_images")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as ManagedImage;
}

export async function deleteManagedImage(id: string): Promise<void> {
  const { error } = await supabase
    .from("managed_images")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadManagedImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("website-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("website-images").getPublicUrl(fileName);
  return data.publicUrl;
}