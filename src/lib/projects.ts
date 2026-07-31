import { supabase } from "../supabase/client";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  technologies: string[];
  image_url: string | null;
  live_url: string | null;
  github_url: string | null;
  status: "Published" | "Draft";
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectPayload {
  title: string;
  description: string;
  category: string;
  technologies: string[];
  image_url: string | null;
  live_url: string | null;
  github_url: string | null;
  status: "Published" | "Draft";
  is_active: boolean;
}

export async function fetchAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function fetchActiveProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_active", true)
    .eq("status", "Published")
    .order("order_index", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function fetchProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return (data as Project) ?? null;
}

export async function createProject(
  payload: ProjectPayload,
  nextOrderIndex: number,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert([{ ...payload, order_index: nextOrderIndex }])
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(
  id: string,
  payload: ProjectPayload,
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function swapProjectOrder(
  a: Project,
  b: Project,
): Promise<void> {
  const { error: errorA } = await supabase
    .from("projects")
    .update({ order_index: b.order_index })
    .eq("id", a.id);

  if (errorA) throw errorA;

  const { error: errorB } = await supabase
    .from("projects")
    .update({ order_index: a.order_index })
    .eq("id", b.id);

  if (errorB) throw errorB;
}

export async function uploadProjectImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("project-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("project-images").getPublicUrl(fileName);
  return data.publicUrl;
}