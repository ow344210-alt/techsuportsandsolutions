import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu, Moon, Sun, UserCircle } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext.types";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/messages": "Messages",
  "/dashboard/services": "Services",
  "/dashboard/users": "Users",
  "/dashboard/content": "Content",
  "/dashboard/cards": "Cards",
  "/dashboard/faqs": "FAQs",
  "/dashboard/tech-stack": "Tech Stack",
  "/dashboard/industries": "Industries",
  "/dashboard/footer-links": "Footer Links",
  "/dashboard/hero-slider": "Hero Slider",
  "/dashboard/support": "Support",
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Settings",
};

export default function DashboardLayout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDarkTheme = theme === "dark";
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Dashboard";

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        isDarkTheme ? "bg-[#08101D] text-white" : "bg-slate-100 text-slate-900"
      }`}
    >
      <Sidebar isMobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="flex flex-1 flex-col">
        <header
          className={`h-20 border-b px-4 backdrop-blur-sm transition-colors duration-300 sm:px-6 lg:px-10 ${
            isDarkTheme
              ? "border-white/10 bg-[#08101D]/90 text-white"
              : "border-slate-200 bg-white/85 text-slate-900"
          }`}
        >
          <div className="flex h-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className={`shrink-0 rounded-xl border p-2 transition lg:hidden ${
                isDarkTheme
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold tracking-tight sm:text-lg">{pageTitle}</h2>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  isDarkTheme
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200"
                }`}
                aria-label="Toggle theme"
              >
                {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
                <span className="hidden sm:inline">{isDarkTheme ? "Light" : "Dark"}</span>
              </button>

              <div
                className={`flex items-center gap-3 rounded-xl border px-2 py-2 sm:px-3 ${
                  isDarkTheme
                    ? "border-white/10 bg-white/5"
                    : "border-slate-200 bg-white"
                }`}
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover border border-purple-500/40"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600/30">
                    <UserCircle size={28} />
                  </div>
                )}

                <div className="hidden text-left sm:block">
                  <p className={`text-sm font-semibold ${isDarkTheme ? "text-white" : "text-slate-900"}`}>
                    {user?.user_metadata?.full_name || "User"}
                  </p>
                  <p className={`text-xs ${isDarkTheme ? "text-gray-400" : "text-slate-500"}`}>
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className={`mx-auto w-full max-w-7xl flex-1 p-6 transition-colors duration-300 lg:p-10 ${isDarkTheme ? "bg-[#08101D]" : "bg-slate-100"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
