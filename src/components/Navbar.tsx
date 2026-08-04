import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, LogOut, UserCircle } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/nav.webp";
import { useAuth } from "../hooks/useAuth";
import { showConfirm } from "../lib/confirm";
import Button from "./ui/Button";
import { NAV_LINKS } from "../config/nav.config";

function linkClasses(isActive: boolean) {
  return `relative text-sm font-medium transition duration-300 after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transition-all after:duration-300 hover:after:w-full ${
    isActive ? "text-white after:w-full" : "text-gray-300 hover:text-purple-400"
  }`;
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scroll, setScroll] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScroll(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLogout() {
    const result = await showConfirm({
      title: "Sign out?",
      text: "You will be returned to the home page.",
      confirmButtonText: "Sign out",
      cancelButtonText: "Cancel",
      variant: "danger",
    });

    if (!result.isConfirmed) return;

    try {
      await signOut();
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
        scroll
          ? "border-b border-white/10 bg-[#07101D]/80 backdrop-blur-2xl shadow-lg shadow-purple-500/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <NavLink
          to="/"
          aria-label="Tech Supports & Solutions home"
          className="flex shrink-0 items-center gap-4"
        >
          <img
            src={logo}
            alt="Tech Supports & Solutions"
            className="h-14 w-auto object-contain transition duration-300 hover:scale-105"
          />

          <div className="hidden sm:block">
            <h2 className="text-lg font-bold text-white">Tech Supports</h2>
            <p className="text-xs tracking-[5px] text-purple-300">SOLUTIONS</p>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-6 xl:flex xl:gap-8">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => linkClasses(isActive)}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          {user ? (
            <>
              <Button
                to="/account"
                variant="secondary"
                size="sm"
                icon={<UserCircle size={18} />}
                iconPosition="left"
              >
                My Account
              </Button>

              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Logout"
                aria-label="Logout"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 p-2.5 text-gray-300 transition duration-300 hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Button to="/login" variant="secondary" size="sm">
                Login
              </Button>

              <Button to="/register" size="sm" icon={<ArrowRight size={18} />}>
                Register
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 xl:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`overflow-hidden border-t border-white/10 bg-[#07101D]/95 backdrop-blur-xl transition-all duration-500 xl:hidden ${
          menuOpen ? "max-h-[40rem]" : "max-h-0 border-none"
        }`}
      >
        <nav className="flex flex-col py-4">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-6 py-4 text-gray-300 transition hover:bg-purple-500/10 hover:text-purple-400 ${
                  isActive ? "bg-purple-500/10 text-purple-400" : ""
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

          <div className="flex flex-col gap-3 px-6 pt-4">
            {user ? (
              <>
                <Button
                  to="/account"
                  variant="secondary"
                  fullWidth
                  onClick={() => setMenuOpen(false)}
                >
                  <UserCircle size={18} />
                  My Account
                </Button>

                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => void handleLogout()}
                >
                  <LogOut size={18} />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  to="/login"
                  variant="secondary"
                  fullWidth
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Button>

                <Button
                  to="/register"
                  fullWidth
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                  <ArrowRight size={18} />
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
