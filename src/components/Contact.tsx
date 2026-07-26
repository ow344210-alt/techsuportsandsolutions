import { useState } from "react";
import type { FormEvent } from "react";
import { MessageSquareText, Send } from "lucide-react";
import toast from "react-hot-toast";
import { submitContactMessage } from "../lib/contactMessages";
import { useSiteContent } from "../hooks/useSiteContent";
import DynamicPageSections from "./DynamicPageSections";
import ContactInfoCard from "./ContactInfoCard";
import ContactMap from "./ContactMap";
import FAQ from "./FAQ";
import Section from "./ui/Section";
import Button from "./ui/Button";

const initialForm = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { content } = useSiteContent("contact", {
    badge_text: "Contact Us",
    heading: "Let's talk about your next project.",
    subheading: "Reach out for support, general questions, or custom solutions. We'll get back to you as soon as possible.",
    submit_btn_text: "Send Message",
    footer_note: "Validation happens in the browser before submission to Supabase.",
  });

  function handleChange(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
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
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await submitContactMessage({
        fullName: form.fullName,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      toast.success("Your message has been sent successfully.");
      setForm(initialForm);
    } catch (error) {
      console.error(error);
      toast.error("Unable to send your message right now. Please try again later.");
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
      <Section id="contact" className="bg-slate-950 text-white py-[100px]" maxWidth="form" decoration={glow}>
        <div className="mb-12 max-w-3xl">
          <span className="inline-flex rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-600/20 to-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
            {content.badge_text}
          </span>
          <h1 className="mt-5 text-5xl font-extrabold tracking-tight leading-tight sm:text-6xl">{content.heading}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">{content.subheading}</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <div className="h-full">
            <ContactInfoCard />
          </div>

          <form
            onSubmit={handleSubmit}
            className="h-full rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-8 shadow-2xl shadow-violet-950/25 transition-transform duration-300 hover:translate-y-[-4px]"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Full Name</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) => handleChange("fullName", event.target.value)}
                  placeholder="Your full name"
                  className="w-full h-14 rounded-2xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-14 rounded-2xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
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
                className="w-full h-14 rounded-2xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Message</span>
              <textarea
                rows={8}
                value={form.message}
                onChange={(event) => handleChange("message", event.target.value)}
                placeholder="Tell us about your goals or requirements"
                className="w-full min-h-[220px] rounded-2xl border border-white/10 bg-slate-950 px-4 py-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
              />
            </label>

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              size="lg"
              fullWidth
              icon={<Send size={18} />}
              iconPosition="left"
              className="mt-6 rounded-2xl py-4 bg-gradient-to-r from-violet-500 to-pink-500 shadow-lg hover:scale-[1.02] transition-transform duration-300"
            >
              {isSubmitting ? "Sending..." : content.submit_btn_text}
            </Button>

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

      <FAQ section="contact-faq" page="contact-faq" />
      <DynamicPageSections page="contact" />
    </>
  );
}