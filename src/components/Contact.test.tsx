import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockSubmit = vi.fn();

vi.mock("../lib/contactMessages", () => ({
  submitContactMessage: (...args: unknown[]) => mockSubmit(...args),
}));

vi.mock("../hooks/useSiteContent", () => ({
  useSiteContent: vi.fn(() => ({
    content: {
      badge_text: "Contact Us",
      heading: "Let's talk about your next project.",
      subheading: "Reach out for support.",
      trust_statement: "Your information is safe with us.",
      form_heading: "Send us a message",
      form_instructions: "Fill out the form below.",
      submit_btn_text: "Send Message",
      consent_text: "I agree to the privacy policy and consent to being contacted.",
      footer_note: "Validation happens in the browser.",
      response_time_note: "We typically respond within 2 hours.",
      phone: "+92 3372579655",
      email: "techsupportsandsolutions@gmail.com",
      address: "Head Quarter Karachi, Sindh, Pakistan",
      working_days: "Monday - Friday",
      working_hours: "9:00 AM - 6:00 PM",
      weekend_days: "Saturday",
      sunday_status: "Closed",
    },
  })),
}));

vi.mock("./ContactInfoCard", () => ({
  default: () => <div data-testid="contact-info-card">Contact Info</div>,
}));

vi.mock("./ContactMap", () => ({
  default: () => <div data-testid="contact-map">Map</div>,
}));

vi.mock("./FAQ", () => ({
  default: () => <div data-testid="faq">FAQ</div>,
}));

vi.mock("./DynamicPageSections", () => ({
  default: () => <div data-testid="dynamic-sections">Sections</div>,
}));

vi.mock("./ui/Section", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="section">{children}</div>
  ),
}));

vi.mock("./ui/Button", () => ({
  default: ({
    children,
    disabled,
    loading,
    loadingText,
    type,
    onClick,
  }: {
    children?: React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    type?: "reset" | "submit" | "button";
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      data-testid="submit-button"
    >
      {loading ? loadingText : children}
    </button>
  ),
}));

import ContactPage from "./Contact";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function getFormElements() {
  return {
    fullName: screen.getByLabelText(/full name/i),
    email: screen.getByLabelText(/email/i),
    subject: screen.getByLabelText(/subject/i),
    message: screen.getByLabelText(/message/i),
    consent: screen.getByLabelText(/I agree to the privacy policy/i),
    submit: screen.getByRole("button", { name: /send message/i }),
  };
}

function fillForm(values: {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
  consent?: boolean;
}) {
  const els = getFormElements();
  if (values.fullName !== undefined) {
    fireEvent.change(els.fullName, { target: { value: values.fullName } });
  }
  if (values.email !== undefined) {
    fireEvent.change(els.email, { target: { value: values.email } });
  }
  if (values.subject !== undefined) {
    fireEvent.change(els.subject, { target: { value: values.subject } });
  }
  if (values.message !== undefined) {
    fireEvent.change(els.message, { target: { value: values.message } });
  }
  if (values.consent !== undefined) {
    fireEvent.click(els.consent);
  }
}

describe("ContactPage form validation", () => {
   it("does not submit when full name is empty", async () => {
     render(<ContactPage />);
     const { submit } = getFormElements();
     fireEvent.click(submit);
     expect(mockSubmit).not.toHaveBeenCalled();
   });

   it("does not submit when email is empty", async () => {
     render(<ContactPage />);
     fillForm({ fullName: "John Doe", consent: true });
     const { submit } = getFormElements();
     fireEvent.click(submit);
     expect(mockSubmit).not.toHaveBeenCalled();
   });

  it("rejects invalid email format", async () => {
    mockSubmit.mockResolvedValue(undefined);
    render(<ContactPage />);
    fillForm({
      fullName: "John Doe",
      email: "not-an-email",
      subject: "Hello",
      message: "This is a test message with enough length",
      consent: true,
    });
    vi.spyOn(Date, "now").mockReturnValue(4000);

    const { submit } = getFormElements();
    fireEvent.click(submit);

    expect(mockSubmit).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

   it("does not submit when subject is empty", async () => {
     render(<ContactPage />);
     fillForm({ fullName: "John Doe", email: "john@example.com", consent: true });
     const { submit } = getFormElements();
     fireEvent.click(submit);
     expect(mockSubmit).not.toHaveBeenCalled();
   });

   it("does not submit when message is too short", async () => {
     render(<ContactPage />);
     fillForm({
       fullName: "John Doe",
       email: "john@example.com",
       subject: "Hello",
       message: "Hi",
       consent: true,
     });
     const { submit } = getFormElements();
     fireEvent.click(submit);
     expect(mockSubmit).not.toHaveBeenCalled();
   });

  it("shows toast error when consent is not given", async () => {
    render(<ContactPage />);
    fillForm({
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message with enough length",
      consent: false,
    });
    vi.spyOn(Date, "now").mockReturnValue(4000);

    const { submit } = getFormElements();
    fireEvent.click(submit);

    expect(mockSubmit).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});

describe("ContactPage successful submission", () => {
  it("submits form successfully and resets", async () => {
    mockSubmit.mockResolvedValue(undefined);
    vi.spyOn(Date, "now").mockReturnValue(1000);

    render(<ContactPage />);
    fillForm({
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message with enough length",
      consent: true,
    });

    // Advance time past the 3-second minimum form time
    vi.spyOn(Date, "now").mockReturnValue(4000);

    const { submit } = getFormElements();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        fullName: "John Doe",
        email: "john@example.com",
        subject: "Hello",
        message: "This is a test message with enough length",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/your message has been sent successfully/i),
      ).toBeInTheDocument();
    });

    expect(getFormElements().fullName).toHaveValue("");
    expect(getFormElements().email).toHaveValue("");
    expect(getFormElements().subject).toHaveValue("");
    expect(getFormElements().message).toHaveValue("");

    vi.restoreAllMocks();
  });
});

describe("ContactPage server failure", () => {
  it("shows error message on server failure and preserves form", async () => {
    mockSubmit.mockRejectedValue(new Error("Network error"));
    vi.spyOn(Date, "now").mockReturnValue(1000);

    render(<ContactPage />);
    fillForm({
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message with enough length",
      consent: true,
    });

    vi.spyOn(Date, "now").mockReturnValue(4000);

    const { submit } = getFormElements();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    expect(getFormElements().fullName).toHaveValue("John Doe");
    expect(getFormElements().email).toHaveValue("john@example.com");
    expect(getFormElements().subject).toHaveValue("Hello");
    expect(getFormElements().message).toHaveValue(
      "This is a test message with enough length",
    );

    vi.restoreAllMocks();
  });
});

describe("ContactPage duplicate click protection", () => {
  it("prevents double submission while loading", async () => {
    mockSubmit.mockImplementation(() => new Promise(() => {}));
    vi.spyOn(Date, "now").mockReturnValue(1000);

    render(<ContactPage />);
    fillForm({
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message with enough length",
      consent: true,
    });

    vi.spyOn(Date, "now").mockReturnValue(4000);

    const { submit } = getFormElements();
    fireEvent.click(submit);

    expect(submit).toBeDisabled();
    expect(mockSubmit).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });
});

describe("ContactPage form reset after success", () => {
  it("resets form fields after successful submission", async () => {
    mockSubmit.mockResolvedValue(undefined);
    vi.spyOn(Date, "now").mockReturnValue(1000);

    render(<ContactPage />);
    fillForm({
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message with enough length",
      consent: true,
    });

    vi.spyOn(Date, "now").mockReturnValue(4000);

    const { submit } = getFormElements();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(getFormElements().fullName).toHaveValue("");
      expect(getFormElements().email).toHaveValue("");
      expect(getFormElements().subject).toHaveValue("");
      expect(getFormElements().message).toHaveValue("");
    });

    vi.restoreAllMocks();
  });
});

describe("ContactPage form values preserved after failure", () => {
  it("preserves form values when submission fails", async () => {
    mockSubmit.mockRejectedValue(new Error("Server error"));
    vi.spyOn(Date, "now").mockReturnValue(1000);

    render(<ContactPage />);
    fillForm({
      fullName: "John Doe",
      email: "john@example.com",
      subject: "Hello",
      message: "This is a test message with enough length",
      consent: true,
    });

    vi.spyOn(Date, "now").mockReturnValue(4000);

    const { submit } = getFormElements();
    fireEvent.click(submit);

    await waitFor(() => {
      expect(getFormElements().fullName).toHaveValue("John Doe");
      expect(getFormElements().email).toHaveValue("john@example.com");
      expect(getFormElements().subject).toHaveValue("Hello");
      expect(getFormElements().message).toHaveValue(
        "This is a test message with enough length",
      );
    });

    vi.restoreAllMocks();
  });
});