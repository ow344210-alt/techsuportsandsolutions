import logo from "../assets/logo.png";
import { ArrowRight, Play } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Button from "./ui/Button";

function Hero() {
  const { content } = useSiteContent("hero", {
    badge_text: "Available For New Projects",
    heading_line1: "Technology",
    heading_line2: "Made Simple.",
    subheading:
      "Tech Supports & Solutions helps businesses solve IT challenges, improve security, build scalable software and deliver reliable technical support through modern technology.",
    primary_btn_text: "Start Project",
    secondary_btn_text: "Explore Services",
    stat1_value: "100+",
    stat1_label: "Projects",
    stat2_value: "24/7",
    stat2_label: "Support",
    stat3_value: "100%",
    stat3_label: "Satisfaction",
  });

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#08101D] pt-24 text-white"
    >
      {/* Background Glow */}

      <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[170px]" />

      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[180px]" />

      <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-pink-500/20 blur-[170px]" />

      {/* Grid */}

      <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:70px_70px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2">
        {/* LEFT */}

        <div data-aos="fade-right" className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-wide text-purple-300 backdrop-blur-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
            {content.badge_text}
          </span>

          <h1 className="mt-8 text-5xl font-extrabold leading-tight sm:text-6xl lg:text-5xl">
            {content.heading_line1}
            <span className="block gradient-text">{content.heading_line2}</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-gray-400 lg:mx-0">
            {content.subheading}
          </p>

          {/* Buttons */}

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button href="#contact" variant="primary" size="lg" icon={<ArrowRight size={18} />}>
              {content.primary_btn_text}
            </Button>

            <Button
              href="#services"
              variant="secondary"
              size="lg"
              icon={<Play size={18} />}
              iconPosition="left"
            >
              {content.secondary_btn_text}
            </Button>
          </div>

          {/* Stats */}

          {/* <div className="mt-16 grid grid-cols-3 gap-8 text-center lg:text-left">
            <div>
              <h3 className="text-4xl font-bold gradient-text">{content.stat1_value}</h3>

              <p className="mt-2 text-gray-400">{content.stat1_label}</p>
            </div>

            <div>
              <h3 className="text-4xl font-bold gradient-text">{content.stat2_value}</h3>

              <p className="mt-2 text-gray-400">{content.stat2_label}</p>
            </div>

            <div>
              <h3 className="text-4xl font-bold gradient-text">{content.stat3_value}</h3>

              <p className="mt-2 text-gray-400">{content.stat3_label}</p>
            </div>
          </div> */}
        </div>

        {/* RIGHT */}

        <div
          data-aos="zoom-in"
          className="relative flex items-center justify-center"
        >
          <div className="absolute h-[420px] w-[420px] rounded-full bg-gradient-to-r from-purple-600/30 to-pink-500/30 blur-[120px]" />

          <img
            src={logo}
            alt="Tech Supports & Solutions"
            className="relative z-10 w-[280px] animate-float drop-shadow-[0_25px_80px_rgba(168,85,247,.55)] transition duration-500 hover:scale-105 sm:w-[360px] lg:w-[480px]"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;