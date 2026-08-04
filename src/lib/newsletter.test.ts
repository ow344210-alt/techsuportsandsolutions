import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  const insert = vi.fn();
  const limit = vi.fn();
  const order = vi.fn();
  const select = vi.fn();
  return { insert, limit, order, select };
});

vi.mock("../supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: mocks.insert,
      select: mocks.select,
    }),
  },
}));

import { subscribeToNewsletter, fetchRecentNewsletterSubscribers } from "./newsletter";

describe("subscribeToNewsletter", () => {
  beforeEach(() => {
    mocks.insert.mockReset();
    mocks.limit.mockReset();
    mocks.order.mockReset();
    mocks.select.mockReset();

    mocks.order.mockReturnValue({ limit: mocks.limit });
    mocks.select.mockReturnValue({ order: mocks.order });
  });

  it("subscribes with only the email when no name is provided", async () => {
    mocks.insert.mockResolvedValue({ error: null });

    await subscribeToNewsletter("jane@example.com");

    expect(mocks.insert).toHaveBeenCalledWith([{ email: "jane@example.com" }]);
  });

  it("subscribes with a trimmed real name when one is provided", async () => {
    mocks.insert.mockResolvedValue({ error: null });

    await subscribeToNewsletter("jane@example.com", "  Jane Doe  ");

    expect(mocks.insert).toHaveBeenCalledWith([
      { email: "jane@example.com", name: "Jane Doe" },
    ]);
  });

  it("keeps an email-only insert when the name is blank or whitespace", async () => {
    mocks.insert.mockResolvedValue({ error: null });

    await subscribeToNewsletter("jane@example.com", "   ");

    expect(mocks.insert).toHaveBeenCalledWith([{ email: "jane@example.com" }]);
  });

  it("surfaces the ALREADY_SUBSCRIBED error on a duplicate email", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505" } });

    await expect(subscribeToNewsletter("jane@example.com")).rejects.toThrow(
      "ALREADY_SUBSCRIBED",
    );
  });
});

describe("fetchRecentNewsletterSubscribers", () => {
  beforeEach(() => {
    mocks.insert.mockReset();
    mocks.limit.mockReset();
    mocks.order.mockReset();
    mocks.select.mockReset();

    mocks.order.mockReturnValue({ limit: mocks.limit });
    mocks.select.mockReturnValue({ order: mocks.order });
  });

  it("selects the real name column and applies the limit", async () => {
    mocks.limit.mockResolvedValue({
      data: [
        { id: "s1", name: "Jane Doe", email: "jane@example.com", subscribed_at: "2026-08-01T10:00:00Z" },
        { id: "s2", email: "old@example.com", subscribed_at: "2026-07-01T10:00:00Z" },
      ],
      error: null,
    });

    const rows = await fetchRecentNewsletterSubscribers(5);

    expect(mocks.select).toHaveBeenCalledWith("id, name, email, subscribed_at");
    expect(mocks.order).toHaveBeenCalledWith("subscribed_at", { ascending: false });
    expect(mocks.limit).toHaveBeenCalledWith(5);
    expect(rows).toHaveLength(2);
    expect(rows[0].name).toBe("Jane Doe");
    expect(rows[1].name).toBeUndefined();
  });
});
