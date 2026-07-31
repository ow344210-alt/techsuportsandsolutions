import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, Send } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import SEO from "../components/seo/SEO";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("Sending reset link...");

      const { error } = await resetPassword(email);

      if (error) {
        toast.dismiss(loadingToast);
        toast.error(error.message);
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Reset email sent");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#080D1A] px-5 py-12 text-white relative overflow-hidden">
      <SEO title="Forgot Password" noIndex />
      <div className="absolute top-0 left-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[150px]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-10 shadow-2xl">
        <div className="text-center mb-10">
          <span className="inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-5 py-2 text-xs tracking-[4px] text-purple-300">
            RESET PASSWORD
          </span>

          <h1 className="mt-7 text-4xl font-bold">Forgot Password?</h1>
          <p className="mt-3 text-gray-400 text-sm">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2.5 text-sm font-medium text-gray-200">
              Email Address
            </label>

            <div className="flex items-center h-14 rounded-2xl border border-white/10 bg-[#111827] px-4 transition focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-500/20">
              <Mail size={20} className="shrink-0 text-gray-400 mr-3" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            loadingText="Sending..."
            icon={<Send size={20} />}
          >
            Send Reset Link
          </Button>
        </form>

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
