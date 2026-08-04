export const PROJECT_IMAGE_BUCKET = "project-images";

export const PROJECT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROJECT_IMAGE_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const PROJECT_IMAGE_ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"] as const;