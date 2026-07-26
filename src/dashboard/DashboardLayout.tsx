import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu, Moon, Sun, UserCircle } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";

export default function DashboardLayout() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDarkTheme = theme === "dark";

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
              className={`rounded-xl border p-2 transition lg:hidden ${
                isDarkTheme
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200"
              }`}
              aria-label="Open mobile menu"
            >
              <Menu size={20} />
            </button>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
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

        <main className={`flex-1 p-6 transition-colors duration-300 lg:p-10 ${isDarkTheme ? "bg-[#08101D]" : "bg-slate-100"}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
