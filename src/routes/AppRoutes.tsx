import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import AOS from "aos";

const Home = lazy(() => import("../components/Home"));
const Navbar = lazy(() => import("../components/Navbar"));
const Footer = lazy(() => import("../components/Footer"));
const Services = lazy(() => import("../components/Services"));
const Process = lazy(() => import("../components/Process"));
const About = lazy(() => import("../components/About"));
const Contact = lazy(() => import("../components/Contact"));
const Login = lazy(() => import("../auth/Login"));
const Register = lazy(() => import("../auth/Register"));
const ForgotPassword = lazy(() => import("../auth/ForgotPassword"));
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
const Support = lazy(() => import("../dashboard/Support"));
const TechStackManager = lazy(() => import("../dashboard/TechStackManager"));
const IndustriesManager = lazy(() => import("../dashboard/IndustriesManager"));

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

export default function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    AOS.refreshHard();
  }, [location.pathname]);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-600 dark:text-slate-300">
          Loading...
        </div>
      }
    >
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
          <Route path="industries" element={<IndustriesManager />} />
          <Route path="footer-links" element={<FooterLinksManager />} />
          <Route path="hero-slider" element={<HeroSliderManager />} />
          <Route path="support" element={<Support />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* 404 */}

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </Suspense>
  );
}
