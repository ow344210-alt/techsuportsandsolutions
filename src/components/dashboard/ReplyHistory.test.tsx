import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ReplyHistory from "./ReplyHistory";
import type { ContactMessageReply } from "../../lib/contactMessageReplies";

function makeReply(
  overrides: Partial<ContactMessageReply> = {},
): ContactMessageReply {
  return {
    id: "r1",
    contact_message_id: "cm1",
    admin_user_id: "admin-1",
    admin_email: "admin@example.com",
    admin_name: "Admin",
    recipient_email: "customer@example.com",
    subject: "Re: Help with my project",
    message: "Thanks for reaching out.\nSecond line.",
    delivery_status: "pending",
    email_provider: null,
    provider_message_id: null,
    sent_at: null,
    error_message: null,
    created_at: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

function setup(
  replies: ContactMessageReply[],
  handlers: {
    onRetry?: (replyId: string) => void;
    onEdit?: (reply: ContactMessageReply) => void;
    onEditAsNew?: (reply: ContactMessageReply) => void;
  } = {},
) {
  return render(
    <ReplyHistory
      replies={replies}
      onRetry={handlers.onRetry}
      onEdit={handlers.onEdit}
      onEditAsNew={handlers.onEditAsNew}
    />,
  );
}

describe("ReplyHistory", () => {
  it("shows an empty state when there are no replies", () => {
    setup([]);

    expect(screen.getByText("No replies yet.")).toBeInTheDocument();
  });

  it("renders subject, From, Created and the message body", () => {
    setup([makeReply()]);

    expect(screen.getByText("Reply History")).toBeInTheDocument();
    expect(screen.getByText("Re: Help with my project")).toBeInTheDocument();
    expect(screen.getByText("From: admin@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(
      screen.getByText(/Thanks for reaching out\.\s*Second line\./),
    ).toBeInTheDocument();
  });

  it("shows the sent timestamp for sent replies", () => {
    setup([
      makeReply({
        delivery_status: "sent",
        sent_at: "2026-08-02T00:00:00Z",
      }),
    ]);

    expect(screen.getByText(/Sent:/)).toBeInTheDocument();
    expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
  });

  it("shows the error message for failed replies", () => {
    setup([
      makeReply({
        delivery_status: "failed",
        error_message: "Email provider rejected the message.",
      }),
    ]);

    expect(
      screen.getByText("Email provider rejected the message."),
    ).toBeInTheDocument();
  });

  it("shows Edit for pending replies", () => {
    const onEdit = vi.fn();
    setup([makeReply()], { onEdit });

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit as New Reply" }),
    ).not.toBeInTheDocument();
  });

  it("shows Edit and Retry for failed replies", () => {
    setup([makeReply({ delivery_status: "failed" })], {
      onEdit: vi.fn(),
      onRetry: vi.fn(),
    });

    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the processing note and no edit action for processing replies", () => {
    setup([makeReply({ delivery_status: "processing" })], {
      onEdit: vi.fn(),
      onRetry: vi.fn(),
      onEditAsNew: vi.fn(),
    });

    expect(
      screen.getByText("This reply is currently being sent and cannot be edited."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit as New Reply" }),
    ).not.toBeInTheDocument();
  });

  it("shows Edit as New Reply for sent replies", () => {
    setup([makeReply({ delivery_status: "sent" })], { onEditAsNew: vi.fn() });

    expect(
      screen.getByRole("button", { name: "Edit as New Reply" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
  });

  it("calls onEdit with the reply", () => {
    const reply = makeReply();
    const onEdit = vi.fn();
    setup([reply], { onEdit });

    screen.getByRole("button", { name: "Edit" }).click();
    expect(onEdit).toHaveBeenCalledWith(reply);
  });

  it("calls onRetry with the reply id", () => {
    const reply = makeReply({ delivery_status: "failed" });
    const onRetry = vi.fn();
    setup([reply], { onRetry });

    screen.getByRole("button", { name: "Retry" }).click();
    expect(onRetry).toHaveBeenCalledWith("r1");
  });

  it("calls onEditAsNew with the sent reply", () => {
    const reply = makeReply({ delivery_status: "sent" });
    const onEditAsNew = vi.fn();
    setup([reply], { onEditAsNew });

    screen.getByRole("button", { name: "Edit as New Reply" }).click();
    expect(onEditAsNew).toHaveBeenCalledWith(reply);
  });

  it("uses responsive min-width and wrapping classes", () => {
    setup([makeReply({ delivery_status: "sent" })]);

    const subject = screen.getByText("Re: Help with my project");
    const card = subject.closest(".rounded-xl");
    expect(card?.className).toContain("w-full");
    expect(card?.className).toContain("min-w-0");

    expect(subject.className).toContain("min-w-0");
    expect(subject.className).toContain("flex-1");
    expect(subject.className).toContain("break-words");

    const badge = screen.getByText("Sent");
    expect(badge.className).toContain("shrink-0");

    const body = screen.getByText(/Thanks for reaching out\.\s*Second line\./);
    expect(body.className).toContain("whitespace-pre-wrap");
    expect(body.className).toContain("break-words");
  });
});
