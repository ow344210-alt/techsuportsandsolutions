import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { ThemeContext } from "../context/ThemeContext.types";
import type { AuthContextType } from "../contexts/AuthContext.types";
import type { ThemeContextType } from "../context/ThemeContext.types";
import Sidebar from "./Sidebar";

const { swalFire } = vi.hoisted(() => ({ swalFire: vi.fn() }));
const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock("sweetalert2", () => ({ default: { fire: swalFire } }));
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: toastError,
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

const authValue: AuthContextType = {
  user: {
    id: "u1",
    email: "admin@example.com",
    user_metadata: { full_name: "Admin" },
  } as unknown as User,
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

vi.mock("../hooks/useAuth", () => ({
  useAuth: () => {
    const ctx = useContext(MockAuthContext);
    if (!ctx) throw new Error("no auth");
    return ctx;
  },
}));

function MockAuthProvider({ children }: { children: ReactNode }) {
  return (
    <MockAuthContext.Provider value={authValue}>
      {children}
    </MockAuthContext.Provider>
  );
}

function renderSidebar(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MockAuthProvider>
        <ThemeContext.Provider value={themeValue}>
          <Sidebar />
        </ThemeContext.Provider>
      </MockAuthProvider>
    </MemoryRouter>,
  );
}

function desktopAside(container: HTMLElement) {
  const asides = container.querySelectorAll("aside");
  expect(asides.length).toBeGreaterThanOrEqual(1);
  return asides[0] as HTMLElement;
}

function desktopLinks(container: HTMLElement) {
  return Array.from(desktopAside(container).querySelectorAll("a"));
}

function LocationProbe() {
  const path = useLocation().pathname;
  return <div data-testid="probe-location">{path}</div>;
}

function renderSidebarWithRoutes() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/dashboard"
          element={
            <MockAuthProvider>
              <ThemeContext.Provider value={themeValue}>
                <Sidebar />
              </ThemeContext.Provider>
            </MockAuthProvider>
          }
        />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const EXPECTED_LABELS = [
  "Dashboard",
  "Messages",
  "Content",
  "Services",
  "Projects",
  "Industries",
  "Tech Stack",
  "Hero Slider",
  "Marquee",
  "Cards",
  "FAQs",
  "Footer Links",
  "Contact Settings",
  "Users",
  "Support",
  "Profile",
  "Settings",
];

const EXPECTED_HREFS = [
  "/dashboard",
  "/dashboard/messages",
  "/dashboard/content",
  "/dashboard/services",
  "/dashboard/projects",
  "/dashboard/industries",
  "/dashboard/tech-stack",
  "/dashboard/hero-slider",
  "/dashboard/marquee",
  "/dashboard/cards",
  "/dashboard/faqs",
  "/dashboard/footer-links",
  "/dashboard/contact-settings",
  "/dashboard/users",
  "/dashboard/support",
  "/dashboard/profile",
  "/dashboard/settings",
];

describe("Sidebar navigation", () => {
  it("renders every required entry in the professional order", () => {
    const { container } = renderSidebar("/dashboard");
    const links = desktopLinks(container);

    expect(links.map((link) => link.textContent)).toEqual(EXPECTED_LABELS);
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      EXPECTED_HREFS,
    );

    const aside = desktopAside(container);
    const logoutButton = aside.querySelector("button");
    expect(logoutButton?.textContent?.trim()).toBe("Logout");
  });

  it.each([
    ["/dashboard", "/dashboard"],
    ["/dashboard/messages", "/dashboard/messages"],
    ["/dashboard/content", "/dashboard/content"],
    ["/dashboard/services", "/dashboard/services"],
    ["/dashboard/projects", "/dashboard/projects"],
    ["/dashboard/industries", "/dashboard/industries"],
    ["/dashboard/tech-stack", "/dashboard/tech-stack"],
    ["/dashboard/hero-slider", "/dashboard/hero-slider"],
    ["/dashboard/marquee", "/dashboard/marquee"],
    ["/dashboard/cards", "/dashboard/cards"],
    ["/dashboard/faqs", "/dashboard/faqs"],
    ["/dashboard/footer-links", "/dashboard/footer-links"],
    ["/dashboard/contact-settings", "/dashboard/contact-settings"],
    ["/dashboard/users", "/dashboard/users"],
    ["/dashboard/support", "/dashboard/support"],
    ["/dashboard/profile", "/dashboard/profile"],
    ["/dashboard/settings", "/dashboard/settings"],
  ])(
    "activates exactly one link on %s, applied to the link itself",
    (path, expectedHref) => {
      const { container } = renderSidebar(path);
      const aside = desktopAside(container);

      const activeLinks = aside.querySelectorAll(
        'a[aria-current="page"]',
      );
      expect(activeLinks).toHaveLength(1);

      const active = activeLinks[0] as HTMLAnchorElement;
      expect(active.getAttribute("href")).toBe(expectedHref);
      expect(active.className).toContain("bg-violet-600");
      expect(active.className).toContain("shadow-violet-500/20");
      expect(active.parentElement?.tagName.toLowerCase()).toBe("nav");
    },
  );

  it("keeps Dashboard active only on the exact /dashboard route", () => {
    const { container } = renderSidebar("/dashboard/messages");
    const links = desktopLinks(container);

    const dashboard = links.find((link) => link.textContent === "Dashboard")!;
    expect(dashboard.getAttribute("aria-current")).toBeNull();

    const messages = links.find((link) => link.textContent === "Messages")!;
    expect(messages.getAttribute("aria-current")).toBe("page");
  });

  it("moves the active highlight to the clicked item and keeps a single active", () => {
    const { container } = renderSidebar("/dashboard");
    let links = desktopLinks(container);
    expect(
      links.find((link) => link.textContent === "Dashboard")!.getAttribute(
        "aria-current",
      ),
    ).toBe("page");

    fireEvent.click(
      links.find((link) => link.textContent === "Services")!,
    );

    links = desktopLinks(container);
    expect(
      links.filter((link) => link.getAttribute("aria-current") === "page"),
    ).toHaveLength(1);
    expect(
      links.find((link) => link.textContent === "Services")!.getAttribute(
        "aria-current",
      ),
    ).toBe("page");
  });

  it("has no positioned active indicator inside the navigation list", () => {
    const { container } = renderSidebar("/dashboard/messages");
    const nav = desktopAside(container).querySelector("nav")!;

    const positioned = Array.from(nav.querySelectorAll("*")).filter(
      (element) => {
        const cls = (element as HTMLElement).className;
        return (
          typeof cls === "string" &&
          /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(cls)
        );
      },
    );
    expect(positioned).toHaveLength(0);

    const active = nav.querySelector(
      'a[aria-current="page"]',
    ) as HTMLElement | null;
    expect(active).not.toBeNull();
    expect(active!.className).not.toContain("absolute");
    expect(active!.className).not.toContain("fixed");
    expect(active!.className).not.toContain("sticky");
  });

  it("constrains the sidebar so only the nav area scrolls", () => {
    const { container } = renderSidebar("/dashboard");
    const aside = desktopAside(container);

    expect(aside.className).toContain("overflow-hidden");
    expect(aside.className).toContain("h-full");
    expect(aside.className).toContain("flex-col");

    const nav = aside.querySelector("nav")!;
    expect(nav.className).toContain("overflow-y-auto");
    expect(nav.className).toContain("flex-1");
    expect(nav.className).toContain("min-h-0");

    const scrollers = Array.from(aside.querySelectorAll("*")).filter(
      (element) =>
        (element as HTMLElement).className
          .toString()
          .split(/\s+/)
          .includes("overflow-y-auto"),
    );
    expect(scrollers).toHaveLength(1);
    expect(scrollers[0]).toBe(nav);

    const logout = aside.querySelector("button");
    expect(logout).not.toBeNull();
    expect(nav.contains(logout)).toBe(false);
  });
});

describe("Sidebar logout", () => {
  beforeEach(() => {
    swalFire.mockReset();
    toastError.mockReset();
    authValue.signOut = vi.fn(() => Promise.resolve());
  });

  it("redirects to / after a confirmed logout", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    const { container } = renderSidebarWithRoutes();

    fireEvent.click(desktopAside(container).querySelector("button")!);

    await waitFor(() => {
      expect(screen.getByTestId("probe-location")).toHaveTextContent("/");
    });
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    expect(authValue.signOut).toHaveBeenCalled();
  });

  it("does not call signOut when the confirmation is cancelled", async () => {
    swalFire.mockResolvedValue({ isConfirmed: false });
    const signOutSpy = vi.fn(() => Promise.resolve());
    authValue.signOut = signOutSpy;
    const { container } = renderSidebarWithRoutes();

    fireEvent.click(desktopAside(container).querySelector("button")!);

    await waitFor(() => {
      expect(swalFire).toHaveBeenCalled();
    });
    expect(signOutSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("probe-location")).toHaveTextContent("/dashboard");
  });

  it("does not redirect and shows an error toast when logout fails", async () => {
    swalFire.mockResolvedValue({ isConfirmed: true });
    authValue.signOut = vi.fn(() => Promise.reject(new Error("network")));
    const { container } = renderSidebarWithRoutes();

    fireEvent.click(desktopAside(container).querySelector("button")!);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
    expect(screen.getByTestId("probe-location")).toHaveTextContent("/dashboard");
  });
});
