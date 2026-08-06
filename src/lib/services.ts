import { supabase } from "../supabase/client";
import { cachedQuery } from "./dataCache";
import { optimizeImageFile } from "./imageOptimization";

export const SERVICE_ICONS = [
  "Monitor",
  "Wrench",
  "ShieldCheck",
  "Cloud",
  "Settings",
  "Headphones",
  "Code",
  "Smartphone",
  "Database",
  "Server",
  "Globe",
  "Lock",
] as const;

export type ServiceIcon = (typeof SERVICE_ICONS)[number];

export const SERVICE_CATEGORIES = [
  "General",
  "IT Support",
  "Cyber Security",
  "Cloud",
  "Networking",
  "Software",
  "Consulting",
  "Development",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export type ServiceStatus = "Published" | "Draft";

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: ServiceIcon;
  category: string;
  featured: boolean;
  image_url: string | null;
  status: ServiceStatus;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicePayload {
  title: string;
  description: string;
  icon: ServiceIcon;
  category: string;
  featured: boolean;
  image_url: string | null;
  status: ServiceStatus;
  is_active: boolean;
}

// =======================
// Fetch All (Admin)
// =======================

export async function fetchAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Service[];
}

// =======================
// Fetch Public
// =======================

export function fetchActiveServices(): Promise<Service[]> {
  return cachedQuery("services:active", async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .eq("status", "Published")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return (data ?? []) as Service[];
  });
}

// =======================
// Create
// =======================

export async function createService(
  payload: ServicePayload,
  nextOrderIndex: number,
) {
  const { data, error } = await supabase
    .from("services")
    .insert([
      {
        ...payload,
        order_index: nextOrderIndex,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data as Service;
}

// =======================
// Update
// =======================

export async function updateService(
  id: string,
  payload: ServicePayload,
) {
  const { data, error } = await supabase
    .from("services")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Service;
}

// =======================
// Delete
// =======================

export async function deleteService(id: string) {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =======================
// Swap Order
// =======================

export async function swapServiceOrder(
  a: Service,
  b: Service,
) {
  const { error: errorA } = await supabase
    .from("services")
    .update({
      order_index: b.order_index,
    })
    .eq("id", a.id);

  if (errorA) throw errorA;

  const { error: errorB } = await supabase
    .from("services")
    .update({
      order_index: a.order_index,
    })
    .eq("id", b.id);

  if (errorB) throw errorB;
}

// =======================
// Upload Service Image
// =======================

export async function uploadServiceImage(file: File): Promise<string> {
  const optimized = await optimizeImageFile(file);
  const fileExt = optimized.file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("service-images")
    .upload(filePath, optimized.file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("service-images").getPublicUrl(filePath);

  return data.publicUrl;
}