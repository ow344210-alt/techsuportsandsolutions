import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  X,
  MessageSquare,
  Layers,
  LifeBuoy,
  FileText,
  LayoutGrid,
  HelpCircle,
  Link2,
  Images,
  Cpu,
  Building2,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

function getNavLinkClass(isActive: boolean, isDarkTheme: boolean) {
  return `
    flex
    items-center
    gap-3
    px-4
    py-3
    rounded-xl
    font-medium
    transition-all
    ${
      isActive
        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
        : isDarkTheme
          ? "text-slate-300 hover:bg-white/5 hover:text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    }
  `;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/dashboard/messages",
    label: "Messages",
    icon: MessageSquare,
    end: false,
  },
  { to: "/dashboard/services", label: "Services", icon: Layers, end: false },
  {
    to: "/dashboard/hero-slider",
    label: "Hero Slider",
    icon: Images,
    end: false,
  },
  { to: "/dashboard/content", label: "Content", icon: FileText, end: false },
  { to: "/dashboard/cards", label: "Cards", icon: LayoutGrid, end: false },
  { to: "/dashboard/faqs", label: "FAQs", icon: HelpCircle, end: false },
  {
    to: "/dashboard/footer-links",
    label: "Footer Links",
    icon: Link2,
    end: false,
  },
  { to: "/dashboard/users", label: "Users", icon: User, end: false },
  { to: "/dashboard/profile", label: "Profile", icon: User, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, end: false },
  { to: "/dashboard/support", label: "Support", icon: LifeBuoy, end: false },
  { to: "/dashboard/tech-stack", label: "Tech Stack", icon: Cpu, end: false },
  {
    to: "/dashboard/industries",
    label: "Industries",
    icon: Building2,
    end: false,
  },
];

export default function Sidebar({
  isMobileOpen = false,
  onClose,
}: SidebarProps) {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isDarkTheme = theme === "dark";

  async function logout() {
    await signOut();
    onClose?.();
    navigate("/login");
  }

  return (
    <>
      <aside
        className={`hidden w-72 min-h-screen shrink-0 flex-col border-r p-6 shadow-sm transition-colors duration-300 lg:flex ${
          isDarkTheme
            ? "border-white/10 bg-[#0B1220] text-white"
            : "border-slate-200 bg-white text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Company Logo"
            className="h-12 w-12 rounded-xl object-contain"
          />

          <div>
            <h1 className="text-xl font-bold leading-tight">Tech Supports</h1>
            <p
              className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}
            >
              Solutions
            </p>
          </div>
        </div>

        <nav className="mt-10 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  getNavLinkClass(isActive, isDarkTheme)
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <button
            type="button"
            onClick={logout}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isDarkTheme
                ? "text-red-400 hover:bg-red-500/10"
                : "text-red-600 hover:bg-red-500/10"
            }`}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close mobile menu"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <aside
            className={`relative flex h-full w-72 flex-col border-r p-6 shadow-2xl transition-colors duration-300 ${
              isDarkTheme
                ? "border-white/10 bg-[#0B1220] text-white"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Company Logo"
                  className="h-12 w-12 rounded-xl object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold leading-tight">
                    Tech Supports
                  </h1>
                  <p
                    className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}
                  >
                    Solutions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={`rounded-full border p-2 transition ${
                  isDarkTheme
                    ? "border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-2 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      getNavLinkClass(isActive, isDarkTheme)
                    }
                    onClick={onClose}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto pt-6">
              <button
                type="button"
                onClick={logout}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isDarkTheme
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-red-600 hover:bg-red-500/10"
                }`}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
