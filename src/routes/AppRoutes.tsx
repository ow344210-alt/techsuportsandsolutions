import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import AOS from "aos";

const Home = lazy(() => import("../components/Home"));
const Navbar = lazy(() => import("../components/Navbar"));
const Footer = lazy(() => import("../components/Footer"));
const Services = lazy(() => import("../components/Services"));
const Projects = lazy(() => import("../components/Projects"));
const Process = lazy(() => import("../components/Process"));
const About = lazy(() => import("../components/About"));
const Contact = lazy(() => import("../components/Contact"));
const NotFound = lazy(() => import("../components/NotFound"));
const Login = lazy(() => import("../auth/Login"));
const Register = lazy(() => import("../auth/Register"));
const ForgotPassword = lazy(() => import("../auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../auth/ResetPassword"));
const Account = lazy(() => import("../components/Account"));

const DashboardLayout = lazy(() => import("../dashboard/DashboardLayout"));
const Dashboard = lazy(() => import("../dashboard/Dashboard"));
const Messages = lazy(() => import("../dashboard/Messages"));
const ServicesManager = lazy(() => import("../dashboard/ServicesManager"));
const UserManagement = lazy(() => import("../dashboard/UserManagement"));
const Profile = lazy(() => import("../dashboard/Profile"));
const Settings = lazy(() => import("../dashboard/Settings"));
const ContentManager = lazy(() => import("../dashboard/ContentManager"));
const CardsManager = lazy(() => import("../dashboard/CardsManager"));
const FaqManager = lazy(() => import("../dashboard/FaqManager"));
const FooterLinksManager = lazy(
  () => import("../dashboard/FooterLinksManager"),
);
const HeroSliderManager = lazy(() => import("../dashboard/HeroSliderManager"));
const MarqueeManager = lazy(() => import("../dashboard/MarqueeManager"));
const Support = lazy(() => import("../dashboard/Support"));
const TechStackManager = lazy(() => import("../dashboard/TechStackManager"));
const IndustriesManager = lazy(() => import("../dashboard/IndustriesManager"));
const ProjectsManager = lazy(() => import("../dashboard/ProjectsManager"));

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import PageLoader from "../components/common/PageLoader";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export default function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    AOS.refreshHard();
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader mode="full" text="Loading..." />}>
      <Routes>
        {/* Public */}

        <Route path="/" element={<Home />} />

        <Route
          path="/services"
          element={
            <>
              <Navbar />
              <Services />
              <Footer />
            </>
          }
        />

        <Route
          path="/projects"
          element={
            <>
              <Navbar />
              <Projects />
              <Footer />
            </>
          }
        />

        <Route
          path="/process"
          element={
            <>
              <Navbar />
              <Process />
              <Footer />
            </>
          }
        />

        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
              <Footer />
            </>
          }
        />

        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <Contact />
              <Footer />
            </>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Customer Account (any logged-in user) */}

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Dashboard */}

        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <DashboardLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="messages" element={<Messages />} />
          <Route path="services" element={<ServicesManager />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="content" element={<ContentManager />} />
          <Route path="cards" element={<CardsManager />} />
          <Route path="faqs" element={<FaqManager />} />
          <Route path="tech-stack" element={<TechStackManager />} />
          <Route path="projects" element={<ProjectsManager />} />
          <Route path="industries" element={<IndustriesManager />} />
          <Route path="footer-links" element={<FooterLinksManager />} />
          <Route path="hero-slider" element={<HeroSliderManager />} />
          <Route path="marquee" element={<MarqueeManager />} />
          <Route path="support" element={<Support />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}

        <Route
          path="*"
          element={
            <>
              <Navbar />
              <NotFound />
              <Footer />
            </>
          }
        />
      </Routes>
      </Suspense>
    </>
  );
}
