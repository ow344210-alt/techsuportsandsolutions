import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lightbulb,
  ListChecks,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
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
import { BackgroundDecorations } from "./background";
import customerConsultationImg from "../assets/services/customer-consultation.png";

const initialForm = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
  consent: false,
};

const WHAT_HAPPENS_NEXT = [
  {
    icon: MessageSquareText,
    title: "We review your message",
    description:
      "Our team reads every inquiry and routes it to the specialist who fits your request.",
  },
  {
    icon: Search,
    title: "We reach out",
    description:
      "We contact you at the email or phone you provided to understand your goals and answer questions.",
  },
  {
    icon: CheckCircle2,
    title: "We propose next steps",
    description:
      "You get clear options, timelines, and recommendations so you know exactly what happens next.",
  },
];

const GUIDANCE_ITEMS = [
  "The goal or outcome you're hoping for",
  "Your current setup — platforms, tools, or systems you already use",
  "A rough timeline or deadline, if you have one",
  "Your budget range, if you're comfortable sharing it",
  "Any examples or reference sites you like",
  "Anything you've already tried",
];

function scrollToContactForm() {
  const formSection = document.getElementById("contact-form");
  if (formSection) {
    formSection.scrollIntoView({ behavior: "smooth" });
  }
}

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
    heading: "Let's talk about what your business needs.",
    subheading:
      "Tell us about your project, ask a question, or request support. We'll route your message to the right person and get back to you as soon as possible.",
    trust_statement:
      "Your information is safe with us. We never share your details with third parties.",
    form_heading: "Send us a message",
    form_instructions:
      "Fill out the form below and our team will get back to you as soon as possible.",
    submit_btn_text: "Send Message",
    consent_text: "I agree to the privacy policy and consent to being contacted.",
    footer_note: "Prefer email? Write to techsupportsandsolutions@gmail.com and we'll point you to the right person.",
    response_time_note: "We review every message and get back to you as soon as we can.",
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

  const heroGlow = <BackgroundDecorations preset="heroMinimal" />;

  return (
    <>
      <SEO
        title="Contact Us"
        description="Get in touch with Tech Supports & Solutions for support, general questions, or custom software solutions."
        canonicalPath="/contact"
      />

      {/* Hero */}
      <Section
        id="contact"
        className="bg-[#07101D] pt-20 pb-12 text-white md:pt-24 md:pb-16 lg:pt-28"
        decoration={heroGlow}
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-600/20 to-pink-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
              {content.badge_text}
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight leading-tight text-white sm:text-5xl lg:text-6xl">
              {content.heading}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
              {content.subheading}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                variant="primary"
                size="lg"
                icon={<Send size={18} />}
                iconPosition="left"
                onClick={scrollToContactForm}
              >
                Send Your Inquiry
              </Button>
              <Button
                variant="outline"
                size="lg"
                to="/services"
                icon={<ArrowRight size={18} />}
                iconPosition="right"
              >
                Explore Our Services
              </Button>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck size={16} className="shrink-0 text-violet-400" />
              {content.trust_statement}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl shadow-violet-950/40">
              <img
                src={customerConsultationImg}
                alt="A consultant speaking with a customer about their project"
                className="h-auto w-full rounded-3xl object-contain"
                loading="eager"
              />
            </div>
            <div className="absolute -left-3 top-6 hidden items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur-md sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Office hours</p>
                <p className="text-sm font-semibold text-white">Mon–Fri, 9:00–6:00</p>
              </div>
            </div>
            <div className="absolute -right-3 bottom-6 hidden items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-xl backdrop-blur-md sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-300">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Email us</p>
                <p className="text-sm font-semibold text-white">
                  techsupportsandsolutions@gmail.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Contact Methods */}
      <Section
        className="bg-[#07101D] text-white"
        spacing="tight"
        decoration={<BackgroundDecorations preset="cards" />}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="mailto:techsupportsandsolutions@gmail.com"
            className="group rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl hover:shadow-violet-950/25"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
              <Mail size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Email Us</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              techsupportsandsolutions@gmail.com
            </p>
          </a>

          <a
            href="tel:03278226689"
            className="group rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl hover:shadow-violet-950/25"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
              <Phone size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Call Us</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">0327-8226689</p>
          </a>

          <a
            href="https://www.google.com/maps/search/?api=1&query=Head+Quarter+Karachi+Sindh+Pakistan"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl hover:shadow-violet-950/25"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
              <MapPin size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Visit Us</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">Head Quarter Karachi, Sindh, Pakistan</p>
          </a>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
              <Clock size={20} />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">Office Hours</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              Mon–Fri, 9:00 AM–6:00 PM
              <br />
              Sat · Sun closed
            </p>
          </div>
        </div>
      </Section>

      {/* Contact Form + Supporting Info */}
      <Section
        id="contact-form"
        className="bg-[#07101D] text-white"
        spacing="tight"
        maxWidth="form"
        decoration={<BackgroundDecorations preset="splitRight" />}
      >
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
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
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
                  id="email"
                  name="email"
                  autoComplete="email"
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
                id="subject"
                name="subject"
                value={form.subject}
                onChange={(event) => handleChange("subject", event.target.value)}
                placeholder="How can we help?"
                className="w-full h-14 rounded-xl border border-white/10 bg-slate-950 px-4 text-white outline-none transition focus:ring-2 focus:ring-violet-500/40 focus:border-transparent"
              />
            </label>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-semibold uppercase text-slate-200">Message</span>
              <textarea
                id="message"
                name="message"
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
                id="consent"
                name="consent"
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
      </Section>

      {/* Full-width map below the cards */}
      <section aria-label="Office location" className="bg-[#07101D] pb-16 md:pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <ContactMap />
        </div>
      </section>

      {/* What Happens After You Submit */}
      <Section
        className="bg-[#091426] text-white"
        decoration={<BackgroundDecorations preset="grid" />}
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
            What happens next
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            After you send your message
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            We keep the process simple and keep you informed at every step.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {WHAT_HAPPENS_NEXT.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-slate-950/80 to-slate-950/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/40"
              >
                <span className="absolute right-6 top-6 text-5xl font-extrabold text-white/5">
                  {index + 1}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Project Inquiry Guidance */}
      <Section
        className="bg-[#07101D] text-white"
        decoration={<BackgroundDecorations preset="splitLeft" />}
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-200">
              Before you write
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Make your inquiry count
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              You don't need perfect answers — but a few details help us give
              you a more useful response on the first reply.
            </p>

            <ul className="mt-8 space-y-4">
              {GUIDANCE_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-violet-400"
                  />
                  <span className="text-base text-slate-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-900/60 p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
              <Lightbulb size={20} />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-white">
              Not sure where to start?
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              No problem. Send whatever you know and mention that you'd like
              help shaping the idea — we'll ask a few questions and help you
              clarify your requirements before we talk about solutions.
            </p>
            <div className="mt-6 rounded-2xl bg-slate-950/70 p-5">
              <div className="flex items-center gap-2 text-violet-300">
                <ListChecks size={18} className="shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  A quick example
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                "We run a small retail business and want a website where
                customers can view our products and contact us. We have no
                existing website and a deadline of about two months."
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-6"
              fullWidth
              onClick={scrollToContactForm}
            >
              Write Your Message
            </Button>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <FAQ
        id="contact-faq"
        section="contact-faq"
        pages={["contact-faq", "home", "services-faq", "projects-faq"]}
      />

      <DynamicPageSections page="contact" />
    </>
  );
}
