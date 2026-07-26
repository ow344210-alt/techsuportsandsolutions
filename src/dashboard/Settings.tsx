import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Lock,
  Save,
  X,
} from "lucide-react";

import { supabase } from "../supabase/client";

export default function Settings() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handlePasswordUpdate() {
    if (!password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const loadingToast = toast.loading("Updating password...");

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message);
      return;
    }

    toast.dismiss(loadingToast);
    toast.success("Password updated successfully");

    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 dark:border-white/10 dark:bg-white/5">
        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Change Password</h2>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-slate-700 dark:text-gray-300">New Password</label>
            <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-white/10 dark:bg-[#111827]">
              <Lock size={20} className="mr-3 text-slate-500 dark:text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-700 dark:text-gray-300">Confirm Password</label>
            <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-white/10 dark:bg-[#111827]">
              <Lock size={20} className="mr-3 text-slate-500 dark:text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handlePasswordUpdate} className="h-14 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center gap-2 font-semibold text-white hover:opacity-90 transition">
              <Save size={20} />
              Save Changes
            </button>

            <button onClick={() => navigate("/dashboard")} className="h-14 px-8 rounded-2xl border border-slate-200 bg-slate-100 flex items-center gap-2 text-slate-700 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
              <X size={20} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
