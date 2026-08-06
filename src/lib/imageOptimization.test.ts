import { afterEach, describe, expect, it, vi } from "vitest";
import { optimizeImageFile } from "./imageOptimization";

const PNG = "image/png";

function makeFile(name: string, type: string, size: number): File {
  return new File([new Uint8Array(size)], name, { type });
}

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  width = 3000;
  height = 2000;
  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("optimizeImageFile", () => {
  it("returns the original file for non-raster types (GIF/SVG)", async () => {
    const file = makeFile("anim.gif", "image/gif", 500 * 1024);
    await expect(optimizeImageFile(file)).resolves.toEqual({ file, optimized: false });
  });

  it("returns the original file for small sources", async () => {
    const file = makeFile("small.png", PNG, 50 * 1024);
    await expect(optimizeImageFile(file)).resolves.toEqual({ file, optimized: false });
  });

  it("returns the original file when a 2D context is unavailable", async () => {
    vi.stubGlobal("Image", FakeImage);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return { width: 0, height: 0, getContext: vi.fn(() => null) } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });

    const file = makeFile("big.png", PNG, 2 * 1024 * 1024);
    const result = await optimizeImageFile(file);
    expect(result.optimized).toBe(false);
    expect(result.file).toBe(file);
  });

  it("downscales to the max dimension and returns a WebP file on success", async () => {
    const drawImage = vi.fn();
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob: vi.fn((cb: (b: Blob | null) => void) =>
        cb(new Blob(["data"], { type: "image/webp" })),
      ),
    };

    vi.stubGlobal("Image", FakeImage);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") return fakeCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    const file = makeFile("photo.png", PNG, 2 * 1024 * 1024);
    const result = await optimizeImageFile(file);

    expect(result.optimized).toBe(true);
    expect(result.file.name).toBe("photo.webp");
    expect(result.file.type).toBe("image/webp");
    expect(fakeCanvas.width).toBe(1920);
    expect(fakeCanvas.height).toBe(1280);
    expect(drawImage).toHaveBeenCalledOnce();
  });

  it("keeps the original when the optimized file is not smaller", async () => {
    vi.stubGlobal("Image", FakeImage);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    const toBlob = vi.fn((cb: (b: Blob | null) => void) =>
      cb(new Blob([new Uint8Array(2 * 1024 * 1024)], { type: "image/webp" })),
    );
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn(() => ({ drawImage: vi.fn() })),
          toBlob,
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tag);
    });

    const file = makeFile("photo.png", PNG, 2 * 1024 * 1024);
    const result = await optimizeImageFile(file);

    expect(result.optimized).toBe(false);
    expect(result.file).toBe(file);
  });
});
