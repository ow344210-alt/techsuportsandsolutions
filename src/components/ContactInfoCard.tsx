// Comprehensive, dynamic business info card for the Contact page — combines
// contact details, working hours, emergency support, response time, and
// social links into a single polished card. All content editable via the
// Content Manager admin panel under the "contact-info" section.
import { Mail, Phone, MapPin, Clock, Zap, Timer } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { useSiteContent } from "../hooks/useSiteContent";

function formatSocialHandle(url: string) {
  try {
    const path = new URL(url).pathname.replace(/\/+$/, "").replace(/^\/+/, "");
    return path ? `@${path}` : url;
  } catch {
    return url;
  }
}

function ContactInfoCard() {
  const { content } = useSiteContent("contact-info", {
    email: "techsupportsandsolutions@gmail.com",
    phone: "0327-8226689",
    address: "Mashriq Centre Karachi",
    working_days: "Monday - Friday",
    working_hours: "9:00 AM - 6:00 PM",
    weekend_days: "Saturday",
    weekend_hours: "10:00 AM - 4:00 PM",
    sunday_status: "Closed",
    emergency_note: "24/7 emergency support available for active clients",
    emergency_phone: "0327-8226689",
    response_time: "Under 2 hours",
    facebook_url: "",
    instagram_url: "https://www.instagram.com/techsupportsandsolutions/",
    linkedin_url: "",
    twitter_url: "",
  });

  const socialLinks = [
    { url: content.facebook_url, icon: FaFacebook, label: "Facebook" },
    { url: content.instagram_url, icon: FaInstagram, label: "Instagram" },
    { url: content.linkedin_url, icon: FaLinkedin, label: "LinkedIn" },
    { url: content.twitter_url, icon: FaTwitter, label: "Twitter" },
  ].filter((s) => s.url && s.url.trim().length > 0);

  return (
    <div className="h-full rounded-3xl border border-white/8 bg-gradient-to-b from-white/3 to-white/2 p-6 backdrop-blur-md shadow-xl transition-transform duration-300 hover:-translate-y-1 sm:p-8">
      {/* Direct contact details */}
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-2xl bg-slate-900/65 p-5 transition-all duration-300 hover:bg-slate-900/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
            <Mail size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-none text-white">
              Email
            </h2>

            <p className="mt-1.5 break-all text-sm leading-6 text-slate-300">
              {content.email}
            </p>
          </div>
        </div>

        {/* Social Links */}
        {socialLinks.map((social) => {
          const Icon = social.icon;

          return (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl bg-slate-900/65 p-5 transition-all duration-300 hover:bg-slate-900/80"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
                <Icon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-none text-white">
                  {social.label}
                </h2>

                <p className="mt-1.5 break-all text-sm leading-6 text-slate-300">
                  {formatSocialHandle(social.url)}
                </p>
              </div>
            </a>
          );
        })}

        {/* Phone */}
        <div className="flex items-center gap-4 rounded-2xl bg-slate-900/65 p-5 transition-all duration-300 hover:bg-slate-900/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
            <Phone size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-none text-white">
              Phone
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-300">
              {content.phone}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-4 rounded-2xl bg-slate-900/65 p-5 transition-all duration-300 hover:bg-slate-900/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
            <MapPin size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold leading-none text-white">
              Location
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-300">
              {content.address}
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 h-px bg-white/10" />

      {/* Working hours */}
      <div className="flex items-start gap-4 rounded-2xl bg-slate-900/65 p-5 transition-all duration-300 hover:bg-slate-900/80">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-500/10 text-violet-300">
          <Clock size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="mb-4 text-base font-semibold leading-none text-white">
            Office Hours
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">{content.working_days}</span>

              <span className="font-medium text-white whitespace-nowrap">
                {content.working_hours}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">{content.weekend_days}</span>

              <span className="font-medium text-white whitespace-nowrap">
                {content.weekend_hours}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Sunday</span>

              <span className="font-medium text-white whitespace-nowrap">
                {content.sunday_status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Response Time + Emergency */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-900/65 p-5 transition-all duration-300 hover:bg-slate-900/80">
          <div className="mb-3 flex items-center gap-2 text-violet-300">
            <Timer size={18} className="shrink-0" />

            <span className="text-xs font-semibold uppercase tracking-wider">
              Response Time
            </span>
          </div>

          <p className="text-sm font-medium leading-6 text-white">
            {content.response_time}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/65 p-5 transition-all duration-300 hover:bg-slate-900/80">
          <div className="mb-3 flex items-center gap-2 text-pink-300">
            <Zap size={18} className="shrink-0" />

            <span className="text-xs font-semibold uppercase tracking-wider">
              Emergency Support
            </span>
          </div>

          <p className="break-all text-sm font-medium leading-6 text-white">
            {content.emergency_phone}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-400">
            {content.emergency_note}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContactInfoCard;
