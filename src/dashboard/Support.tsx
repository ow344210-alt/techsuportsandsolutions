import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Mail, MessageCircleQuestion, Send } from "lucide-react";
import { useTheme } from "../context/ThemeContext.types";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import AdminPageHeader from "./components/AdminPageHeader";
import { FormField } from "./components/FormField";
import { inputClass } from "./components/FormField.utils";
import {
  fetchMySupportRequests,
  submitSupportRequest,
} from "../lib/supportRequests";
import type { SupportRequest } from "../lib/supportRequests";
import toast from "react-hot-toast";

const FAQ_ITEMS = [
  {
    question: "How do I reset my password?",
    answer: "Go to Settings from the sidebar, then use the Change Password option to set a new password.",
  },
  {
    question: "How do I add a new service to the website?",
    answer: "Open Services from the sidebar and click Add Service. Fill in the details and save.",
  },
  {
    question: "How do I edit the text on the homepage?",
    answer: "Open Content from the sidebar. Each section (Hero, About, Process, etc.) can be edited there.",
  },
  {
    question: "Why am I not receiving new messages in real time?",
    answer: "Make sure Realtime is enabled for the relevant table in your Supabase project settings.",
  },
];

const initialForm = {
  subject: "",
  message: "",
};

export default function Support() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      if (!user?.id) {
        setLoadingRequests(false);
        return;
      }

      try {
        const data = await fetchMySupportRequests(user.id);
        setRequests(data);
      } catch {
        // Silently ignore; not critical to page function
      } finally {
        setLoadingRequests(false);
      }
    }

    void loadRequests();
  }, [user?.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    if (!form.subject.trim() || !form.message.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const created = await submitSupportRequest(
        {
          full_name: user?.user_metadata?.full_name || "User",
          email: user?.email || "",
          subject: form.subject,
          message: form.message,
        },
        user?.id,
      );

      setRequests((current) => [created, ...current]);
      setForm(initialForm);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusBadgeClass: Record<string, string> = {
    Open: isDarkTheme ? "bg-sky-500/15 text-sky-300" : "bg-sky-100 text-sky-700",
    "In Progress": isDarkTheme ? "bg-amber-500/15 text-amber-300" : "bg-amber-100 text-amber-700",
    Resolved: isDarkTheme ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support"
        subtitle="Find answers or send us a message and we'll get back to you."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* FAQ */}
        <div
          className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${
            isDarkTheme ? "border-white/10 bg-slate-900/70 text-white" : "border-slate-200 bg-white text-slate-900"
          }`}
        >
          <div className="mb-5 flex items-center gap-2">
            <MessageCircleQuestion size={20} className="text-violet-500" />
            <h2 className="text-lg font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <details
                key={index}
                className={`group rounded-xl border p-4 transition-colors ${
                  isDarkTheme ? "border-white/10 bg-slate-950/40" : "border-slate-200 bg-slate-50"
                }`}
              >
                <summary className="cursor-pointer list-none font-semibold">
                  {item.question}
                </summary>
                <p className={`mt-3 text-sm leading-6 ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>

          <div
            className={`mt-6 flex items-center gap-3 rounded-xl border p-4 text-sm ${
              isDarkTheme ? "border-white/10 bg-slate-950/40 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"
            }`}
          >
            <Mail size={18} className="shrink-0 text-violet-500" />
            Still need help? Email us directly at{" "}
            <a href="mailto:techsupportsandsolutions@gmail.com" className="font-semibold text-violet-500 hover:underline">
              techsupportsandsolutions@gmail.com
            </a>
          </div>
        </div>

        {/* Submit request + history */}
        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${
              isDarkTheme ? "border-white/10 bg-slate-900/70 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <h2 className="mb-4 text-lg font-bold">Submit a Request</h2>

            <FormField label="Subject">
              <input
                type="text"
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                placeholder="What do you need help with?"
                className={inputClass(isDarkTheme)}
              />
            </FormField>

            <FormField label="Message">
              <textarea
                rows={4}
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder="Describe the issue or question in detail"
                className={inputClass(isDarkTheme)}
              />
            </FormField>

            <div className="mt-5">
              <Button
                type="submit"
                fullWidth
                loading={submitting}
                loadingText="Sending..."
                icon={<Send size={16} />}
              >
                Send Request
              </Button>
            </div>
          </form>

          <div
            className={`rounded-2xl border p-6 shadow-sm transition-colors duration-300 ${
              isDarkTheme ? "border-white/10 bg-slate-900/70 text-white" : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <h2 className="mb-4 text-lg font-bold">Your Requests</h2>

            {loadingRequests ? (
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading...</p>
            ) : requests.length === 0 ? (
              <p className={`text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                You haven't submitted any requests yet.
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className={`rounded-xl border p-4 ${
                      isDarkTheme ? "border-white/10 bg-slate-950/40" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{request.subject}</p>
                      <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${statusBadgeClass[request.status]}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>
                      {request.message}
                    </p>
                    <p className={`mt-2 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
