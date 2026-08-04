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
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
      })),
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("../lib/newsletter", () => ({
  fetchRecentNewsletterSubscribers: vi.fn(() =>
    Promise.resolve([
      {
        id: "sub-1",
        email: "alex.johnson@example.com",
        subscribed_at: "2026-08-01T10:00:00Z",
        name: "Alex Johnson",
      },
      {
        id: "sub-2",
        email: "this.is.a.long.email@very-long-domain-name-12345.example.com",
        subscribed_at: "2026-07-30T09:00:00Z",
        name: "Christopher Alexander-Williamson McAllister-Brown",
      },
      { id: "sub-3", email: "missingname@example.com", subscribed_at: "2026-07-28T08:00:00Z" },
    ]),
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

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <MockAuthProvider>
        <ThemeContext.Provider value={themeValue}>
          <Dashboard />
        </ThemeContext.Provider>
      </MockAuthProvider>
    </MemoryRouter>,
  );
}

import Dashboard from "./Dashboard";

describe("Dashboard responsive card grid", () => {
  it("renders Recent Subscribers in place of Quick Actions", async () => {
    renderDashboard();

    expect(screen.getByText("Recent Messages")).toBeInTheDocument();
    expect(screen.getByText("Recent Subscribers")).toBeInTheDocument();
    expect(screen.queryByText("Quick Actions")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alex Johnson")).toBeInTheDocument();
    });
  });

  it("keeps the two-card grid stacked on mobile and two columns on desktop", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Alex Johnson")).toBeInTheDocument();
    });

    const section = screen.getByText("Recent Messages").closest("section");
    expect(section).not.toBeNull();
    expect(section!.className).toContain("grid-cols-1");
    expect(section!.className).toContain("xl:grid-cols-[1.3fr_0.9fr]");
    expect(section!.className).toContain("min-w-0");
  });

  it("never puts a fixed height or inner scrollbar on the subscribers card", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Alex Johnson")).toBeInTheDocument();
    });

    const heading = screen.getByText("Recent Subscribers");
    const card = heading.closest("div")?.parentElement as HTMLElement;
    expect(card.className).toContain("min-w-0");
    expect(card.className).not.toMatch(/overflow-y-auto/);
    expect(card.className).not.toMatch(/\bh-\d/);
  });

  it("renders subscriber rows with truncating text that cannot overflow the card", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Christopher Alexander-Williamson McAllister-Brown")).toBeInTheDocument();
    });

    const name = screen.getByText("Christopher Alexander-Williamson McAllister-Brown");
    const textWrapper = name.closest("div")!;
    expect(textWrapper.className).toContain("min-w-0");
    expect(textWrapper.className).toContain("flex-1");
    expect(name.className).toContain("truncate");

    const email = screen.getByText("this.is.a.long.email@very-long-domain-name-12345.example.com");
    expect(email.className).toContain("truncate");

    const row = name.closest("div")?.parentElement as HTMLElement;
    const avatar = row.firstElementChild as HTMLElement;
    expect(avatar.className).toContain("shrink-0");
    expect(avatar.className).toContain("rounded-full");
  });

  it("shows 'Name not provided' and a neutral icon when the subscriber has no real name", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Name not provided")).toBeInTheDocument();
    });

    const placeholder = screen.getByText("Name not provided");
    expect(placeholder.textContent).not.toBe("Missingname");

    const row = placeholder.closest("div")?.parentElement as HTMLElement;
    const avatar = row.firstElementChild as HTMLElement;
    expect(avatar.className).toContain("shrink-0");
    expect(avatar.className).toContain("rounded-full");
  });
});
