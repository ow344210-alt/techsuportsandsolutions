// Client-side image optimization for admin uploads.
//
// The admin can upload large raster images (often multi-MB PNG screenshots)
// which are then served raw to public visitors, hurting page load. This helper
// downscales raster photos to a sane max dimension and re-encodes them as
// WebP before they are uploaded to Supabase Storage, so the bytes stored are
// the bytes the public site downloads.
//
// Rules:
// - Only raster photos are processed (image/png, image/jpeg, image/webp).
//   GIFs (animated), SVGs (vector) and anything the browser can't decode
//   (e.g. HEIC) are returned unchanged.
// - Small files are kept as-is to avoid pointless CPU cost and quality loss.
// - If anything goes wrong (decode error, no 2D context, encode failure) the
//   original file is returned unchanged — an upload is never blocked or
//   corrupted by optimization.
// - Aspect ratio is preserved; dimension caps keep hero slides looking crisp
//   while capping memory.
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;
const OPTIMIZE_MIN_BYTES = 150 * 1024;

const OPTIMIZABLE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export interface ImageOptimizationResult {
  file: File;
  optimized: boolean;
}

function baseName(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image decode failed"));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
    } catch {
      // Very old browsers without WebP encoding support.
      try {
        canvas.toBlob(resolve, "image/jpeg", 0.85);
      } catch {
        resolve(null);
      }
    }
  });
}

export async function optimizeImageFile(file: File): Promise<ImageOptimizationResult> {
  if (!OPTIMIZABLE_TYPES.has(file.type)) {
    return { file, optimized: false };
  }
  if (file.size < OPTIMIZE_MIN_BYTES) {
    return { file, optimized: false };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, optimized: false };

    ctx.drawImage(img, 0, 0, width, height);

    const blob = await canvasToBlob(canvas);
    if (!blob) return { file, optimized: false };

    const optimized = new File([blob], `${baseName(file.name)}.webp`, {
      type: "image/webp",
    });

    if (optimized.size >= file.size) return { file, optimized: false };

    return { file: optimized, optimized: true };
  } catch {
    return { file, optimized: false };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
