import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Save, X } from "lucide-react";
import toast from "react-hot-toast";

import { supabase } from "../supabase/client";
import Button from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext.types";
import AdminPageHeader from "./components/AdminPageHeader";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";

export default function Settings() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePasswordUpdate() {
    if (saving) return;

    if (!password || !confirmPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message || "Unable to update your password.");
      return;
    }

    toast.success("Password updated successfully.");
    setPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      navigate("/dashboard");
    }, 2000);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader title="Settings" subtitle="Manage your account password." />

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-white/10 dark:bg-white/5 md:p-8">
        <h2 className="mb-6 text-xl font-semibold text-slate-900 dark:text-white">Change Password</h2>

        <div className="space-y-5">
          <FormField label="New Password">
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className={`${inputClass(isDarkTheme)} pl-10`}
              />
            </div>
          </FormField>

          <FormField label="Confirm Password">
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className={`${inputClass(isDarkTheme)} pl-10`}
              />
            </div>
          </FormField>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              onClick={() => void handlePasswordUpdate()}
              icon={<Save size={20} />}
              loading={saving}
              loadingText="Saving..."
            >
              Save Changes
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/dashboard")}
              icon={<X size={20} />}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
