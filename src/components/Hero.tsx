import logo from "../assets/logo.webp";
import { ArrowRight, Play } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Button from "./ui/Button";
import { BackgroundDecorations } from "./background";

function Hero() {
  const { content } = useSiteContent("hero", {
    badge_text: "Available For New Projects",
    heading_line1: "Technology",
    heading_line2: "Made Simple.",
    subheading:
      "Tech Supports & Solutions helps businesses solve IT challenges, improve security, build scalable software and deliver reliable technical support through modern technology.",
    primary_btn_text: "Start Project",
    secondary_btn_text: "Explore Services",
  });

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-[#07101D] pt-5 text-white"
    >
      <BackgroundDecorations preset="hero" density="rich" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2">
        {/* LEFT */}

        <div data-aos="fade-right" className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-wide text-purple-300 backdrop-blur-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
            {content.badge_text}
          </span>

          <h1 className="mt-8 text-4xl font-extrabold leading-tight break-words sm:text-5xl lg:text-6xl">
            {content.heading_line1}
            <span className="block gradient-text">{content.heading_line2}</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-gray-400 lg:mx-0">
            {content.subheading}
          </p>

          {/* Buttons */}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button to="/contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              {content.primary_btn_text}
            </Button>

            <Button
              to="/services"
              variant="secondary"
              size="lg"
              icon={<Play size={18} />}
              iconPosition="left"
            >
              {content.secondary_btn_text}
            </Button>
          </div>
        </div>

        {/* RIGHT */}

        <div className="relative flex items-center justify-center">
          <div className="hero-logo-glow absolute h-[420px] w-[420px] rounded-full bg-gradient-to-r from-purple-600 to-sky-400 blur-[120px]" />

          <div className="hero-smoke absolute inset-0" aria-hidden="true">
            <div className="hero-smoke-blob hero-smoke-blob-a" />
            <div className="hero-smoke-blob hero-smoke-blob-b" />
            <div className="hero-smoke-blob hero-smoke-blob-c" />
            <div className="hero-smoke-blob hero-smoke-blob-d" />
          </div>

          <div className="hero-logo-hover relative z-10 transition-transform duration-500 ease-in-out hover:-translate-y-2">
            <img
              src={logo}
              alt="Tech Supports & Solutions"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="hero-logo-float w-[min(100%,280px)] sm:w-[360px] lg:w-[480px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;