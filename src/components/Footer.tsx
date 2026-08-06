// Public Footer. The middle area follows a strict, balanced four-column layout
// (Brand, Services, Quick Links, Contact) where every column carries roughly
// the same six-row rhythm. Services use the site's real service titles and
// routes; Quick Links are the six main public routes from the shared nav
// config; contact details are shared with the Contact page's "contact-info"
// content section, with an admin-managed social icon row (footer_social_links)
// completing the Contact column.
import { useEffect, useState, type ReactNode } from "react";
import logo from "../assets/tech-supports-logo.webp";
import {
  ArrowUp,
  Clock,
  Heart,
  Mail,
  MapPin,
  Phone as PhoneIcon,
  Send,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useSiteContent } from "../hooks/useSiteContent";
import { useFooterLinks } from "../hooks/useFooterLinks";
import { useFooterSocialLinks } from "../hooks/useFooterSocialLinks";
import { getFooterSocialIcon } from "../lib/footerSocialLinks";
import { NAV_LINKS } from "../config/nav.config";
import { fetchActiveServices } from "../lib/services";
import type { Service } from "../lib/services";
import { subscribeToNewsletter } from "../lib/newsletter";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

// The six primary services shown in the footer, using the site's real service
// labels. They use the real service title and, once the live service record
// loads, its real anchor route. Removing entries from the footer never
// affects the actual service pages or CMS data.
const FOOTER_SERVICE_TITLES: string[] = [
  "Web Development",
  "Mobile App Development",
  "Software Development",
  "UI/UX Design",
  "Digital Marketing",
  "Cloud & IT Services",
];

// The six public Quick Links shown in the footer, derived from the shared nav
// config so they always keep the site's exact internal routes.
const FOOTER_QUICK_LINKS: Array<{ label: string; url: string }> = NAV_LINKS.map(
  (link) => ({ label: link.name, url: link.href }),
);

// Concise, professional description for the Brand column. It paraphrases the
// company's real information already stored in site_content (footer →
// description) and is tuned to fill roughly six visual lines on desktop so the
// Brand column balances the three link columns.
const FOOTER_DESCRIPTION =
  "Tech Supports & Solutions builds and maintains websites, mobile applications, and reliable business software for startups and growing companies. Based in Karachi, we deliver practical technology solutions with trusted ongoing support to clients worldwide.";

// Normalizes a service title so footer labels match live CMS titles even when
// punctuation or conjunctions differ (e.g. "Cloud & IT Services" vs
// "Cloud and IT Services").
function normalizeServiceTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\band\b/g, "")
    .replace(/[&\s-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Shared styling for every footer navigation link: compact, natural line
// height, a subtle purple hover plus a keyboard-focus ring. `inline-block`
// keeps the hit area close to the label instead of stretching across the
// whole column, while `py-0.5` keeps the tap target comfortable.
const FOOTER_NAV_LINK_CLASS =
  "inline-block py-0.5 leading-6 transition-colors hover:text-purple-400 focus-visible:text-purple-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/70";

type FooterServiceLink = { key: string; title: string; url: string };

// Consistent, compact column heading: small text with a short, subtle purple
// underline so all headings sit on the same baseline as one aligned row.
function FooterColumnHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-sm font-semibold text-white">
      {children}
      <span
        aria-hidden="true"
        className="mt-1.5 block h-0.5 w-6 rounded-full bg-purple-500"
      />
    </h3>
  );
}

type ContactRowProps = {
  icon: ReactNode;
  children: ReactNode;
  href?: string;
  external?: boolean;
  nowrap?: "always" | "sm";
};

// One consistent Contact row: fixed-width icon area, then text that always
// starts from the same horizontal position. Every row shares the same height,
// line height, spacing, and icon size so the column keeps a clean six-row
// rhythm.
function ContactRow({
  icon,
  children,
  href,
  external = false,
  nowrap,
}: ContactRowProps) {
  const nowrapClass =
    nowrap === "always" ? "whitespace-nowrap" : nowrap === "sm" ? "sm:whitespace-nowrap" : "";
  const linkClass =
    "transition-colors hover:text-purple-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/70";

  const text = <span className={`min-w-0 ${nowrapClass}`}>{children}</span>;

  let content: ReactNode = text;
  if (href) {
    content = external ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {text}
      </a>
    ) : (
      <a href={href} className={linkClass}>
        {text}
      </a>
    );
  }

  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex w-4 shrink-0 items-center justify-center text-purple-400">
        {icon}
      </span>
      {content}
    </li>
  );
}

function Footer() {
  const year = new Date().getFullYear();

  const { content } = useSiteContent("footer", {
    description: FOOTER_DESCRIPTION,
    copyright_text: "Tech Supports & Solutions",
    newsletter_heading: "Stay Updated",
    newsletter_text: "Get the latest tips and updates delivered to your inbox.",
  });

  const { content: contactInfo } = useSiteContent("contact-info", {
    email: "techsupportsandsolutions@gmail.com",
    phone: "+92 3372579655",
    address: "Head Quarter Karachi, Sindh, Pakistan",
    working_days: "Monday - Friday",
    working_hours: "9:00 AM - 6:00 PM",
    weekend_days: "Saturday",
    weekend_hours: "10:00 AM - 4:00 PM",
    sunday_status: "Closed",
  });

  const [services, setServices] = useState<Service[]>([]);
  const [newsletterName, setNewsletterName] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  // Admin-managed Quick Links and social links (FooterLinksManager /
  // FooterSocialLinksManager). When the database has no entries the footer
  // falls back to the shared nav config so the default layout is unchanged.
  const { links: dbQuickLinks } = useFooterLinks();
  const { links: socialLinks } = useFooterSocialLinks();

  // Social icons render in sort_order so the admin's ordering is preserved on
  // the public site even if the hook ever returns rows out of order.
  const sortedSocialLinks = [...socialLinks].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        const data = await fetchActiveServices();
        if (isMounted) setServices(data);
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
      await subscribeToNewsletter(newsletterEmail, newsletterName);
      toast.success("You're subscribed! Thanks for joining.");
      setNewsletterEmail("");
      setNewsletterName("");
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

  // The six footer services, resolved against the live service list so each
  // keeps its real title and anchor route. Titles are matched loosely so
  // footer labels still find their live record (e.g. "Cloud & IT Services"
  // matches "Cloud and IT Services"). Falls back to the plain /services route
  // while the list is still loading or a title is unpublished.
  const servicesToShow: FooterServiceLink[] = FOOTER_SERVICE_TITLES.map(
    (title) => {
      const match = services.find(
        (service) =>
          normalizeServiceTitle(service.title) === normalizeServiceTitle(title),
      );
      return {
        key: match ? match.id : `footer-service-${title}`,
        title,
        url: match ? `/services#service-${match.id}` : "/services",
      };
    },
  );

  // Admin-managed Quick Links when present, otherwise the six shared nav links.
  const quickLinksToShow: Array<{ label: string; url: string }> =
    dbQuickLinks.length > 0
      ? dbQuickLinks.map((link) => ({ label: link.label, url: link.url }))
      : FOOTER_QUICK_LINKS;

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-[#040A13] text-white">
      <BackgroundDecorations preset="footer" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:py-14">
        {/* Newsletter strip — original signup form, untouched. Heading, text,
            name + email inputs, subscribe button, validation, loading state,
            duplicate handling and success/error toasts all live here. */}
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
              type="text"
              id="footer-newsletter-name"
              name="footer-newsletter-name"
              autoComplete="name"
              value={newsletterName}
              onChange={(event) => setNewsletterName(event.target.value)}
              placeholder="Your name (optional)"
              aria-label="Name (optional)"
              className="w-full min-w-0 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400 sm:w-40 sm:shrink-0"
            />
            <input
              type="email"
              id="footer-newsletter-email"
              name="footer-newsletter-email"
              autoComplete="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Enter your email"
              className="w-full min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-violet-400"
            />
            <Button
              type="submit"
              size="md"
              loading={subscribing}
              loadingText="Subscribing..."
              icon={<Send size={16} />}
              className="shrink-0"
            >
              Subscribe
            </Button>
          </form>
        </div>

        {/* Middle footer grid — strict, balanced reference structure. Four
            columns from 1200px up, two columns on tablet, stacked below
            768px. Controlled proportions give Brand and Contact more width
            while Services and Quick Links stay compact. */}
        <nav
          aria-label="Footer"
          className="grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-x-8 min-[1200px]:!grid-cols-[1.2fr_0.9fr_0.8fr_1.35fr]"
        >
          {/* Brand — starts directly with the logo + name row (no heading),
              then a concise ~6-line description. */}
          <div className="min-w-0">
            <Link
              to="/"
              aria-label="Tech Supports & Solutions home"
              className="inline-flex items-center gap-3"
            >
              <img
                src={logo}
                alt="Tech Supports & Solutions"
                loading="lazy"
                decoding="async"
                className="h-10 w-auto shrink-0 object-contain"
              />
              <span className="whitespace-nowrap text-lg font-bold text-white">
                {content.copyright_text}
              </span>
            </Link>
            {/* `text-left` overrides the global base-layer justify rule so the
                description keeps natural word spacing. */}
            <p className="mt-3 text-left text-sm leading-6 text-gray-400">
              {content.description}
            </p>
          </div>

          {/* Services — six primary services, one simple vertical list. */}
          <div>
            <FooterColumnHeading>Services</FooterColumnHeading>
            <ul className="flex flex-col gap-2 text-sm text-gray-400">
              {servicesToShow.map((service) => (
                <li key={service.key}>
                  <Link to={service.url} className={FOOTER_NAV_LINK_CLASS}>
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links — the six main routes as router links. When an admin
              has configured footer_links these come from the database instead,
              falling back to the shared nav routes otherwise. */}
          <div>
            <FooterColumnHeading>Quick Links</FooterColumnHeading>
            <ul className="flex flex-col gap-2 text-sm text-gray-400">
              {quickLinksToShow.map((link) => (
                <li key={link.url}>
                  <Link to={link.url} className={FOOTER_NAV_LINK_CLASS}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — compact rows sharing one consistent structure:
              fixed-width icon area, aligned text, same height and spacing.
              Rows are address, email, phone, hours, then the admin-managed
              social icon row (footer_social_links, enabled rows in sort
              order — an empty set renders no icons). */}
          <div className="min-w-0">
            <FooterColumnHeading>Contact</FooterColumnHeading>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-400">
              <ContactRow icon={<MapPin size={16} />}>
                {contactInfo.address}
              </ContactRow>
              <ContactRow
                icon={<Mail size={16} />}
                href={`mailto:${contactInfo.email}`}
                nowrap="always"
              >
                {contactInfo.email}
              </ContactRow>
              <ContactRow
                icon={<PhoneIcon size={16} />}
                href={`tel:${contactInfo.phone}`}
                nowrap="always"
              >
                {contactInfo.phone}
              </ContactRow>
              <ContactRow icon={<Clock size={16} />} nowrap="sm">
                {contactInfo.working_days}: {contactInfo.working_hours}
              </ContactRow>
              {sortedSocialLinks.length > 0 && (
                <li>
                  <ul
                    className="flex flex-wrap items-center gap-2"
                    aria-label="Social media links"
                  >
                    {sortedSocialLinks.map((link) => {
                      const Icon = getFooterSocialIcon(link.icon_key);
                      return (
                        <li key={link.id}>
                          <a
                            href={link.url}
                            target={link.open_in_new_tab ? "_blank" : undefined}
                            rel={
                              link.open_in_new_tab
                                ? "noopener noreferrer"
                                : undefined
                            }
                            aria-label={link.label || link.platform_key}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:border-purple-400/40 hover:text-purple-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-400/70"
                          >
                            <Icon size={16} />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}
            </ul>
          </div>
        </nav>

        {/* Bottom bar — divider ~28–32px after the tallest column, then the
            existing copyright line and back-to-top button. Social icons live in
            the Contact column above. `text-left` keeps the copyright line off
            the global justify rule. */}
        <div className="mt-7 flex flex-col items-center gap-5 border-t border-white/10 pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-gray-500 sm:text-left">
            © {year} {content.copyright_text}
            <Heart size={16} className="text-pink-500" fill="currentColor" />
            All Rights Reserved.
          </p>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 transition duration-300 hover:scale-110"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
