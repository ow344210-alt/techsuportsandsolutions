import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

const { mockCreateReply, mockSendEmail } = vi.hoisted(() => ({
  mockCreateReply: vi.fn(),
  mockSendEmail: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: { success: toastSuccess, error: toastError },
}));

vi.mock("../../lib/contactMessageReplyService", () => ({
  createContactMessageReply: (...args: unknown[]) => mockCreateReply(...args),
  sendReplyEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import ReplyModal from "./ReplyModal";

const BASE_PROPS = {
  contactMessageId: "cm-1",
  recipientEmail: "customer@example.com",
  originalSubject: "Help with my project",
  open: true,
  onClose: vi.fn(),
  onReplySent: vi.fn(),
};

function setup(overrides: Partial<typeof BASE_PROPS> = {}) {
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

  it("closes when the backdrop is clicked but not the panel itself", () => {
    const { props } = setup();

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement as HTMLElement;

    fireEvent.mouseDown(dialog);
    expect(props.onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(overlay);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});

describe("ReplyModal submission", () => {
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

  it("shows an error when the email send fails", async () => {
    mockCreateReply.mockResolvedValue({ success: true, replyId: "reply-1" });
    mockSendEmail.mockResolvedValue({
      success: false,
      error: "Email provider rejected the message",
    });

    setup();
    await fillAndSubmit("Sending should fail.");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email provider rejected the message",
      );
    });

    expect(toastSuccess).not.toHaveBeenCalled();
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
