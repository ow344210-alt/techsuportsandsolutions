import { describe, it, expect, vi, beforeEach } from "vitest";

const { swalFire } = vi.hoisted(() => ({ swalFire: vi.fn() }));

vi.mock("sweetalert2", () => ({ default: { fire: swalFire } }));

import { showConfirm } from "./confirm";

beforeEach(() => {
  swalFire.mockReset();
  swalFire.mockResolvedValue({ isConfirmed: true });
});

describe("showConfirm", () => {
  it("uses the default variant (purple/blue) when no variant is given", async () => {
    await showConfirm({ title: "Confirm action" });

    expect(swalFire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Confirm action",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        buttonsStyling: false,
        width: "min(26rem, calc(100vw - 2rem))",
        customClass: expect.objectContaining({
          popup: "tss-swal tss-swal--default",
          confirmButton: "tss-swal-confirm",
          cancelButton: "tss-swal-cancel",
        }),
      })
    );
  });

  it("uses the danger variant (red confirm) for destructive actions", async () => {
    await showConfirm({
      title: "Delete Project",
      text: "This will permanently delete this project.",
      variant: "danger",
    });

    expect(swalFire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Delete Project",
        text: "This will permanently delete this project.",
        icon: "warning",
        customClass: expect.objectContaining({
          popup: "tss-swal tss-swal--danger",
        }),
      })
    );
  });

  it("passes through custom labels and icon", async () => {
    await showConfirm({
      title: "Archive",
      html: "<strong>Archive</strong> this item?",
      icon: "question",
      confirmButtonText: "Archive",
      cancelButtonText: "Keep",
    });

    expect(swalFire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Archive",
        html: "<strong>Archive</strong> this item?",
        icon: "question",
        confirmButtonText: "Archive",
        cancelButtonText: "Keep",
      })
    );
  });

  it("resolves with the underlying SweetAlert2 result", async () => {
    swalFire.mockResolvedValue({ isConfirmed: false, isDismissed: true });

    const result = await showConfirm({ title: "Cancel me" });

    expect(result.isConfirmed).toBe(false);
    expect(result.isDismissed).toBe(true);
  });
});
