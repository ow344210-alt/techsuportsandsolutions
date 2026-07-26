import { Award, Users, Globe, TrendingUp, ArrowRight } from "lucide-react";
import { useSiteContent } from "../hooks/useSiteContent";
import Section from "./ui/Section";
import GlowBackground from "./ui/GlowBackground";
import Button from "./ui/Button";
import DynamicPageSections from "./DynamicPageSections";
import MissionVision from "./MissionVision";
import Timeline from "./Timeline";
import CoreValues from "./CoreValues";
import TextBlock from "./TextBlock";

const achievementIcons = [Award, Users, Globe, TrendingUp];

function About() {
  const { content } = useSiteContent("about", {
    badge_text: "ABOUT US",
    heading_line1: "We Started With a",
    heading_line2: "Toolbox, Not a Pitch Deck",
    paragraph1: "We started as a two-person IT support desk fixing broken networks for small offices in Karachi. Businesses kept asking for more — a website that actually converted, an inventory system that didn't live in three different spreadsheets, an app their customers would use twice.",
    paragraph2: "We built those things, and the support side never went away. Today we're a full-service software house: the same team that writes your code also answers the phone when something breaks.",
    primary_btn_text: "Start a Conversation",
    secondary_btn_text: "Explore Services",
  });

  const { content: achievements } = useSiteContent("achievements", {
    stat1_value: "120+",
    stat1_label: "Projects Delivered",
    stat2_value: "40+",
    stat2_label: "Active Support Clients",
    stat3_value: "4 Regions",
    stat3_label: "Regions Served",
    stat4_value: "97%",
    stat4_label: "Client Retention",
  });

  const achievementItems = [1, 2, 3, 4].map((n) => ({
    icon: achievementIcons[n - 1],
    value: achievements[`stat${n}_value`],
    label: achievements[`stat${n}_label`],
  }));

  return (
    <>
      <Section id="about" className="bg-[#08101D] text-white" decoration={<GlowBackground />}>
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <div data-aos="fade-right">
            <span className="inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm tracking-[3px] text-purple-300">
              {content.badge_text}
            </span>

            <h2 className="mt-8 text-4xl font-bold leading-tight md:text-5xl">
              {content.heading_line1}
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                {content.heading_line2}
              </span>
            </h2>

            <p className="mt-8 text-lg leading-8 text-gray-400">{content.paragraph1}</p>
            <p className="mt-6 leading-8 text-gray-400">{content.paragraph2}</p>

            <div className="mt-10 flex flex-wrap gap-5">
              <Button href="#contact" variant="primary" size="md">
                {content.primary_btn_text}
              </Button>
              <Button
                to="/services"
                variant="ghost"
                size="md"
                icon={<ArrowRight size={18} />}
                className="!px-0 !py-0 hover:gap-3"
              >
                {content.secondary_btn_text}
              </Button>
            </div>
          </div>

          {/* Achievements — quick-glance stats instead of repeating Core Values here */}
          <div className="grid items-stretch gap-6 sm:grid-cols-2" data-aos="fade-left">
            {achievementItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="glass-card flex h-full flex-col p-7">
                  <div className="icon-box mb-6">
                    <Icon size={30} />
                  </div>
                  <p className="text-3xl font-bold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-gray-400">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <CoreValues />
      <TextBlock section="why-started" />
      <TextBlock section="leadership" />
      <MissionVision />
      <Timeline />
      <TextBlock section="company-culture" />
      <TextBlock section="future-goals" />
      <TextBlock section="why-clients-trust" />
      <DynamicPageSections page="about" />
    </>
  );
}

export default About;