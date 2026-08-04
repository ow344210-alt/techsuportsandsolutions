import { describe, it, expect, vi } from "vitest";
import {
  PROJECT_IMAGE_BUCKET,
  PROJECT_IMAGE_MAX_SIZE_BYTES,
  PROJECT_IMAGE_ALLOWED_MIME_TYPES,
  PROJECT_IMAGE_ALLOWED_EXTENSIONS,
} from "./constants";
import {
  uploadProjectImage,
  ProjectImageValidationError,
} from "./projects";

function makeFile(
  name: string,
  type: string,
  size: number,
): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

describe("PROJECT_IMAGE_BUCKET constant", () => {
  it("equals the verified canonical bucket name", () => {
    expect(PROJECT_IMAGE_BUCKET).toBe("project-images");
  });
});

describe("PROJECT_IMAGE_MAX_SIZE_BYTES", () => {
  it("is 5 MB", () => {
    expect(PROJECT_IMAGE_MAX_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe("PROJECT_IMAGE_ALLOWED_MIME_TYPES", () => {
  it("includes png, jpeg, and webp", () => {
    expect(PROJECT_IMAGE_ALLOWED_MIME_TYPES).toContain("image/png");
    expect(PROJECT_IMAGE_ALLOWED_MIME_TYPES).toContain("image/jpeg");
    expect(PROJECT_IMAGE_ALLOWED_MIME_TYPES).toContain("image/webp");
  });
});

describe("PROJECT_IMAGE_ALLOWED_EXTENSIONS", () => {
  it("includes .png, .jpg, .jpeg, and .webp", () => {
    expect(PROJECT_IMAGE_ALLOWED_EXTENSIONS).toContain(".png");
    expect(PROJECT_IMAGE_ALLOWED_EXTENSIONS).toContain(".jpg");
    expect(PROJECT_IMAGE_ALLOWED_EXTENSIONS).toContain(".jpeg");
    expect(PROJECT_IMAGE_ALLOWED_EXTENSIONS).toContain(".webp");
  });
});

describe("uploadProjectImage validation", () => {
  it("throws ProjectImageValidationError for unsupported file type", async () => {
    const file = makeFile("test.pdf", "application/pdf", 100);
    await expect(uploadProjectImage(file)).rejects.toThrow(
      ProjectImageValidationError,
    );
  });

  it("throws ProjectImageValidationError for oversized file", async () => {
    const file = makeFile("test.png", "image/png", PROJECT_IMAGE_MAX_SIZE_BYTES + 1);
    await expect(uploadProjectImage(file)).rejects.toThrow(
      ProjectImageValidationError,
    );
  });

  it("throws ProjectImageValidationError for zero-byte file", async () => {
    const file = makeFile("test.png", "image/png", 0);
    await expect(uploadProjectImage(file)).rejects.toThrow(
      ProjectImageValidationError,
    );
  });

  it("throws ProjectImageValidationError for file with no extension", async () => {
    const file = makeFile("test", "image/png", 100);
    await expect(uploadProjectImage(file)).rejects.toThrow(
      ProjectImageValidationError,
    );
  });
});

describe("deleteProjectImage", () => {
  it("does nothing when imageUrl is null", async () => {
    const mockRemove = vi.fn().mockResolvedValue({ error: null });
    vi.doMock("./client", () => ({
      supabase: {
        storage: {
          from: () => ({ upload: vi.fn(), getPublicUrl: vi.fn(), remove: mockRemove }),
        },
      },
    }));
    vi.resetModules();
    const { deleteProjectImage: deleteProjectImageMocked } = await import("./projects");
    await deleteProjectImageMocked(null);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("does nothing for external URLs", async () => {
    const mockRemove = vi.fn().mockResolvedValue({ error: null });
    vi.doMock("./client", () => ({
      supabase: {
        storage: {
          from: () => ({ upload: vi.fn(), getPublicUrl: vi.fn(), remove: mockRemove }),
        },
      },
    }));
    vi.resetModules();
    const { deleteProjectImage: deleteProjectImageMocked } = await import("./projects");
    await deleteProjectImageMocked("https://example.com/external/image.png");
    expect(mockRemove).not.toHaveBeenCalled();
  });
});

describe("replaceProjectImage", () => {
  it("does not delete old image when upload fails", async () => {
    const mockUpload = vi.fn().mockResolvedValue({ error: { message: "network error" } });
    const mockRemove = vi.fn().mockResolvedValue({ error: null });
    vi.doMock("./client", () => ({
      supabase: {
        storage: {
          from: () => ({ upload: mockUpload, getPublicUrl: vi.fn(), remove: mockRemove }),
        },
      },
    }));
    vi.resetModules();
    const { replaceProjectImage: replaceProjectImageMocked } = await import("./projects");
    const oldUrl = "https://example.com/project-images/old.png";
    const file = makeFile("test.png", "image/png", 100);
    await expect(replaceProjectImageMocked(oldUrl, file)).rejects.toThrow();
    expect(mockRemove).not.toHaveBeenCalled();
  });
});