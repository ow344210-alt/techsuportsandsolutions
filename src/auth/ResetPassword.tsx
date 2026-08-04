import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Eye, EyeOff, KeyRound, AlertTriangle } from "lucide-react";

import { supabase } from "../supabase/client";
import { normalizeErrorMessage } from "../lib/utils";
import Button from "../components/ui/Button";
import SEO from "../components/seo/SEO";
import toast from "react-hot-toast";

type RecoveryStatus = "checking" | "ready" | "invalid";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<RecoveryStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let disposed = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (disposed) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setStatus("ready");
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (disposed) return;
      if (session) {
        setStatus("ready");
        return;
      }
      // No session (e.g. expired or invalid recovery link). Give supabase a
      // short window to process a recovery hash, then surface a safe error.
      window.setTimeout(() => {
        if (!disposed) {
          setStatus((current) => (current === "checking" ? "invalid" : current));
        }
      }, 3500);
    });

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      toast.error("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const toastId = toast.loading("Updating your password...");

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.dismiss(toastId);
        toast.error(normalizeErrorMessage(error));
        return;
      }

      toast.dismiss(toastId);
      toast.success("Password updated successfully.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(normalizeErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080D1A] px-5 py-12 text-white">
      <SEO title="Reset Password" noIndex />
      <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[150px]" />
      <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-pink-500/20 blur-[150px]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 px-8 py-10 shadow-2xl backdrop-blur-xl">
        <div className="mb-10 text-center">
          <span className="inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-5 py-2 text-xs tracking-[4px] text-purple-300">
            RESET PASSWORD
          </span>

          <h1 className="mt-7 text-4xl font-bold tracking-tight">
            Set a New Password
          </h1>

          <p className="mt-3 text-sm text-gray-400">
            Choose a strong password for your account.
          </p>
        </div>

        {status === "checking" ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <KeyRound size={36} className="animate-pulse text-purple-400" />
            <p className="text-sm text-gray-400">Verifying your recovery link...</p>
          </div>
        ) : status === "invalid" ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10">
              <AlertTriangle size={30} className="text-amber-400" />
            </div>

            <h2 className="text-xl font-bold">Link Invalid or Expired</h2>

            <p className="max-w-sm text-sm text-gray-400">
              This password reset link is invalid or has expired. Request a new
              link to reset your password.
            </p>

            <Button to="/forgot-password" size="md" className="mt-2">
              Request New Link
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new-password" className="mb-2.5 block text-sm font-medium text-gray-200">
                New Password
              </label>

              <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-[#111827] px-4 transition focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/20">
                <Lock size={20} className="mr-3 shrink-0 text-gray-400" />

                <input
                  id="new-password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="ml-3 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2.5 block text-sm font-medium text-gray-200">
                Confirm Password
              </label>

              <div className="flex h-14 items-center rounded-2xl border border-white/10 bg-[#111827] px-4 transition focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/20">
                <Lock size={20} className="mr-3 shrink-0 text-gray-400" />

                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                />
              </div>
            </div>

            <Button type="submit" fullWidth size="md" loading={loading} loadingText="Updating...">
              Update Password
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}
