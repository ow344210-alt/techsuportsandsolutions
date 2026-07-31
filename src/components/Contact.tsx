import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { MessageSquareText, Send, ShieldCheck, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { submitContactMessage } from "../lib/contactMessages";
import { useSiteContent } from "../hooks/useSiteContent";
import DynamicPageSections from "./DynamicPageSections";
import ContactInfoCard from "./ContactInfoCard";
import ContactMap from "./ContactMap";
import FAQ from "./FAQ";
import Section from "./ui/Section";
import Button from "./ui/Button";
import SEO from "./seo/SEO";

const initialForm = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
  consent: false,
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const formStartTimeRef = useRef(0);
  const MIN_FORM_TIME_MS = 3000;

  useEffect(() => {
    formStartTimeRef.current = Date.now();
  }, []);

  const { content } = useSiteContent("contact", {
    badge_text: "Contact Us",
    heading: "Let's talk about your next project.",
    subheading:
      "Reach out for support, general questions, or custom solutions. We'll get back to you as soon as possible.",
    trust_statement:
      "Your information is safe with us. We never share your details with third parties.",
    form_heading: "Send us a message",
    form_instructions:
      "Fill out the form below and we'll get back to you within 2 hours during business hours.",
    submit_btn_text: "Send Message",
    consent_text: "I agree to the privacy policy and consent to being contacted.",
    footer_note: "Prefer email? Write to techsupportsandsolutions@gmail.com and we'll point you to the right person.",
    response_time_note: "We typically respond within 2 hours during business hours.",
    cta_heading: "Ready to get started?",
    cta_text: "Let's discuss your project and how we can help you achieve your goals.",
    cta_button_text: "Get in Touch",
  });

  function handleChange(
    field: keyof typeof initialForm,
    value: string | boolean
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
  }

  function validateForm() {
    if (!form.fullName.trim()) {
      toast.error("Please enter your full name.");
      return false;
    }
    if (!form.email.trim()) {
      toast.error("Please enter your email address.");
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!form.subject.trim()) {
      toast.error("Please enter a subject.");
      return false;
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast.error("Please enter a message with at least 10 characters.");
      return false;
    }
    if (!form.consent) {
      toast.error("Please agree to the privacy policy before submitting.");
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    const elapsed = Date.now() - formStartTimeRef.current;
    if (elapsed < MIN_FORM_TIME_MS) {
      toast.error("Please wait a moment before submitting.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await submitContactMessage({
        fullName: form.fullName,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      setSubmitSuccess(true);
      toast.success("Your message has been sent successfully.");
      setForm(initialForm);
      formStartTimeRef.current = Date.now();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send your message right now.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }
  const glow = (
    <>
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />
    </>
  );

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Tech Supports & Solutions for support, general questions, or custom software solutions. We typically respond within 2 business hours."
        canonicalPath="/contact"
      />
      <Section id="contact" className="bg-slate-950 pt-28 text-white md:pt-40" maxWidth="form" decoration={glow}>
        <div className="mb-12 max-w-3xl">
          <span className="inline-flex rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-600/20 to-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
            {content.badge_text}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight leading-tight sm:text-5xl">{content.heading}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">{content.subheading}</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={16} />
            {content.trust_statement}
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <div className="h-full">
            <ContactInfoCard />
          </div>

          <form
            onSubmit={handleSubmit}
            className="h-full rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-8 shadow-2xl shadow-violet-950/25 transition-transform duration-300 hover:translate-y-[-4px]"
          >
            <h2 className="text-2xl font-bold text-white">{content.form_heading}</h2>
            <p className="mt-2 text-sm text-slate-400">{content.form_instructions}</p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Full Name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => handleChange("fullName", event.target.value)}
                  placeholder="Your full name"
                  className="w-full h-14 rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-14 rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Subject</span>
              <input
                type="text"
                value={form.subject}
                onChange={(event) => handleChange("subject", event.target.value)}
                placeholder="How can we help?"
                className="w-full h-14 rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Message</span>
              <textarea
                rows={8}
                value={form.message}
                onChange={(event) => handleChange("message", event.target.value)}
                placeholder="Tell us about your goals or requirements"
                className="w-full min-h-[220px] rounded-xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
              />
            </label>

            <label className="mt-5 flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(event) => handleChange("consent", event.target.checked)}
                className="h-5 w-5 rounded border-white/20 bg-slate-950 text-violet-500 focus:ring-violet-500/40"
              />
              <span className="text-sm text-slate-300">{content.consent_text}</span>
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting}
              loadingText="Sending..."
              icon={<Send size={18} />}
              iconPosition="left"
              className="mt-6"
            >
              {content.submit_btn_text}
            </Button>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <Clock size={16} />
              {content.response_time_note}
            </div>

            {submitError && (
              <div
                className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400"
                role="alert"
              >
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div
                className="mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400"
                role="status"
              >
                Your message has been sent successfully. We'll get back to you
                soon.
              </div>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <MessageSquareText size={16} />
              {content.footer_note}
            </div>
          </form>
        </div>

        {/* Full-width map below the cards */}
        <div className="mt-8">
          <ContactMap />
        </div>
      </Section>

      {/* Final call to action */}
      <Section id="contact-cta" className="bg-slate-900 text-white" maxWidth="form">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{content.cta_heading}</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg leading-8 text-slate-300">{content.cta_text}</p>
          <Button
            variant="primary"
            size="lg"
            className="mt-8"
            onClick={() => {
              const contactSection = document.getElementById("contact");
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            {content.cta_button_text}
          </Button>
        </div>
      </Section>

      <FAQ section="contact-faq" page="contact-faq" />
      <DynamicPageSections page="contact" />
    </>
  );
}