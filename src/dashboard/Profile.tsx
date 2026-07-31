import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Save, X, Camera } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";
import Button from "../components/ui/Button";
import { useTheme } from "../context/ThemeContext.types";
import AdminPageHeader from "./components/AdminPageHeader";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";

export default function Profile() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState(user?.user_metadata?.avatar_url || "");

  async function uploadAvatar() {
    if (!image || !user) {
      return null;
    }

    const fileExt = image.name.split(".").pop();
    const filePath = `${user.id}.${fileExt}`;

    const { error } = await supabase.storage.from("avatars").upload(filePath, image, {
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      console.log("UPLOAD ERROR:", error);
      throw error;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function updateProfile() {
    try {
      setLoading(true);
      const loadingToast = toast.loading("Saving profile...");

      let avatarUrl = user?.user_metadata?.avatar_url;

      if (image) {
        avatarUrl = await uploadAvatar();

        if (avatarUrl) {
          setPreview(avatarUrl);
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          avatar_url: avatarUrl,
        },
      });

      if (error) {
        toast.dismiss(loadingToast);
        toast.error(error.message);
        return;
      }

      await refreshUser();
      toast.dismiss(loadingToast);
      toast.success("Profile updated successfully");
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error("PROFILE UPDATE ERROR:", err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <AdminPageHeader title="My Profile" subtitle="Update your name and profile picture." />

      <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 dark:border-white/10 dark:bg-white/5 md:p-8">
        <div className="mb-8 flex items-center gap-5">
          <div className="relative">
            <img
              src={preview || "https://ui-avatars.com/api/?name=User"}
              className="h-24 w-24 rounded-full object-cover border border-purple-500/40"
            />

            <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-purple-600 text-white">
              <Camera size={16} />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (!file) return;

                  if (file.size > 2 * 1024 * 1024) {
                    toast.error("Image must be less than 2MB");
                    return;
                  }

                  setImage(file);
                  setPreview(URL.createObjectURL(file));
                }}
              />
            </label>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{user?.user_metadata?.full_name || "User"}</h2>
            <p className="text-slate-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-5">
          <FormField label="Full Name">
            <div className="relative">
              <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClass(isDarkTheme)} pl-10`}
              />
            </div>
          </FormField>

          <FormField label="Email">
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-400" />
              <input disabled value={user?.email || ""} className={`${inputClass(isDarkTheme)} pl-10 disabled:cursor-not-allowed disabled:opacity-60`} />
            </div>
          </FormField>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              onClick={() => void updateProfile()}
              loading={loading}
              loadingText="Saving..."
              icon={<Save size={20} />}
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
