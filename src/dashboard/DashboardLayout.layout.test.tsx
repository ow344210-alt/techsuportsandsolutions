import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ThemeContext } from "../context/ThemeContext.types";
import type { AuthContextType } from "../contexts/AuthContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";

vi.mock("../supabase/client", () => {
  const channel = {
    on: vi.fn(() => channel),
    subscribe: vi.fn((cb?: (s: string) => void) => {
      cb?.("SUBSCRIBED");
      return channel;
    }),
  };
  return {
    supabase: {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("../lib/contactMessageReplyService", () => ({
  fetchMessageReplies: vi.fn(() => Promise.resolve([])),
  retryFailedReply: vi.fn(() => Promise.resolve({ success: true })),
  createContactMessageReply: vi.fn(() =>
    Promise.resolve({ success: true, replyId: "reply-1" }),
  ),
  sendReplyEmail: vi.fn(() =>
    Promise.resolve({ success: true, replyId: "reply-1" }),
  ),
  updateContactMessageReply: vi.fn(() =>
    Promise.resolve({ success: true, replyId: "reply-1" }),
  ),
}));

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

const authValue: AuthContextType = {
  user: { id: "u1", email: "a@b.c", user_metadata: { full_name: "Admin" } } as unknown as User,
  session: null,
  loading: false,
  role: "admin",
  roleLoading: false,
  signUp: vi.fn() as never,
  signIn: vi.fn() as never,
  signOut: vi.fn(() => Promise.resolve()),
  resetPassword: vi.fn() as never,
  refreshUser: vi.fn(() => Promise.resolve()),
};

const themeValue: ThemeContextType = {
  theme: "dark",
  toggleTheme: vi.fn(),
  setTheme: vi.fn(),
};

function MockAuthProvider({ children }: { children: ReactNode }) {
  return (
    <MockAuthContext.Provider value={authValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => {
    const ctx = useContext(MockAuthContext);
    if (!ctx) throw new Error("no auth");
    return ctx;
  },
}));

function renderLayout(ui: ReactNode) {
  return render(
    <MemoryRouter initialEntries={["/dashboard/messages"]}>
      <MockAuthProvider>
        <ThemeContext.Provider value={themeValue}>{ui}</ThemeContext.Provider>
      </MockAuthProvider>
    </MemoryRouter>,
  );
}

describe("Dashboard layout overflow architecture", () => {
  it("constrains the dashboard root to the viewport", async () => {
    const { default: DashboardLayout } = await import("./DashboardLayout");
    renderLayout(<DashboardLayout />);

    const root = document.querySelector("div.flex.h-dvh");
    expect(root).not.toBeNull();
    expect(root).toHaveClass("w-full");
    expect(root).toHaveClass("overflow-hidden");

    const mainColumn = root!.querySelector("div.flex.flex-col");
    expect(mainColumn).toHaveClass("min-w-0");
    expect(mainColumn).toHaveClass("flex-1");

    const main = mainColumn!.querySelector("main");
    expect(main).toHaveClass("overflow-y-auto");
    expect(main).toHaveClass("overflow-x-hidden");
    expect(main).toHaveClass("min-w-0");

    const innerWrapper = main!.firstElementChild;
    expect(innerWrapper).toHaveClass("max-w-7xl");
    expect(innerWrapper).toHaveClass("mx-auto");
    expect(innerWrapper).toHaveClass("w-full");
  });

  it("renders the Messages table inside a dedicated scroller, not on the card", async () => {
    const { default: Messages } = await import("./Messages");
    renderLayout(<Messages />);

    await waitFor(() => {
      expect(screen.getByText("No messages found.")).toBeInTheDocument();
    });

    const table = document.querySelector("table");
    expect(table).not.toBeNull();
    expect(table!.className).toContain("w-full");

    const scroller = table!.parentElement!;
    expect(scroller.className).toContain("overflow-x-auto");
    expect(scroller.className).toContain("max-w-full");

    const card = scroller.parentElement!;
    expect(card.className).toContain("overflow-hidden");
    expect(card.className).not.toContain("overflow-x-auto");
    expect(card.className).toContain("min-w-0");

    const outer = card.parentElement!;
    expect(outer).not.toHaveClass("overflow-x-auto");
  });
});
