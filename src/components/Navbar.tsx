import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight, LogOut, UserCircle } from "lucide-react";
import logo from "../assets/logo.png";
import { useAuth } from "../hooks/useAuth";

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

  const links = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Process", href: "/process" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  async function handleLogout() {
    await signOut();
    setMenuOpen(false);
    navigate("/");
  }

  return (
    <header
      className={`fixed top-0 left-0 z-50 w-full transition-all duration-500 ${
        scroll
          ? "border-b border-white/10 bg-[#08101D]/80 backdrop-blur-2xl shadow-lg shadow-purple-500/5"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        <a href="#home"
          className="flex shrink-0 items-center gap-4"
        >
          <img
            src={logo}
            alt="Tech Supports & Solutions"
            className="h-14 w-auto object-contain transition duration-300 hover:scale-105"
          />

          <div>
            <h2 className="text-lg font-bold text-white">
              Tech Supports
            </h2>

            <p className="text-xs tracking-[5px] text-purple-300">
              SOLUTIONS
            </p>
          </div>
        </a>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-10">
          {links.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="relative text-sm font-medium text-gray-300 transition duration-300 hover:text-purple-400 after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-purple-500 after:to-pink-500 after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.name}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                to="/account"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-lg transition duration-300 hover:border-purple-400/60 hover:bg-purple-500/10"
              >
                <UserCircle size={18} />
                My Account
              </Link>

              <button
                type="button"
                onClick={() => void handleLogout()}
                title="Logout"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 p-2.5 text-gray-300 backdrop-blur-lg transition duration-300 hover:border-rose-400/60 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-lg transition duration-300 hover:border-purple-400/60 hover:bg-purple-500/10"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="primary-btn"
              >
                Register
                <ArrowRight size={18} />
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 text-white transition hover:border-purple-500 lg:hidden"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      </div>

      <div
        className={`overflow-hidden border-t border-white/10 bg-[#08101D]/95 backdrop-blur-xl transition-all duration-500 lg:hidden ${
          menuOpen ? "max-h-[600px]" : "max-h-0 border-none"
        }`}
      >
        <nav className="flex flex-col py-4">
          {links.map((item) => (
            <a
              key={item.name}
            
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="px-6 py-4 text-gray-300 transition hover:bg-purple-500/10 hover:text-purple-400"
            >
              {item.name}
            </a>
          ))}

          <div className="flex flex-col gap-3 px-6 pt-4">
            {user ? (
              <>
                <Link
                  to="/account"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                >
                  <UserCircle size={18} />
                  My Account
                </Link>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-rose-300"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="primary-btn w-full justify-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

    </header>
  );
}

export default Navbar;