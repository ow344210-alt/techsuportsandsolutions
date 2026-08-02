import { useState } from "react";
import toast from "react-hot-toast";
import { Send, Mail } from "lucide-react";
import { subscribeToNewsletter } from "../lib/newsletter";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import Button from "./ui/Button";

function Newsletter() {
  const { content } = useSiteContent("newsletter", {
    badge_text: "STAY IN THE LOOP",
    heading_line1: "Get the Latest",
    heading_line2: "Updates & Insights",
    subheading:
      "Join our newsletter for practical tips, product news, and industry insights — no spam, unsubscribe anytime.",
    input_placeholder: "Enter your email",
    button_text: "Subscribe",
    success_message: "You're subscribed! Thanks for joining.",
  });

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (subscribing) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubscribing(true);
    try {
      await subscribeToNewsletter(email);
      toast.success(content.success_message);
      setEmail("");
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_SUBSCRIBED") {
        toast.error("This email is already subscribed.");
      } else {
        toast.error("Unable to subscribe right now. Please try again.");
      }
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <Section id="newsletter" className="bg-[#07101D] text-white">
      <div
        data-aos="fade-up"
        className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-gradient-to-br from-[#141C2D] via-[#0E1627] to-[#141C2D] px-6 py-14 sm:px-10 sm:py-16 lg:px-16"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-pink-500/20 blur-[120px]" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
              <Mail size={16} />
              {content.badge_text}
            </span>

            <h2 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
              {content.heading_line1}
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                {content.heading_line2}
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400 lg:mx-0">
              {content.subheading}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <input
              type="email"
              id="newsletter-email"
              name="newsletter-email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={content.input_placeholder}
              aria-label="Email address"
              className="w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111827] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20"
            />
            <Button
              type="submit"
              size="md"
              loading={subscribing}
              loadingText="Subscribing..."
              icon={<Send size={16} />}
              className="shrink-0"
            >
              {content.button_text}
            </Button>
          </form>
        </div>
      </div>
    </Section>
  );
}

export default Newsletter;
