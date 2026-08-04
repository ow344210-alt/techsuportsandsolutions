import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Camera,
  LogOut,
  Mail,
  MessageSquareText,
  Save,
  User,
} from "lucide-react";

import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext.types";
import { showConfirm } from "../lib/confirm";
import { resetHistoryAndNavigate } from "../lib/resetHistory";
import { supabase } from "../supabase/client";
import { fetchMyMessages } from "../lib/contactMessages";
import type { ContactMessage } from "../lib/contactMessages";
import SEO from "./seo/SEO";

export default function Account() {
  const { user, role, refreshUser, signOut } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDarkTheme = theme === "dark";

  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState(user?.user_metadata?.avatar_url || "");
  const previewBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current);
    };
  }, []);
  const [savingProfile, setSavingProfile] = useState(false);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    (async () => {
      setMessagesLoading(true);
      try {
        const data = await fetchMyMessages(user.id);
        if (mounted) setMessages(data);
      } catch {
        if (mounted) toast.error("Unable to load your messages.");
      } finally {
        if (mounted) setMessagesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

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
      throw error;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function handleSaveProfile() {
    setSavingProfile(true);

    try {
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
         toast.error(error.message);
         return;
       }

       await refreshUser();
       toast.success("Profile updated successfully.");
     } catch (error) {
       const message = error instanceof Error ? error.message : "Something went wrong.";
       toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogout() {
    const result = await showConfirm({
      title: "Sign out?",
      text: "You will be returned to the sign in page.",
      confirmButtonText: "Sign out",
      cancelButtonText: "Cancel",
      variant: "danger",
    });

    if (!result.isConfirmed) return;

    try {
      await signOut();
      resetHistoryAndNavigate(navigate, "/login");
    } catch {
      toast.error("Unable to sign out. Please try again.");
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkTheme ? "bg-[#08101D] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      <SEO title="My Account" noIndex />
      <div className="mx-auto max-w-5xl px-6 py-16">

        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Account</h1>
            <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
              Manage your profile and see the messages you've sent us.
              {role === "admin" && (
                <span className="ml-2 rounded-lg bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-400">
                  Admin
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {role === "admin" && (
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Go to Admin Dashboard
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/25"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div
          className={`rounded-3xl border p-8 ${
            isDarkTheme ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-8 flex items-center gap-5">
            <div className="relative">
              <img
                src={preview || "https://ui-avatars.com/api/?name=User"}
                className="h-24 w-24 rounded-full border border-purple-500/40 object-cover"
              />

              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-purple-600 text-white">
                <Camera size={16} />
                <input
                  type="file"
                  id="avatar-upload"
                  name="avatar"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                     if (file.size > 2 * 1024 * 1024) {
                       toast.error("Image must be less than 2MB.");
                       return;
                     }

                    setImage(file);
                    if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current);
                    const blobUrl = URL.createObjectURL(file);
                    previewBlobUrlRef.current = blobUrl;
                    setPreview(blobUrl);
                  }}
                />
              </label>
            </div>

            <div>
              <h2 className="text-xl font-semibold">{user?.user_metadata?.full_name || "User"}</h2>
              <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>{user?.email}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className={`mb-2 block text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Full Name
              </label>
              <div
                className={`flex h-14 items-center rounded-2xl border px-4 ${
                  isDarkTheme ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-slate-50"
                }`}
              >
                <User size={20} className={`mr-3 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`} />
                <input
                  id="account-name"
                  name="account-name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className={`mb-2 block text-sm ${isDarkTheme ? "text-slate-300" : "text-slate-700"}`}>
                Email
              </label>
              <div
                className={`flex h-14 items-center rounded-2xl border px-4 ${
                  isDarkTheme ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-slate-50"
                }`}
              >
                <Mail size={20} className={`mr-3 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`} />
                <input
                  id="account-email"
                  name="account-email"
                  disabled
                  value={user?.email || ""}
                  className={`w-full bg-transparent outline-none ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}
                />
              </div>
            </div>

            <button
              onClick={() => void handleSaveProfile()}
              disabled={savingProfile}
              className="inline-flex h-14 items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 px-8 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              <Save size={20} />
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Messages History */}
        <div
          className={`mt-8 rounded-3xl border p-8 ${
            isDarkTheme ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
          }`}
        >
          <div className="mb-6 flex items-center gap-3">
            <MessageSquareText size={22} className="text-purple-400" />
            <h2 className="text-xl font-semibold">Your Messages</h2>
          </div>

          {messagesLoading ? (
            <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>Loading...</p>
          ) : messages.length === 0 ? (
            <p className={isDarkTheme ? "text-slate-400" : "text-slate-500"}>
              You haven't sent us any messages yet. Use the contact form and it will show up here.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-2xl border p-5 ${
                    isDarkTheme ? "border-white/10 bg-[#111827]" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{msg.subject}</h3>
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                        msg.status === "Read"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                    {msg.message}
                  </p>
                  <p className={`mt-3 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Future CRM Placeholder */}
        <div
          className={`mt-8 rounded-3xl border border-dashed p-8 text-center ${
            isDarkTheme ? "border-white/10 text-slate-400" : "border-slate-300 text-slate-500"
          }`}
        >
          <Briefcase size={28} className="mx-auto mb-3 text-purple-400" />
          <h2 className="text-lg font-semibold">Your Projects</h2>
          <p className="mt-1 text-sm">
            Once we start working together, your active projects and their status will appear here.
          </p>
        </div>

      </div>
    </div>
  );
}
