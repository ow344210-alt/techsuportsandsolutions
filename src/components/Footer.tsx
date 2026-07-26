// Public Footer. Quick Links, Services, contact/social details, and the
// newsletter signup are all dynamic — Quick Links via footer_links table,
// Services pulled live from the same services table used across the site
// (no duplicate data entry), contact/social shared with the Contact page's
// "contact-info" content section.
import { useEffect, useState } from "react";
import logo from "../assets/tech-supports-logo.png";
import { Mail, ArrowUp, Heart, Send, Loader2, Phone as PhoneIcon } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useSiteContent } from "../hooks/useSiteContent";
import { useFooterLinks } from "../hooks/useFooterLinks";
import { fetchActiveServices } from "../lib/services";
import type { Service } from "../lib/services";
import { subscribeToNewsletter } from "../lib/newsletter";

function formatSocialHandle(url: string) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "").replace(/^\/+/, "");
    return path ? `@${path}` : url;
  } catch {
    return url;
  }
}

function Footer() {
  const year = new Date().getFullYear();

  const { content } = useSiteContent("footer", {
    description:
      "Professional IT consulting, technical support, cybersecurity, cloud solutions and software development for modern businesses.",
    copyright_text: "Tech Supports & Solutions",
    newsletter_heading: "Stay Updated",
    newsletter_text: "Get the latest tips and updates delivered to your inbox.",
  });

  const { content: contactInfo } = useSiteContent("contact-info", {
    email: "techsupportsandsolutions@gmail.com",
    phone: "0327-8226689",
    facebook_url: "",
    instagram_url: "https://www.instagram.com/techsupportsandsolutions/",
    linkedin_url: "",
    twitter_url: "",
  });

  const { links: quickLinks, loading: linksLoading } = useFooterLinks();

  const [services, setServices] = useState<Service[]>([]);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        const data = await fetchActiveServices();
        if (isMounted) setServices(data.slice(0, 5));
      } catch {
        // Silently ignore on public page
      }
    }

    void loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleNewsletterSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (subscribing) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newsletterEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubscribing(true);
    try {
      await subscribeToNewsletter(newsletterEmail);
      toast.success("You're subscribed! Thanks for joining.");
      setNewsletterEmail("");
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

  const socialLinks = [
    { url: contactInfo.facebook_url, icon: FaFacebook, label: "Facebook" },
    { url: contactInfo.instagram_url, icon: FaInstagram, label: "Instagram" },
    { url: contactInfo.linkedin_url, icon: FaLinkedin, label: "LinkedIn" },
    { url: contactInfo.twitter_url, icon: FaTwitter, label: "Twitter" },
  ].filter((s) => s.url && s.url.trim().length > 0);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#050B16] text-white">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -left-40 top-0 h-[350px] w-[350px] rounded-full bg-purple-600/10 blur-[150px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[350px] w-[350px] rounded-full bg-pink-500/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Newsletter strip */}
        <div className="mb-12 flex flex-col items-stretch gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:mb-16 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-bold sm:text-xl">{content.newsletter_heading}</h3>
            <p className="mt-1 text-sm text-gray-400">
              {content.newsletter_text}
            </p>
          </div>

          <form
            onSubmit={handleNewsletterSubmit}
            className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-md"
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
            />
            <button
              type="submit"
              disabled={subscribing}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {subscribing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>Subscribe</span>
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-4">
          {/* Company */}
          <div className="sm:col-span-2 lg:col-span-1">
            <img
              src={logo}
              alt="Tech Supports & Solutions"
              className="mb-5 h-16 w-auto object-contain sm:h-20"
            />
            <p className="max-w-sm text-sm leading-7 text-gray-400 sm:text-base sm:leading-8">
              {content.description}
            </p>

          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-lg font-bold sm:mb-6 sm:text-xl">Quick Links</h3>
            {linksLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 w-24 animate-pulse rounded bg-white/5"
                  />
                ))}
              </div>
            ) : (
              <ul className="space-y-3 text-sm text-gray-400 sm:space-y-4 sm:text-base">
                {quickLinks.map((link) => (
                  <li key={link.id}>
                    {link.url.startsWith("http") ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition hover:text-purple-400"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.url}
                        className="transition hover:text-purple-400"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Services — live from database, no duplicate entry needed */}
          <div>
            <h3 className="mb-5 text-lg font-bold sm:mb-6 sm:text-xl">Services</h3>
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">
                Services will appear here soon.
              </p>
            ) : (
              <ul className="space-y-3 text-sm text-gray-400 sm:space-y-4 sm:text-base">
                {services.map((service) => (
                  <li key={service.id}>
                    <Link
                      to="/services"
                      className="transition hover:text-purple-400"
                    >
                      {service.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-lg font-bold sm:mb-6 sm:text-xl">Contact</h3>
            <div className="space-y-4">
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex items-start gap-3 text-gray-400 transition hover:text-purple-400"
              >
                <Mail size={18} className="mt-0.5 shrink-0" />
                <span className="min-w-0 break-all text-sm">{contactInfo.email}</span>
              </a>
              <a
                href={`tel:${contactInfo.phone}`}
                className="flex items-center gap-3 text-gray-400 transition hover:text-purple-400"
              >
                <PhoneIcon size={18} className="shrink-0" />
                <span className="text-sm">{contactInfo.phone}</span>
              </a>

              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-400 transition hover:text-purple-400"
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="break-all text-sm">{formatSocialHandle(social.url)}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center gap-6 border-t border-white/10 pt-8 sm:mt-14 sm:flex-row sm:justify-between sm:gap-4">
          <p className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-gray-500 sm:text-left">
            © {year} {content.copyright_text}
            <Heart size={16} className="text-pink-500" fill="currentColor" />
            All Rights Reserved.
          </p>

          <a
            href="#home"
            aria-label="Back to top"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition duration-300 hover:scale-110"
          >
            <ArrowUp size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;