import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const from = vi.fn();
  return { from };
});

vi.mock("../supabase/client", () => ({
  supabase: { from: mocks.from },
}));

import { FaLink, FaInstagram, FaYoutube } from "react-icons/fa6";
import {
  createFooterSocialLink,
  deleteFooterSocialLink,
  fetchActiveFooterSocialLinks,
  fetchFooterSocialLinksForAdmin,
  getFooterSocialIcon,
  isKnownSocialPlatform,
  isPlatformDuplicate,
  isValidSocialUrl,
  swapFooterSocialLinkOrder,
  updateFooterSocialLink,
  validateFooterSocialLink,
} from "./footerSocialLinks";
import type { FooterSocialLink, FooterSocialLinkPayload } from "./footerSocialLinks";

// Chainable table builder: every non-terminal method returns the same object,
// and the terminal (order/single/eq) mocks are resolved per test.
function makeBuilder() {
  const select = vi.fn();
  const insert = vi.fn();
  const update = vi.fn();
  const del = vi.fn();
  const eq = vi.fn();
  const order = vi.fn();
  const single = vi.fn();

  const builder = { select, insert, update, delete: del, eq, order, single };
  select.mockReturnValue(builder);
  insert.mockReturnValue(builder);
  update.mockReturnValue(builder);
  del.mockReturnValue(builder);
  eq.mockReturnValue(builder);

  return { builder, select, insert, update, del, eq, order, single };
}

const payload: FooterSocialLinkPayload = {
  platform_key: "instagram",
  label: "Instagram",
  url: "https://www.instagram.com/techsupportsandsolutions/",
  link_type: "social",
  icon_key: "instagram",
  is_enabled: true,
  open_in_new_tab: true,
};

function makeLink(overrides: Partial<FooterSocialLink> = {}): FooterSocialLink {
  return {
    id: "l1",
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

beforeEach(() => {
  mocks.from.mockReset();
});

describe("isValidSocialUrl", () => {
  it("accepts https and http links", () => {
    expect(isValidSocialUrl("https://www.instagram.com/x")).toBe(true);
    expect(isValidSocialUrl("http://example.com")).toBe(true);
  });

  it("rejects dangerous schemes", () => {
    expect(isValidSocialUrl("javascript:alert(1)")).toBe(false);
    expect(isValidSocialUrl("data:text/html,<script>1</script>")).toBe(false);
    expect(isValidSocialUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects malformed or empty values", () => {
    expect(isValidSocialUrl("")).toBe(false);
    expect(isValidSocialUrl("   ")).toBe(false);
    expect(isValidSocialUrl("not-a-url")).toBe(false);
    expect(isValidSocialUrl("ftp://example.com")).toBe(false);
  });
});

describe("icon registry", () => {
  it("resolves known icon keys", () => {
    expect(getFooterSocialIcon("instagram")).toBe(FaInstagram);
    expect(getFooterSocialIcon("youtube")).toBe(FaYoutube);
  });

  it("falls back to the neutral link icon for unknown or missing keys", () => {
    expect(getFooterSocialIcon("mystery")).toBe(FaLink);
    expect(getFooterSocialIcon(null)).toBe(FaLink);
    expect(getFooterSocialIcon(undefined)).toBe(FaLink);
    expect(getFooterSocialIcon("")).toBe(FaLink);
  });
});

describe("isKnownSocialPlatform and duplicate detection", () => {
  it("recognizes preset platforms and rejects unknowns", () => {
    expect(isKnownSocialPlatform("instagram")).toBe(true);
    expect(isKnownSocialPlatform("custom")).toBe(true);
    expect(isKnownSocialPlatform("myspace")).toBe(false);
  });

  it("flags a duplicate platform owned by another row", () => {
    const links = [makeLink({ id: "l1", platform_key: "instagram" })];
    expect(isPlatformDuplicate(links, "instagram", null)).toBe(true);
    expect(isPlatformDuplicate(links, "instagram", "l1")).toBe(false);
    expect(isPlatformDuplicate(links, "facebook", null)).toBe(false);
  });

  it("never treats the custom platform as a duplicate", () => {
    const links = [makeLink({ id: "l1", platform_key: "custom" })];
    expect(isPlatformDuplicate(links, "custom", null)).toBe(false);
  });
});

describe("validateFooterSocialLink", () => {
  it("accepts a fully valid payload", () => {
    expect(validateFooterSocialLink(payload)).toBeNull();
  });

  it("rejects a missing platform", () => {
    expect(
      validateFooterSocialLink({ ...payload, platform_key: "" }),
    ).toContain("Platform");
  });

  it("rejects an unknown platform", () => {
    expect(
      validateFooterSocialLink({ ...payload, platform_key: "myspace" }),
    ).toContain("Unknown platform");
  });

  it("rejects a missing label", () => {
    expect(validateFooterSocialLink({ ...payload, label: "  " })).toContain(
      "Label",
    );
  });

  it("rejects a missing or unsafe URL", () => {
    expect(validateFooterSocialLink({ ...payload, url: "" })).toContain("URL");
    expect(
      validateFooterSocialLink({ ...payload, url: "javascript:alert(1)" }),
    ).toContain("URL");
  });
});

describe("fetch functions", () => {
  it("throws when the public fetch fails", async () => {
    const t = makeBuilder();
    t.order.mockResolvedValue({ data: null, error: new Error("down") });
    mocks.from.mockReturnValue(t.builder);

    await expect(fetchActiveFooterSocialLinks()).rejects.toThrow("down");
  });

  it("fetches only enabled links for the public footer, ordered", async () => {
    const t = makeBuilder();
    t.order.mockResolvedValue({ data: [makeLink()], error: null });
    mocks.from.mockReturnValue(t.builder);

    const rows = await fetchActiveFooterSocialLinks();

    expect(mocks.from).toHaveBeenCalledWith("footer_social_links");
    expect(t.select).toHaveBeenCalledWith("*");
    expect(t.eq).toHaveBeenCalledWith("is_enabled", true);
    expect(t.order).toHaveBeenCalledWith("sort_order", { ascending: true });
    expect(rows).toHaveLength(1);
  });

  it("fetches every link for the admin, ordered", async () => {
    const t = makeBuilder();
    t.order.mockResolvedValue({ data: [makeLink()], error: null });
    mocks.from.mockReturnValue(t.builder);

    const rows = await fetchFooterSocialLinksForAdmin();

    expect(t.order).toHaveBeenCalledWith("sort_order", { ascending: true });
    expect(rows).toHaveLength(1);
  });
});

describe("CRUD functions", () => {
  it("creates a link with the next sort order", async () => {
    const t = makeBuilder();
    t.single.mockResolvedValue({ data: makeLink(), error: null });
    mocks.from.mockReturnValue(t.builder);

    const created = await createFooterSocialLink(payload, 7);

    expect(t.insert).toHaveBeenCalledWith([{ ...payload, sort_order: 7 }]);
    expect(created.id).toBe("l1");
  });

  it("updates a link by id", async () => {
    const t = makeBuilder();
    t.single.mockResolvedValue({ data: makeLink({ label: "IG" }), error: null });
    mocks.from.mockReturnValue(t.builder);

    const updated = await updateFooterSocialLink("l1", {
      ...payload,
      label: "IG",
    });

    expect(t.update).toHaveBeenCalledWith({ ...payload, label: "IG" });
    expect(t.eq).toHaveBeenCalledWith("id", "l1");
    expect(updated.label).toBe("IG");
  });

  it("deletes a link by id", async () => {
    const t = makeBuilder();
    t.eq.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue(t.builder);

    await deleteFooterSocialLink("l1");

    expect(t.eq).toHaveBeenCalledWith("id", "l1");
  });

  it("swaps the sort order of two links", async () => {
    const t = makeBuilder();
    t.eq.mockResolvedValue({ error: null });
    mocks.from.mockReturnValue(t.builder);

    const a = makeLink({ id: "a", sort_order: 0 });
    const b = makeLink({ id: "b", platform_key: "facebook", sort_order: 1 });
    await swapFooterSocialLinkOrder(a, b);

    expect(t.update).toHaveBeenNthCalledWith(1, { sort_order: 1 });
    expect(t.update).toHaveBeenNthCalledWith(2, { sort_order: 0 });
    expect(t.eq).toHaveBeenNthCalledWith(1, "id", "a");
    expect(t.eq).toHaveBeenNthCalledWith(2, "id", "b");
  });
});
