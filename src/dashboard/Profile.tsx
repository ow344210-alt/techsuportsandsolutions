import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Save, Loader2, X, Camera } from "lucide-react";

import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";

export default function Profile() {
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
    } catch (err: any) {
      console.error("PROFILE UPDATE ERROR:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Profile</h1>

      <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 dark:border-white/10 dark:bg-white/5">
        <div className="mb-8 flex items-center gap-5">
          <div className="relative">
            <img
              src={preview || "https://ui-avatars.com/api/?name=User"}
              className="h-24 w-24 rounded-full object-cover border border-purple-500/40"
            />

            <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-purple-600 flex cursor-pointer items-center justify-center text-white">
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
          <div>
            <label className="mb-2 block text-sm text-slate-700 dark:text-gray-300">Full Name</label>
            <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-white/10 dark:bg-[#111827]">
              <User size={20} className="mr-3 text-slate-500 dark:text-gray-400" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-700 dark:text-gray-300">Email</label>
            <div className="flex h-14 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 dark:border-white/10 dark:bg-[#111827]">
              <Mail size={20} className="mr-3 text-slate-500 dark:text-gray-400" />
              <input disabled value={user?.email || ""} className="w-full bg-transparent outline-none text-slate-500 dark:text-gray-400" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={updateProfile} disabled={loading} className="h-14 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center gap-2 font-semibold text-white hover:opacity-90 transition disabled:opacity-60">
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {loading ? "Saving..." : "Save Changes"}
            </button>

            <button type="button" onClick={() => navigate("/dashboard")} className="h-14 px-8 rounded-2xl border border-slate-200 bg-slate-100 flex items-center gap-2 text-slate-700 transition hover:bg-slate-200 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white">
              <X size={20} />
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
