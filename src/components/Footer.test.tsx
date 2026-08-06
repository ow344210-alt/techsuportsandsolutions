import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const { footerLinks, footerSocialLinks } = vi.hoisted(() => ({
  footerLinks: vi.fn(),
  footerSocialLinks: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: toastSuccess,
    error: toastError,
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../lib/newsletter", () => ({
  subscribeToNewsletter: vi.fn(async () => {}),
}));

vi.mock("../lib/services", () => ({
  fetchActiveServices: vi.fn(async () => []),
}));

vi.mock("../hooks/useSiteContent", () => ({
  useSiteContent: vi.fn(() => ({
    content: {
      description:
        "Tech Supports & Solutions builds and maintains websites, mobile applications, and reliable business software for startups and growing companies. Based in Karachi, we provide practical technology solutions and trusted, ongoing support to clients worldwide — from initial planning through launch and beyond.",
      copyright_text: "Tech Supports & Solutions",
      newsletter_heading: "Stay Updated",
      newsletter_text: "Get the latest tips and updates delivered to your inbox.",
      email: "techsupportsandsolutions@gmail.com",
      phone: "+92 3372579655",
      address: "Head Quarter Karachi, Sindh, Pakistan",
      working_days: "Monday - Friday",
      working_hours: "9:00 AM - 6:00 PM",
    },
  })),
}));

vi.mock("../hooks/useFooterLinks", () => ({
  useFooterLinks: () => ({ links: footerLinks(), loading: false }),
}));

vi.mock("../hooks/useFooterSocialLinks", () => ({
  useFooterSocialLinks: () => ({ links: footerSocialLinks(), loading: false }),
}));

vi.mock("../lib/footerSocialLinks", () => ({
  getFooterSocialIcon: vi.fn(() => () => null),
}));

vi.mock("./ui/Button", () => ({
  default: ({
    children,
    ...props
  }: {
    children?: React.ReactNode;
  }) => <button {...props}>{children}</button>,
}));

vi.mock("./background", () => ({
  BackgroundDecorations: () => null,
}));

import Footer from "./Footer";
import { subscribeToNewsletter } from "../lib/newsletter";
import { fetchActiveServices } from "../lib/services";

function makeSocialLink(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

async function renderFooter() {
  const result = render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );
  await screen.findByText("Stay Updated");
  return result;
}

beforeEach(() => {
  toastSuccess.mockReset();
  toastError.mockReset();
  footerLinks.mockReset();
  footerSocialLinks.mockReset();
  footerLinks.mockReturnValue([]);
  footerSocialLinks.mockReturnValue([]);
  vi.mocked(subscribeToNewsletter).mockReset();
  vi.mocked(subscribeToNewsletter).mockResolvedValue(undefined);
  vi.mocked(fetchActiveServices).mockReset();
  vi.mocked(fetchActiveServices).mockResolvedValue([]);
});

describe("Footer newsletter", () => {
  it("restores the newsletter form with name, email, and subscribe button", async () => {
    await renderFooter();

    expect(screen.getByLabelText("Name (optional)")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /subscribe/i }),
    ).toBeInTheDocument();
  });

  it("subscribes a valid email and clears the form", async () => {
    await renderFooter();

    fireEvent.change(screen.getByLabelText("Name (optional)"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() =>
      expect(subscribeToNewsletter).toHaveBeenCalledWith(
        "jane@example.com",
        "Jane",
      ),
    );
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        "You're subscribed! Thanks for joining.",
      ),
    );
    expect(
      (screen.getByPlaceholderText("Enter your email") as HTMLInputElement).value,
    ).toBe("");
  });

  it("rejects an invalid email without calling the backend", async () => {
    await renderFooter();

    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(screen.getByPlaceholderText("Enter your email").closest("form")!);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "Please enter a valid email address.",
      ),
    );
    expect(subscribeToNewsletter).not.toHaveBeenCalled();
  });
});

describe("Footer structure", () => {
  it("removes the Company heading and keeps the three link-column headings", async () => {
    await renderFooter();

    expect(screen.queryByRole("heading", { name: "Company" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Services" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quick Links" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
  });

  it("shows the brand logo, name, and description once each", async () => {
    await renderFooter();

    const brand = screen.getByLabelText("Tech Supports & Solutions home");
    expect(brand.querySelector("img")).toBeInTheDocument();
    expect(screen.getByText("Tech Supports & Solutions")).toBeInTheDocument();
    expect(screen.getByText(/builds and maintains websites/)).toBeInTheDocument();
  });

  it("renders the six quick links via router links with exact routes", async () => {
    await renderFooter();

    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Services" }).getAttribute("href")).toBe(
      "/services",
    );
    expect(screen.getByRole("link", { name: "Projects" }).getAttribute("href")).toBe(
      "/projects",
    );
    expect(screen.getByRole("link", { name: "Process" }).getAttribute("href")).toBe(
      "/process",
    );
    expect(screen.getByRole("link", { name: "About" }).getAttribute("href")).toBe(
      "/about",
    );
    expect(screen.getByRole("link", { name: "Contact" }).getAttribute("href")).toBe(
      "/contact",
    );
  });

  it("shows the six primary services in a single list", async () => {
    await renderFooter();

    for (const title of [
      "Web Development",
      "Mobile App Development",
      "Software Development",
      "UI/UX Design",
      "Digital Marketing",
      "Cloud & IT Services",
    ]) {
      expect(screen.getByRole("link", { name: title })).toBeInTheDocument();
    }
  });

  it("keeps the email on a single line", async () => {
    await renderFooter();

    const emailSpan = screen
      .getByText("techsupportsandsolutions@gmail.com")
      .closest("span");
    expect(emailSpan?.className).toContain("whitespace-nowrap");
    expect(emailSpan?.className).not.toContain("break-all");
  });

  it("resolves service links to real anchor routes when the live list loads", async () => {
    const liveServices = [
      { id: "s-web", title: "Web Development" },
      { id: "s-app", title: "Mobile App Development" },
      { id: "s-soft", title: "Software Development" },
      { id: "s-ui", title: "UI/UX Design" },
      { id: "s-marketing", title: "Digital Marketing" },
      { id: "s-cloud", title: "Cloud and IT Services" },
    ];
    vi.mocked(fetchActiveServices).mockResolvedValue(
      liveServices as unknown as Awaited<ReturnType<typeof fetchActiveServices>>,
    );
    await renderFooter();

    expect(
      screen.getByRole("link", { name: "Cloud & IT Services" }).getAttribute("href"),
    ).toBe("/services#service-s-cloud");
    expect(
      screen.getByRole("link", { name: "Web Development" }).getAttribute("href"),
    ).toBe("/services#service-s-web");
  });

  it("renders admin-managed quick links from the database when present", async () => {
    footerLinks.mockReturnValue([
      { id: "f1", label: "Careers", url: "/careers", order_index: 1, is_active: true, created_at: "" },
      { id: "f2", label: "Blog", url: "/blog", order_index: 2, is_active: true, created_at: "" },
    ]);
    await renderFooter();

    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    const careers = screen.getByRole("link", { name: "Careers" });
    expect(careers.getAttribute("href")).toBe("/careers");
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("href")).toBe("/blog");
  });

  it("renders admin social links inside the Contact column, ordered by sort_order", async () => {
    footerSocialLinks.mockReturnValue([
      makeSocialLink({
        id: "s2",
        platform_key: "facebook",
        label: "Facebook",
        url: "https://facebook.com/techsupports",
        sort_order: 2,
      }),
      makeSocialLink({ id: "s1", sort_order: 1 }),
    ]);
    await renderFooter();

    const contactColumn = screen
      .getByRole("heading", { name: "Contact" })
      .parentElement;
    const socialList = screen.getByLabelText("Social media links");
    expect(contactColumn).toContainElement(socialList);

    const anchors = Array.from(socialList.querySelectorAll("a"));
    expect(anchors.map((a) => a.getAttribute("aria-label"))).toEqual([
      "Instagram",
      "Facebook",
    ]);

    const facebook = screen.getByRole("link", { name: "Facebook" });
    expect(facebook.getAttribute("href")).toBe("https://facebook.com/techsupports");
    expect(facebook.getAttribute("target")).toBe("_blank");
  });
});

describe("Footer contact rows", () => {
  it("renders the consistent contact rows with real values", async () => {
    footerSocialLinks.mockReturnValue([makeSocialLink()]);
    await renderFooter();

    expect(screen.getByText("Head Quarter Karachi, Sindh, Pakistan")).toBeInTheDocument();
    const email = screen.getByRole("link", {
      name: "techsupportsandsolutions@gmail.com",
    });
    expect(email.getAttribute("href")).toBe(
      "mailto:techsupportsandsolutions@gmail.com",
    );
    const phone = screen.getByRole("link", { name: "+92 3372579655" });
    expect(phone.getAttribute("href")).toBe("tel:+92 3372579655");
    expect(
      screen.getByText("Monday - Friday: 9:00 AM - 6:00 PM"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Social media links")).toBeInTheDocument();
  });

  it("does not render the website URL anywhere in the footer", async () => {
    await renderFooter();

    expect(
      screen.queryByRole("link", {
        name: "https://techsupportsolutions-9pwr.vercel.app",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("techsupportsolutions-9pwr.vercel.app"),
    ).not.toBeInTheDocument();
  });

  it("does not render a hardcoded Instagram link or social row without admin entries", async () => {
    await renderFooter();

    expect(
      screen.queryByRole("link", { name: "@techsupportsandsolutions" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Social media links")).not.toBeInTheDocument();
  });

  it("keeps the bottom bar to the copyright line and back-to-top button only", async () => {
    await renderFooter();

    expect(screen.getByRole("button", { name: "Back to top" })).toBeInTheDocument();
    expect(screen.getByText(/© \d{4}/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Social media links")).not.toBeInTheDocument();
  });
});
