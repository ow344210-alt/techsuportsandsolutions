import {
  LayoutDashboard,
  User,
  UserCircle,
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
  ImagePlus,
  MoveHorizontal,
  Contact,
} from "lucide-react";

import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { showConfirm } from "../lib/confirm";
import { resetHistoryAndNavigate } from "../lib/resetHistory";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext.types";
import logo from "../assets/logo.webp";

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

function getNavLinkClass(isActive: boolean, isDarkTheme: boolean) {
  return `
    flex
    min-w-0
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
  { to: "/dashboard/content", label: "Content", icon: FileText, end: false },
  { to: "/dashboard/services", label: "Services", icon: Layers, end: false },
  {
    to: "/dashboard/projects",
    label: "Projects",
    icon: ImagePlus,
    end: false,
  },
  {
    to: "/dashboard/industries",
    label: "Industries",
    icon: Building2,
    end: false,
  },
  { to: "/dashboard/tech-stack", label: "Tech Stack", icon: Cpu, end: false },
  {
    to: "/dashboard/hero-slider",
    label: "Hero Slider",
    icon: Images,
    end: false,
  },
  { to: "/dashboard/marquee", label: "Marquee", icon: MoveHorizontal, end: false },
  { to: "/dashboard/cards", label: "Cards", icon: LayoutGrid, end: false },
  { to: "/dashboard/faqs", label: "FAQs", icon: HelpCircle, end: false },
  {
    to: "/dashboard/footer-links",
    label: "Footer Links",
    icon: Link2,
    end: false,
  },
  {
    to: "/dashboard/contact-settings",
    label: "Contact Settings",
    icon: Contact,
    end: false,
  },
  { to: "/dashboard/users", label: "Users", icon: User, end: false },
  { to: "/dashboard/support", label: "Support", icon: LifeBuoy, end: false },
  { to: "/dashboard/profile", label: "Profile", icon: UserCircle, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, end: false },
];

export default function Sidebar({
  isMobileOpen = false,
  onClose,
}: SidebarProps) {
  const { theme } = useTheme();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isDarkTheme = theme === "dark";
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const mobileDrawerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMobileOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const focusableElements = mobileDrawerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstFocusable = focusableElements?.[0];
    const lastFocusable = focusableElements?.[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    firstFocusable?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", handleTabKey);
      previousActiveElement.current?.focus();
    };
  }, [isMobileOpen, onClose]);

  async function logout() {
    const result = await showConfirm({
      title: "Sign out?",
      text: "You will be returned to the sign in page.",
      confirmButtonText: "Sign out",
      cancelButtonText: "Cancel",
      variant: "danger",
    });

    if (!result.isConfirmed) return;

    try {
      await signOut();
      onClose?.();
      resetHistoryAndNavigate(navigate, "/login");
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }

  return (
    <>
      <aside
        className={`hidden h-full w-72 shrink-0 flex-col overflow-hidden border-r p-6 shadow-sm transition-colors duration-300 lg:flex ${
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

        <nav className="mt-10 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
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
                <span className="min-w-0 truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto shrink-0 pt-6">
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
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile menu">
          <button
            type="button"
            aria-label="Close mobile menu"
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          />

          <aside
            ref={mobileDrawerRef}
            className={`relative flex h-full w-72 flex-col overflow-hidden border-r p-6 shadow-2xl transition-transform duration-300 translate-x-0 ${
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
                className={`rounded-xl border p-2 transition ${
                  isDarkTheme
                    ? "border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
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
                    <span className="min-w-0 truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto shrink-0 pt-6">
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