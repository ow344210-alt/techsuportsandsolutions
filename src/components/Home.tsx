import Navbar from "./Navbar";
import HeroSlider from "./HeroSlider";
import StatsBar from "./StatsBar";
import Services from "./Services";
import TechStack from "./TechStack";
import Industries from "./Industries";
import WhyChooseUs from "./WhyChooseUs";
import AboutPreview from "./AboutPreview";
import DynamicPageSections from "./DynamicPageSections";
import FAQ from "./FAQ";
import CTABanner from "./CTABanner";
import Footer from "./Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSlider />
      <StatsBar />
      <Services />
      <TechStack />
      <Industries />
      <WhyChooseUs />
      <AboutPreview />
      <DynamicPageSections page="home" />
      <FAQ section="faq" page="home" />
      <CTABanner />
      <Footer />
    </>
  );
}