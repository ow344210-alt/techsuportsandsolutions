import { supabase } from "../supabase/client";
import {
  PROJECT_IMAGE_ALLOWED_EXTENSIONS,
  PROJECT_IMAGE_ALLOWED_MIME_TYPES,
  PROJECT_IMAGE_BUCKET,
  PROJECT_IMAGE_MAX_SIZE_BYTES,
} from "./constants";

class ProjectImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectImageError";
  }
}

class ProjectImageValidationError extends ProjectImageError {}

class ProjectImageUploadError extends ProjectImageError {}

class ProjectImagePermissionError extends ProjectImageError {}

class ProjectImageNetworkError extends ProjectImageError {}

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

export async function deleteProject(id: string, imageUrl?: string | null): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) throw error;

  if (imageUrl) {
    void deleteProjectImage(imageUrl);
  }
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

export {
  ProjectImageError,
  ProjectImageValidationError,
  ProjectImageUploadError,
  ProjectImagePermissionError,
  ProjectImageNetworkError,
};

function validateProjectImageFile(file: File): void {
  if (!file) {
    throw new ProjectImageValidationError("No file selected.");
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!PROJECT_IMAGE_ALLOWED_EXTENSIONS.includes(ext as typeof PROJECT_IMAGE_ALLOWED_EXTENSIONS[number])) {
    throw new ProjectImageValidationError(
      "Unsupported Image Format",
    );
  }

  if (!PROJECT_IMAGE_ALLOWED_MIME_TYPES.includes(file.type as typeof PROJECT_IMAGE_ALLOWED_MIME_TYPES[number])) {
    throw new ProjectImageValidationError(
      "Unsupported Image Format",
    );
  }

  if (file.size === 0) {
    throw new ProjectImageValidationError("The selected image is empty.");
  }

  if (file.size > PROJECT_IMAGE_MAX_SIZE_BYTES) {
    throw new ProjectImageValidationError("Image Is Too Large");
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\._/, "_");
}

export async function uploadProjectImage(file: File): Promise<string> {
  validateProjectImageFile(file);

  const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
  const safeName = sanitizeFileName(
    `${crypto.randomUUID()}${fileExt}`,
  );
  const filePath = `projects/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PROJECT_IMAGE_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) {
    const message = uploadError.message ?? "Unknown upload error";
    if (message.includes("bucket") || message.includes("not found")) {
      throw new ProjectImageUploadError(
        "The project image storage is not configured correctly. Please contact the administrator.",
      );
    }
    if (message.includes("permission") || message.includes("not authorized")) {
      throw new ProjectImagePermissionError(
        "You do not have permission to upload project images.",
      );
    }
    throw new ProjectImageUploadError(
      "We could not upload the image. Please check your connection and try again.",
    );
  }

  const { data } = supabase
    .storage.from(PROJECT_IMAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteProjectImage(imageUrl: string | null): Promise<void> {
  if (!imageUrl) return;

  let filePath: string | null = null;

  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname;
    const parts = pathname.split("/");
    const bucketIndex = parts.indexOf(PROJECT_IMAGE_BUCKET);
    if (bucketIndex !== -1 && bucketIndex < parts.length - 1) {
      filePath = parts.slice(bucketIndex + 1).join("/");
    }
  } catch {
    return;
  }

  if (!filePath) return;

  const { error } = await supabase.storage
    .from(PROJECT_IMAGE_BUCKET)
    .remove([filePath]);

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to delete project image:", error.message);
    }
  }
}

export async function replaceProjectImage(
  oldImageUrl: string | null,
  newFile: File,
): Promise<string> {
  const newImageUrl = await uploadProjectImage(newFile);

  try {
    await deleteProjectImage(oldImageUrl);
  } catch {
    if (import.meta.env.DEV) {
      console.warn("Failed to delete old project image after replacement.");
    }
  }

  return newImageUrl;
}