import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeContext } from "../context/ThemeContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";
import type { Faq } from "../lib/faqs";

const { swalFire } = vi.hoisted(() => ({ swalFire: vi.fn() }));
const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("sweetalert2", () => ({ default: { fire: swalFire } }));
vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: toastError, info: vi.fn(), warning: vi.fn() },
}));
vi.mock("../lib/faqs", () => ({
  fetchFaqsForAdmin: vi.fn(),
  deleteFaq: vi.fn(),
  createFaq: vi.fn(),
  updateFaq: vi.fn(),
  swapFaqOrder: vi.fn(),
}));

import FaqManager from "./FaqManager";
import { fetchFaqsForAdmin, deleteFaq } from "../lib/faqs";

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

const faq = {
  id: "faq-1",
  page: "home",
  question: "What services do you offer?",
  answer: "All of them.",
  order_index: 0,
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as Faq;

function renderManager() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <FaqManager />
    </ThemeContext.Provider>,
  );
}

beforeEach(() => {
  swalFire.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  vi.mocked(fetchFaqsForAdmin).mockReset();
  vi.mocked(fetchFaqsForAdmin).mockResolvedValue([faq]);
  vi.mocked(deleteFaq).mockReset();
  vi.mocked(deleteFaq).mockResolvedValue(undefined);
});

describe("FaqManager page selector", () => {
  it("renders the page selector with fully responsive width classes", async () => {
    renderManager();

    await screen.findByText("What services do you offer?");

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.className).toContain("w-full");
    expect(select.className).toContain("min-w-0");
    expect(select.className).toContain("max-w-full");
    expect(select.className).toContain("sm:w-auto");
  });
});

describe("FaqManager action button", () => {
  it("renders Add FAQ as a no-wrap horizontal button", async () => {
    renderManager();

    await screen.findByText("What services do you offer?");

    const button = screen.getByRole("button", { name: "Add FAQ" });
    expect(button.className).toContain("whitespace-nowrap");
    expect(button.className).toContain("shrink-0");
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("inline-flex");
    expect(button.className).toContain("items-center");
    expect(button.className).toContain("justify-center");
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("sm:w-auto");
    expect(button.className).toContain("sm:min-w-[120px]");
    expect(button.className).not.toMatch(/(^|\s)w-\[|(^|\s)max-w-\[/);
  });

  it("opens the Add FAQ modal when clicked", async () => {
    renderManager();

    await screen.findByText("What services do you offer?");
    fireEvent.click(screen.getByRole("button", { name: "Add FAQ" }));

    expect(await screen.findByText("Question")).toBeInTheDocument();
  });
});

describe("FaqManager delete confirmation", () => {
  it("deletes the FAQ and shows a success toast when confirmed", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    renderManager();

    await screen.findByText("What services do you offer?");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(deleteFaq).toHaveBeenCalledWith("faq-1"));
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("FAQ deleted successfully."),
    );
    expect(screen.queryByText("What services do you offer?")).not.toBeInTheDocument();
  });

  it("does not delete the FAQ when the dialog is cancelled", async () => {
    swalFire.mockResolvedValue({ isConfirmed: false });
    renderManager();

    await screen.findByText("What services do you offer?");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => expect(swalFire).toHaveBeenCalled());
    expect(deleteFaq).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(screen.getByText("What services do you offer?")).toBeInTheDocument();
  });

  it("shows an error toast, keeps the FAQ, and resets deleting state on failure", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    vi.mocked(deleteFaq).mockRejectedValue(new Error("db failure"));
    renderManager();

    await screen.findByText("What services do you offer?");
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Something went wrong. Please try again."),
    );
    expect(screen.getByText("What services do you offer?")).toBeInTheDocument();

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
    });
  });
});
