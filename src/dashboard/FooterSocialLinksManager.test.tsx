import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeContext } from "../context/ThemeContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";
import type { FooterSocialLink } from "../lib/footerSocialLinks";

const { swalFire } = vi.hoisted(() => ({ swalFire: vi.fn() }));
const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sweetalert2", () => ({ default: { fire: swalFire } }));
vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: toastError, info: vi.fn(), warning: vi.fn() },
}));

vi.mock("../lib/footerSocialLinks", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../lib/footerSocialLinks")>();
  return {
    ...actual,
    fetchFooterSocialLinksForAdmin: vi.fn(),
    createFooterSocialLink: vi.fn(),
    updateFooterSocialLink: vi.fn(),
    deleteFooterSocialLink: vi.fn(),
    swapFooterSocialLinkOrder: vi.fn(),
  };
});

import FooterSocialLinksManager from "./FooterSocialLinksManager";
import {
  createFooterSocialLink,
  deleteFooterSocialLink,
  fetchFooterSocialLinksForAdmin,
  swapFooterSocialLinkOrder,
  updateFooterSocialLink,
} from "../lib/footerSocialLinks";

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

const link: FooterSocialLink = {
  id: "s1",
  platform_key: "instagram",
  label: "Instagram",
  url: "https://www.instagram.com/techsupportsandsolutions/",
  link_type: "social",
  icon_key: "instagram",
  is_enabled: true,
  open_in_new_tab: true,
  sort_order: 0,
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
};

function renderManager() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <FooterSocialLinksManager />
    </ThemeContext.Provider>,
  );
}

function openAddForm() {
  fireEvent.click(screen.getByRole("button", { name: /add link/i }));
}

beforeEach(() => {
  swalFire.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.mocked(fetchFooterSocialLinksForAdmin).mockReset();
  vi.mocked(fetchFooterSocialLinksForAdmin).mockResolvedValue([link]);
  vi.mocked(createFooterSocialLink).mockReset();
  vi.mocked(createFooterSocialLink).mockResolvedValue({
    ...link,
    id: "s2",
    sort_order: 1,
  });
  vi.mocked(updateFooterSocialLink).mockReset();
  vi.mocked(updateFooterSocialLink).mockImplementation(async (id, payload) => ({
    ...link,
    id,
    ...payload,
  }));
  vi.mocked(deleteFooterSocialLink).mockReset();
  vi.mocked(deleteFooterSocialLink).mockResolvedValue(undefined);
  vi.mocked(swapFooterSocialLinkOrder).mockReset();
  vi.mocked(swapFooterSocialLinkOrder).mockResolvedValue(undefined);
});

describe("FooterSocialLinksManager rendering", () => {
  it("renders fetched social links with their URLs", async () => {
    renderManager();

    expect(
      await screen.findByText("https://www.instagram.com/techsupportsandsolutions/"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Instagram").length).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no links", async () => {
    vi.mocked(fetchFooterSocialLinksForAdmin).mockResolvedValue([]);
    renderManager();

    expect(await screen.findByText("No social links yet.")).toBeInTheDocument();
  });
});

describe("FooterSocialLinksManager add/edit validation", () => {
  it("rejects an unsafe URL without calling create", async () => {
    renderManager();
    await screen.findByText(/techsupportsandsolutions/);
    openAddForm();

    fireEvent.change(screen.getByPlaceholderText("e.g. Instagram"), {
      target: { value: "Instagram" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "URL must be a valid http(s) link.",
      ),
    );
    expect(createFooterSocialLink).not.toHaveBeenCalled();
  });

  it("creates a link and shows a success toast", async () => {
    renderManager();
    await screen.findByText(/techsupportsandsolutions/);
    openAddForm();

    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "facebook" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Instagram"), {
      target: { value: "Facebook" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://www.facebook.com/company" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(createFooterSocialLink).toHaveBeenCalledWith(
        expect.objectContaining({ platform_key: "facebook" }),
        expect.any(Number),
      ),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Social link added successfully."),
    );
    expect(screen.queryByText("Add Social Link")).not.toBeInTheDocument();
  });

  it("rejects a duplicate enabled platform", async () => {
    renderManager();
    await screen.findByText(/techsupportsandsolutions/);
    openAddForm();

    fireEvent.change(screen.getByPlaceholderText("e.g. Instagram"), {
      target: { value: "Instagram" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://www.instagram.com/other" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
    expect(createFooterSocialLink).not.toHaveBeenCalled();
  });
});

describe("FooterSocialLinksManager delete", () => {
  it("deletes the link and shows a success toast when confirmed", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    renderManager();

    await screen.findByText(/techsupportsandsolutions/);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(deleteFooterSocialLink).toHaveBeenCalledWith("s1"));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Social link deleted successfully."),
    );
    expect(screen.queryByText(/techsupportsandsolutions/)).not.toBeInTheDocument();
  });

  it("does not delete when the dialog is cancelled", async () => {
    swalFire.mockResolvedValue({ isConfirmed: false });
    renderManager();

    await screen.findByText(/techsupportsandsolutions/);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(swalFire).toHaveBeenCalled());
    expect(deleteFooterSocialLink).not.toHaveBeenCalled();
    expect(screen.getByText(/techsupportsandsolutions/)).toBeInTheDocument();
  });
});

describe("FooterSocialLinksManager toggle and reorder", () => {
  it("toggles a link's enabled state", async () => {
    renderManager();
    await screen.findByText(/techsupportsandsolutions/);

    fireEvent.click(screen.getByRole("button", { name: /enabled/i }));

    await waitFor(() =>
      expect(updateFooterSocialLink).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({ is_enabled: false }),
      ),
    );
    expect(
      await screen.findByRole("button", { name: /disabled/i }),
    ).toBeInTheDocument();
  });

  it("reorders by swapping the sort order", async () => {
    vi.mocked(fetchFooterSocialLinksForAdmin).mockResolvedValue([
      link,
      {
        ...link,
        id: "s2",
        platform_key: "facebook",
        url: "https://www.facebook.com/company",
        sort_order: 1,
      },
    ]);
    const { container } = renderManager();

    await screen.findByText(/techsupportsandsolutions/);
    const firstRow = container.querySelectorAll("li")[0]!;
    const downButton = Array.from(firstRow.querySelectorAll("button")).find(
      (button) => button.querySelector("svg.lucide-arrow-down"),
    )!;
    fireEvent.click(downButton);

    await waitFor(() => expect(swapFooterSocialLinkOrder).toHaveBeenCalled());
  });
});
