import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const { mockCreateReply, mockSendEmail, mockUpdateReply } = vi.hoisted(() => ({
  mockCreateReply: vi.fn(),
  mockSendEmail: vi.fn(),
  mockUpdateReply: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: toastError },
}));

vi.mock("../../lib/contactMessageReplyService", () => ({
  createContactMessageReply: (...args: unknown[]) => mockCreateReply(...args),
  sendReplyEmail: (...args: unknown[]) => mockSendEmail(...args),
  updateContactMessageReply: (...args: unknown[]) => mockUpdateReply(...args),
}));

import ReplyModal from "./ReplyModal";
import type { ReplyModalMode } from "./ReplyModal";
import type { ContactMessageReply } from "../../lib/contactMessageReplies";

const BASE_PROPS = {
  mode: "create" as ReplyModalMode,
  contactMessageId: "cm-1",
  recipientEmail: "customer@example.com",
  originalSubject: "Help with my project",
  open: true,
  onClose: vi.fn(),
  onReplySent: vi.fn(),
  onReplySaved: vi.fn(),
};

function makeReply(
  overrides: Partial<ContactMessageReply> = {},
): ContactMessageReply {
  return {
    id: "reply-1",
    contact_message_id: "cm-1",
    admin_user_id: "admin-1",
    admin_email: "admin@example.com",
    admin_name: "Admin",
    recipient_email: "customer@example.com",
    subject: "Re: Help with my project",
    message: "Original message",
    delivery_status: "pending",
    email_provider: null,
    provider_message_id: null,
    sent_at: null,
    error_message: null,
    created_at: "2026-08-01T10:00:00Z",
    ...overrides,
  };
}

type SetupOverrides = Partial<typeof BASE_PROPS> & {
  reply?: ContactMessageReply | null;
};

function setup(overrides: SetupOverrides = {}) {
  const props = { ...BASE_PROPS, ...overrides };
  const utils = render(<ReplyModal {...props} />);
  return { ...utils, props };
}

async function fillAndSubmit(message: string) {
  fireEvent.change(screen.getByLabelText(/message/i), {
    target: { value: message },
  });
  const form = document.querySelector("#reply-form");
  await act(async () => {
    fireEvent.submit(form as HTMLFormElement);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ReplyModal dialog behavior", () => {
  it("renders a labelled dialog with the recipient when open", () => {
    setup();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute(
      "aria-labelledby",
      "reply-modal-title",
    );
    expect(screen.getByText("Reply by Email")).toBeInTheDocument();
    expect(screen.getByText("customer@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toHaveValue("Re: Help with my project");
  });

  it("renders nothing when closed", () => {
    setup({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus to the subject field when it opens", async () => {
    setup();

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText(/subject/i));
    });
  });

  it("locks body scroll while open and restores it after close", () => {
    const { rerender } = setup();
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<ReplyModal {...BASE_PROPS} open={false} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape", () => {
    const { props } = setup();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on Escape while a send is in progress", async () => {
    let resolveSend: (value: unknown) => void = () => undefined;

    mockCreateReply.mockResolvedValue({ success: true, replyId: "reply-1" });
    mockSendEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { props } = setup();
    await fillAndSubmit("Sending...");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).not.toHaveBeenCalled();

    await act(async () => {
      resolveSend({ success: false, error: "provider down" });
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("provider down");
    });
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("closes when the backdrop is clicked but not the panel itself", () => {
    const { props } = setup();

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement as HTMLElement;

    fireEvent.mouseDown(dialog);
    expect(props.onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(overlay);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on backdrop click while a send is in progress", async () => {
    let resolveSend: (value: unknown) => void = () => undefined;

    mockCreateReply.mockResolvedValue({ success: true, replyId: "reply-1" });
    mockSendEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { props } = setup();
    await fillAndSubmit("Sending...");

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement as HTMLElement;

    fireEvent.mouseDown(overlay);
    expect(props.onClose).not.toHaveBeenCalled();

    await act(async () => {
      resolveSend({ success: false, error: "provider down" });
    });
  });
});

describe("ReplyModal create mode", () => {
  it("sends the reply and closes on success", async () => {
    mockCreateReply.mockResolvedValue({ success: true, replyId: "reply-1" });
    mockSendEmail.mockResolvedValue({ success: true, replyId: "reply-1" });

    const { props } = setup();
    await fillAndSubmit("Thanks for reaching out, here is the answer.");

    await waitFor(() => {
      expect(mockCreateReply).toHaveBeenCalledWith(
        "cm-1",
        "customer@example.com",
        {
          subject: "Re: Help with my project",
          message: "Thanks for reaching out, here is the answer.",
        },
      );
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith("reply-1");
    });

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalledWith(
        "Reply sent successfully to customer@example.com.",
      );
    });

    expect(props.onReplySent).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the server error and keeps the modal open when the reply record fails", async () => {
    mockCreateReply.mockResolvedValue({
      success: false,
      error: "RPC failed",
    });

    setup();
    await fillAndSubmit("This message should not send.");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("RPC failed");
    });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("shows an error and preserves the content when the email send fails", async () => {
    mockCreateReply.mockResolvedValue({ success: true, replyId: "reply-1" });
    mockSendEmail.mockResolvedValue({
      success: false,
      error: "Email provider rejected the message",
    });

    const { props } = setup();
    await fillAndSubmit("Sending should fail.");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email provider rejected the message",
      );
    });

    expect(screen.getByLabelText(/message/i)).toHaveValue("Sending should fail.");
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("does not call the services when the message is empty", async () => {
    setup();
    await act(async () => {
      fireEvent.submit(document.querySelector("#reply-form") as HTMLFormElement);
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Please enter a reply message.",
      );
    });

    expect(mockCreateReply).not.toHaveBeenCalled();
  });
});

describe("ReplyModal edit mode", () => {
  it("loads the reply subject and message and shows the edit title", () => {
    setup({ mode: "edit", reply: makeReply() });

    expect(screen.getByText("Edit Reply")).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toHaveValue(
      "Re: Help with my project",
    );
    expect(screen.getByLabelText(/message/i)).toHaveValue("Original message");
  });

  it("saves changes without sending", async () => {
    mockUpdateReply.mockResolvedValue({ success: true, replyId: "reply-1" });

    const { props } = setup({ mode: "edit", reply: makeReply() });

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Updated message" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    });

    await waitFor(() => {
      expect(mockUpdateReply).toHaveBeenCalledWith("reply-1", {
        subject: "Re: Help with my project",
        message: "Updated message",
      });
    });

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(toastSuccess).toHaveBeenCalledWith("Reply updated.");
    expect(props.onReplySaved).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the content when the update fails", async () => {
    mockUpdateReply.mockResolvedValue({
      success: false,
      error: "Update RPC failed",
    });

    const { props } = setup({ mode: "edit", reply: makeReply() });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Update RPC failed");
    });

    expect(screen.getByLabelText(/message/i)).toHaveValue("Original message");
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("saves and sends from the edit mode", async () => {
    mockUpdateReply.mockResolvedValue({ success: true, replyId: "reply-1" });
    mockSendEmail.mockResolvedValue({ success: true, replyId: "reply-1" });

    const { props } = setup({ mode: "edit", reply: makeReply() });

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Updated message" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save & Send" }));
    });

    await waitFor(() => {
      expect(mockUpdateReply).toHaveBeenCalledWith("reply-1", {
        subject: "Re: Help with my project",
        message: "Updated message",
      });
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith("reply-1");
    });

    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalled();
    });

    expect(props.onReplySent).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the content when the send fails after the update", async () => {
    mockUpdateReply.mockResolvedValue({ success: true, replyId: "reply-1" });
    mockSendEmail.mockResolvedValue({
      success: false,
      error: "Email provider rejected the message",
    });

    const { props } = setup({ mode: "edit", reply: makeReply() });

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Updated message" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save & Send" }));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email provider rejected the message",
      );
    });

    expect(screen.getByLabelText(/message/i)).toHaveValue("Updated message");
    expect(props.onReplySent).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("blocks editing while a reply is processing", () => {
    setup({
      mode: "edit",
      reply: makeReply({ delivery_status: "processing" }),
    });

    expect(
      screen.getByText("This reply is currently being sent and cannot be edited."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeDisabled();
    expect(screen.getByLabelText(/message/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });
});

describe("ReplyModal copy mode", () => {
  it("creates a brand-new reply record from a sent reply and sends it", async () => {
    const sent = makeReply({
      delivery_status: "sent",
      subject: "Old subject",
      message: "Old body",
      provider_message_id: "gmail-1",
      sent_at: "2026-08-02T00:00:00Z",
    });

    mockCreateReply.mockResolvedValue({ success: true, replyId: "new-reply-2" });
    mockSendEmail.mockResolvedValue({ success: true, replyId: "new-reply-2" });

    const { props } = setup({ mode: "copy", reply: sent });

    expect(screen.getByText("Edit as New Reply")).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toHaveValue("Old subject");
    expect(screen.getByLabelText(/message/i)).toHaveValue("Old body");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send Reply" }));
    });

    await waitFor(() => {
      expect(mockCreateReply).toHaveBeenCalledWith("cm-1", "customer@example.com", {
        subject: "Old subject",
        message: "Old body",
      });
    });

    await waitFor(() => {
      expect(mockSendEmail).toHaveBeenCalledWith("new-reply-2");
    });

    expect(props.onReplySent).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
