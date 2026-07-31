import Navbar from "./Navbar";
import HeroSlider from "./HeroSlider";
import StatsBar from "./StatsBar";
import Services from "./Services";
import ProcessPreview from "./ProcessPreview";
import TechStack from "./TechStack";
import Industries from "./Industries";
import WhyChooseUs from "./WhyChooseUs";
import AboutPreview from "./AboutPreview";
import TestimonialsSection from "./TestimonialsSection";
import DynamicPageSections from "./DynamicPageSections";
import Newsletter from "./Newsletter";
import FAQ from "./FAQ";
import CTABanner from "./CTABanner";
import Footer from "./Footer";
import SEO from "./seo/SEO";

export default function Home() {
  return (
    <>
      <SEO
        description="Tech Supports & Solutions is a full-service software house — custom web development, mobile apps, cloud infrastructure, IT consulting, and ongoing support."
        canonicalPath="/"
      />
      <Navbar />
      <HeroSlider />
      <StatsBar />
      <Services standalone={false} />
      <ProcessPreview />
      <TechStack />
      <Industries />
      <WhyChooseUs />
      <AboutPreview />
      <TestimonialsSection />
      <DynamicPageSections page="home" />
      <Newsletter />
      <FAQ section="faq" page="home" />
      <CTABanner />
      <Footer />
    </>
  );
}