// Embeds a Google Map based on the office address stored in site_content.
// No API key required — uses the public Maps embed query format.
import { useSiteContent } from "../hooks/useSiteContent";

function ContactMap() {
  const { content } = useSiteContent("contact-info", {
    address: "Mashriq Centre Karachi",
  });

  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(content.address)}&output=embed`;

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-lg">
      <iframe
        title="Office Location"
        src={mapSrc}
        width="100%"
        className="h-[300px] sm:h-[420px]"
        style={{ border: 0, filter: "grayscale(0.3) invert(0.92) contrast(0.9)" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export default ContactMap;