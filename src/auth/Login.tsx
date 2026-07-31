import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";
import Button from "../components/ui/Button";
import SEO from "../components/seo/SEO";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const getSavedEmail = () => localStorage.getItem("remember-email");

  const [email, setEmail] = useState(() => getSavedEmail() ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!getSavedEmail());
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const loadingToast = toast.loading("Signing you in...");

      const { error, data } = await signIn(email, password);

      if (error) {
        toast.dismiss(loadingToast);
        toast.error(error.message);
        return;
      }

      if (rememberMe) {
        localStorage.setItem("remember-email", email);
      } else {
        localStorage.removeItem("remember-email");
      }

      toast.dismiss(loadingToast);

      if (data.session) {
        // Look up the role directly so we redirect correctly on the
        // very first login, without waiting for AuthContext to catch up.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single();

        if (profile?.role === "admin") {
          toast.success("Welcome back, Admin.");
          navigate("/dashboard");
        } else {
          toast.success("Logged in successfully.");
          navigate("/");
        }
      }
    } catch (err) {
      console.error(err);

      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080D1A] px-5 py-12 text-white">
      <SEO title="Sign In" noIndex />
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[150px]" />

      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-pink-500/20 blur-[150px]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.05] px-8 py-10 shadow-2xl backdrop-blur-xl">
        <div className="mb-10 text-center">
          <span className="inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-5 py-2 text-xs tracking-[4px] text-purple-300">
            SIGN IN
          </span>

          <h1 className="mt-7 text-4xl font-bold tracking-tight">
            Welcome Back
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Sign in to manage your account and see your messages.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="mb-2.5 block text-sm font-medium text-gray-200">
              Email Address
            </label>

            <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-[#111827] px-4 transition focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/20">
              <Mail size={20} className="mr-3 shrink-0 text-gray-400" />

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2.5 block text-sm font-medium text-gray-200">
              Password
            </label>

            <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-[#111827] px-4 transition focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/20">
              <Lock size={20} className="mr-3 shrink-0 text-gray-400" />

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-transparent text-purple-500"
              />
              Remember me
            </label>

            <Link to="/forgot-password" className="text-purple-300 hover:text-purple-200">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            loadingText="Signing In..."
            icon={<ArrowRight size={20} />}
          >
            Login
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-purple-300 hover:text-purple-200">
            Register here
          </Link>
        </p>
      </section>
    </main>
  );
}