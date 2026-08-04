import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeContext } from "../context/ThemeContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: toastError, info: vi.fn(), warning: vi.fn() },
}));
vi.mock("../lib/contactMessageReplyService", () => ({
  fetchMessageReplies: vi.fn(() => Promise.resolve([])),
  retryFailedReply: vi.fn(() => Promise.resolve({ success: true })),
}));

let mockMessages: Array<Record<string, string>> = [];

vi.mock("../supabase/client", () => {
  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn((cb?: (status: string) => void) => {
      cb?.("SUBSCRIBED");
      return channel;
    }),
  };
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({ data: mockMessages, error: null })),
        })),
      })),
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    },
  };
});

import Messages from "./Messages";

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

function renderMessages() {
  return render(
    <ThemeContext.Provider value={themeValue}>
      <Messages />
    </ThemeContext.Provider>,
  );
}

beforeEach(() => {
  toastError.mockReset();
  mockMessages = [
    {
      id: "m1",
      full_name: "Alice",
      email: "alice@test.com",
      subject: "Hello from Alice",
      message: "Need a quote",
      created_at: "2026-01-01T00:00:00Z",
      status: "new",
    },
    {
      id: "m2",
      full_name: "Bob",
      email: "bob@test.com",
      subject: "Follow up",
      message: "Thanks for the help",
      created_at: "2026-01-02T00:00:00Z",
      status: "replied",
    },
  ];
});

describe("Messages toolbar", () => {
  it("renders the live badge, search, status filter, and export button", async () => {
    renderMessages();
    await screen.findAllByText("alice@test.com");

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by name, email or subject")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument();
  });

  it("renders Export CSV as a no-wrap horizontal button", async () => {
    renderMessages();
    await screen.findAllByText("alice@test.com");

    const button = screen.getByRole("button", { name: "Export CSV" });
    expect(button.className).toContain("shrink-0");
    expect(button.className).toContain("whitespace-nowrap");
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("inline-flex");
    expect(button.className).toContain("items-center");
    expect(button.className).toContain("w-full");
    expect(button.className).toContain("sm:w-auto");
    expect(button.className).toContain("sm:min-w-[120px]");
    expect(button.className).not.toMatch(/(^|\s)w-\[|(^|\s)max-w-\[/);
  });

  it("shows an error toast when exporting with no messages", async () => {
    mockMessages = [];
    renderMessages();

    await waitFor(() => {
      expect(screen.getByText("No messages found.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));

    expect(toastError).toHaveBeenCalledWith("No messages available to export.");
  });
});

describe("Messages status filter dropdown", () => {
  it("lists every original status option with unchanged labels and values", async () => {
    renderMessages();
    await screen.findAllByText("alice@test.com");

    fireEvent.click(screen.getByRole("combobox"));

    const options = screen.getAllByRole("option");
    const labels = options.map((option) => option.textContent?.trim());
    expect(labels).toEqual([
      "All",
      "New",
      "Read",
      "Archived",
      "Spam",
      "Replied",
      "Resolved",
      "In Progress",
    ]);

    const values = options.map((option) =>
      option.getAttribute("aria-selected") === "true" ? option.textContent?.trim() : null,
    );
    expect(values).toContain("All");
  });

  it("filters the table when a status is selected", async () => {
    renderMessages();
    await screen.findAllByText("alice@test.com");

    expect(screen.getAllByText("alice@test.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bob@test.com").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.pointerDown(screen.getByRole("option", { name: "Replied" }));

    await waitFor(() => {
      expect(screen.queryByText("alice@test.com")).not.toBeInTheDocument();
    });
    expect(screen.getAllByText("bob@test.com").length).toBeGreaterThan(0);
    expect(screen.getByRole("combobox")).toHaveTextContent("Replied");
  });

  it("resets to All and shows every message again", async () => {
    renderMessages();
    await screen.findAllByText("alice@test.com");

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.pointerDown(screen.getByRole("option", { name: "Replied" }));

    await waitFor(() => {
      expect(screen.queryByText("alice@test.com")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.pointerDown(screen.getByRole("option", { name: "All" }));

    await waitFor(() => {
      expect(screen.getAllByText("alice@test.com").length).toBeGreaterThan(0);
      expect(screen.getAllByText("bob@test.com").length).toBeGreaterThan(0);
    });
  });
});
