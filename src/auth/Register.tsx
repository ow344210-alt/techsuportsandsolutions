import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import SEO from "../components/seo/SEO";

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      const loadingToast = toast.loading("Creating your account...");

      const { error } = await signUp(email, password, {
        data: {
          full_name: name,
        },
      });

      if (error) {
        toast.dismiss(loadingToast);
        toast.error(error.message);
        return;
      }

      toast.dismiss(loadingToast);
      toast.success(`Welcome, ${name}! Your account is ready.`);
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#080D1A] px-5 py-12 text-white relative overflow-hidden">
      <SEO title="Sign Up" noIndex />
      <div className="absolute top-0 left-0 h-[500px] w-[500px] bg-purple-600/20 blur-[150px] rounded-full" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-10">
        <div className="text-center mb-8">
          <span className="inline-flex px-5 py-2 rounded-full border border-purple-400/30 text-purple-300 text-xs tracking-[4px]">
            CREATE ACCOUNT
          </span>

          <h1 className="mt-6 text-4xl font-bold">Join our platform</h1>
          <p className="mt-3 text-gray-400">Create your account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-2.5 text-sm font-medium text-gray-200">Full Name</label>
            <div className="flex items-center h-14 rounded-2xl bg-[#111827] border border-white/10 px-4 focus-within:border-purple-500">
              <User size={20} className="mr-3 text-gray-400" />
              <input
                type="text"
                id="register-name"
                name="register-name"
                autoComplete="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2.5 text-sm font-medium text-gray-200">Email Address</label>
            <div className="flex items-center h-14 rounded-2xl bg-[#111827] border border-white/10 px-4 focus-within:border-purple-500">
              <Mail size={20} className="mr-3 text-gray-400" />
              <input
                type="email"
                id="register-email"
                name="register-email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2.5 text-sm font-medium text-gray-200">Password</label>
            <div className="flex items-center h-14 rounded-2xl bg-[#111827] border border-white/10 px-4 focus-within:border-purple-500">
              <Lock size={20} className="mr-3 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="register-password"
                name="register-password"
                autoComplete="new-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
              />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="ml-3 text-gray-400 hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2.5 text-sm font-medium text-gray-200">Confirm Password</label>
            <div className="flex items-center h-14 rounded-2xl bg-[#111827] border border-white/10 px-4 focus-within:border-purple-500">
              <Lock size={20} className="mr-3 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="register-confirm-password"
                name="register-confirm-password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white placeholder:text-gray-500"
              />
              <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="ml-3 text-gray-400 hover:text-white">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            loadingText="Creating Account..."
            icon={<ArrowRight size={20} />}
          >
            Register
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-purple-300 hover:text-purple-200">
            Login here
          </Link>
        </p>
      </section>
    </main>
  );
}