import Navbar from "./Navbar";
import HeroSlider from "./HeroSlider";
import Marquee from "./Marquee";
import StatsBar from "./StatsBar";
import Services from "./Services";
import ProcessPreview from "./ProcessPreview";
import TechStack from "./TechStack";
import Industries from "./Industries";
import WhyChooseUs from "./WhyChooseUs";
import AboutPreview from "./AboutPreview";
import TestimonialsSection from "./TestimonialsSection";
import CTABanner from "./CTABanner";
import Footer from "./Footer";
import SEO from "./seo/SEO";

export default function Home() {
  return (
    <div className="home-page">
      <SEO
        description="Tech Supports & Solutions is a full-service software house — custom web development, mobile apps, cloud infrastructure, IT consulting, and ongoing support."
        canonicalPath="/"
      />
      <Navbar />
      <HeroSlider />
      <Marquee />
      <StatsBar />
      <Services standalone={false} />
      <WhyChooseUs />
      <AboutPreview />
      <ProcessPreview />
      <Industries />
      <TechStack />
      <TestimonialsSection />
      <CTABanner />
      <Footer />
    </div>
  );
}