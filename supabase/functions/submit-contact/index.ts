import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsPreflight,
  jsonResponse,
  resolveAllowedOrigin,
} from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 160;
const MAX_PHONE_LENGTH = 20;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_COMPANY_LENGTH = 120;
const MAX_BUDGET_LENGTH = 100;
const MAX_SERVICE_LENGTH = 100;

const RATE_LIMIT_MAX_SUBMISSIONS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_BLOCK_DURATION_MS = 60 * 60 * 1000;

const ALLOWED_SERVICES = [
  "Website Development",
  "Mobile App",
  "Marketing",
  "SEO",
  "Automation",
  "Consultation",
];

const ALLOWED_BUDGETS = [
  "Under $1,000",
  "$1,000 - $5,000",
  "$5,000 - $15,000",
  "$15,000 - $50,000",
  "$50,000+",
  "Not sure yet",
];

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + supabaseUrl);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function stripControlCharacters(input: string): string {
  const controlChars = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F\x7F";
  const escaped = controlChars.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
  return input.replace(new RegExp(`[${escaped}]`, "g"), "");
}

function normalizeText(input: string, maxLen: number): string {
  return stripControlCharacters(input).trim().slice(0, maxLen);
}

function normalizeEmail(input: string, maxLen: number): string {
  return stripControlCharacters(input).trim().toLowerCase().slice(0, maxLen);
}

function normalizePhone(input: string, maxLen: number): string {
  return stripControlCharacters(input).trim().replace(/[^\d\s+\-().]/g, "").slice(0, maxLen);
}

interface ContactFormValues {
  full_name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  budget?: string;
  subject: string;
  message: string;
  website?: string;
}

function validateInput(input: ContactFormValues): string | null {
  const honeypot = input.website?.trim();
  if (honeypot && honeypot.length > 0) {
    return "Invalid submission";
  }

  const fullName = normalizeText(input.full_name ?? "", MAX_NAME_LENGTH);
  if (!fullName) return "Full name is required";
  if (fullName.length < 2) return "Full name must be at least 2 characters";
  if (fullName.length > MAX_NAME_LENGTH) return "Full name is too long";

  const email = normalizeEmail(input.email ?? "", MAX_EMAIL_LENGTH);
  if (!email) return "Email is required";
  if (email.length > MAX_EMAIL_LENGTH) return "Email is too long";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";

  const subject = normalizeText(input.subject ?? "", MAX_SUBJECT_LENGTH);
  if (!subject) return "Subject is required";
  if (subject.length < 5) return "Subject must be at least 5 characters";
  if (subject.length > MAX_SUBJECT_LENGTH) return "Subject is too long";

  const message = normalizeText(input.message ?? "", MAX_MESSAGE_LENGTH);
  if (!message) return "Message is required";
  if (message.length < 20) return "Message must be at least 20 characters";
  if (message.length > MAX_MESSAGE_LENGTH) return "Message is too long";

  if (input.phone) {
    const phone = normalizePhone(input.phone, MAX_PHONE_LENGTH);
    if (phone && phone.length < 7) return "Phone number is invalid";
  }

  if (input.company) {
    const company = normalizeText(input.company, MAX_COMPANY_LENGTH);
    if (company.length > MAX_COMPANY_LENGTH) return "Company name is too long";
  }

  if (input.service) {
    const service = normalizeText(input.service, MAX_SERVICE_LENGTH);
    if (!ALLOWED_SERVICES.includes(service)) return "Invalid service selection";
  }

  if (input.budget) {
    const budget = normalizeText(input.budget, MAX_BUDGET_LENGTH);
    if (!ALLOWED_BUDGETS.includes(budget)) return "Invalid budget selection";
  }

  return null;
}

serve(async (req) => {
  console.log("submit-contact:start", { method: req.method });
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return corsPreflight(origin);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  if (!resolveAllowedOrigin(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, origin);
  }

  try {
    console.log("submit-contact:body-parsed");
    const body = await req.json();

    console.log("submit-contact:validated");
    const validationError = validateInput(body);
    if (validationError) {
      return jsonResponse({ error: validationError }, 400, origin);
    }

    console.log("submit-contact:client-created");
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : req.headers.get("x-real-ip") ?? "unknown";
    const ipHash = await hashIp(realIp);

    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
    const blockUntil = new Date(now.getTime() - RATE_LIMIT_BLOCK_DURATION_MS);

    const { data: rateLimitRows, error: rateLimitError } = await supabaseAdmin
      .from("contact_message_rate_limits")
      .select("id, submission_count, first_submission_at, blocked_at")
      .eq("ip_hash", ipHash)
      .order("first_submission_at", { ascending: false })
      .limit(1);

    if (rateLimitError && rateLimitError.code !== "PGRST116") {
      console.error("submit-contact:rate-limit-check-failed", {
        code: rateLimitError.code,
        message: rateLimitError.message,
        details: rateLimitError.details,
        hint: rateLimitError.hint,
      });
    }

    const rateLimitRow = rateLimitRows?.[0] ?? null;
    const currentCount = rateLimitRow?.submission_count ?? 0;
    const stillBlocked =
      !!rateLimitRow?.blocked_at && new Date(rateLimitRow.blocked_at) > blockUntil;
    const windowActive =
      !!rateLimitRow &&
      !stillBlocked &&
      new Date(rateLimitRow.first_submission_at) >= windowStart;
    const needsReset = !!rateLimitRow && !stillBlocked && !windowActive;

    if (stillBlocked) {
      return jsonResponse({ error: "Too many submissions. Please try again later." }, 429, origin);
    }

    if (windowActive && currentCount >= RATE_LIMIT_MAX_SUBMISSIONS) {
      await supabaseAdmin
        .from("contact_message_rate_limits")
        .update({ blocked_at: now.toISOString() })
        .eq("id", rateLimitRow.id);

      return jsonResponse({ error: "Too many submissions. Please try again later." }, 429, origin);
    }

    console.log("submit-contact:insert-start");
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("contact_messages")
      .insert([
        {
          full_name: normalizeText(body.full_name ?? "", MAX_NAME_LENGTH),
          email: normalizeEmail(body.email ?? "", MAX_EMAIL_LENGTH),
          phone: body.phone ? normalizePhone(body.phone, MAX_PHONE_LENGTH) : null,
          company: body.company ? normalizeText(body.company, MAX_COMPANY_LENGTH) : null,
          service: body.service ? normalizeText(body.service, MAX_SERVICE_LENGTH) : null,
          budget: body.budget ? normalizeText(body.budget, MAX_BUDGET_LENGTH) : null,
          subject: normalizeText(body.subject ?? "", MAX_SUBJECT_LENGTH),
          message: normalizeText(body.message ?? "", MAX_MESSAGE_LENGTH),
          status: "new",
          priority: "normal",
          source: "website",
          ip_hash: ipHash,
          user_agent: stripControlCharacters(
            (req.headers.get("user-agent") ?? "").slice(0, 500),
          ),
          user_id: null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("submit-contact:insert-failed", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      return jsonResponse({ error: "Failed to submit message" }, 500, origin);
    }

    console.log("submit-contact:insert-success", { id: insertData.id });

    if (rateLimitRow) {
      const updatePayload = needsReset
        ? {
            submission_count: 1,
            first_submission_at: now.toISOString(),
            last_submission_at: now.toISOString(),
            blocked_at: null,
          }
        : {
            submission_count: currentCount + 1,
            last_submission_at: now.toISOString(),
          };

      const { error: rlUpdateError } = await supabaseAdmin
        .from("contact_message_rate_limits")
        .update(updatePayload)
        .eq("id", rateLimitRow.id);

      if (rlUpdateError) {
        console.error("submit-contact:rate-limit-update-failed", {
          code: rlUpdateError.code,
          message: rlUpdateError.message,
          details: rlUpdateError.details,
          hint: rlUpdateError.hint,
        });
      }
    } else {
      const { error: rlInsertError } = await supabaseAdmin
        .from("contact_message_rate_limits")
        .insert([
          {
            ip_hash: ipHash,
            submission_count: 1,
            first_submission_at: now.toISOString(),
            last_submission_at: now.toISOString(),
          },
        ]);

      if (rlInsertError) {
        console.error("submit-contact:rate-limit-insert-failed", {
          code: rlInsertError.code,
          message: rlInsertError.message,
          details: rlInsertError.details,
          hint: rlInsertError.hint,
        });

        if (rlInsertError.code === "23505") {
          const { data: existingRows } = await supabaseAdmin
            .from("contact_message_rate_limits")
            .select("id, submission_count")
            .eq("ip_hash", ipHash)
            .is("blocked_at", null)
            .order("first_submission_at", { ascending: false })
            .limit(1);

          const existingRow = existingRows?.[0];
          if (existingRow) {
            const { error: rlFallbackError } = await supabaseAdmin
              .from("contact_message_rate_limits")
              .update({
                submission_count: (existingRow.submission_count ?? 0) + 1,
                last_submission_at: now.toISOString(),
              })
              .eq("id", existingRow.id);

            if (rlFallbackError) {
              console.error("submit-contact:rate-limit-fallback-failed", {
                code: rlFallbackError.code,
                message: rlFallbackError.message,
              });
            }
          }
        }
      }
    }

    await prepareAdminNotification(
      supabaseAdmin,
      insertData.id,
      normalizeText(body.full_name ?? "", MAX_NAME_LENGTH),
      normalizeEmail(body.email ?? "", MAX_EMAIL_LENGTH),
      normalizeText(body.subject ?? "", MAX_SUBJECT_LENGTH),
    );

    return jsonResponse({ success: true, id: insertData.id }, 200, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown internal error";
    console.error("submit-contact:unexpected-error", { message });
    return jsonResponse({ error: "Internal server error" }, 500, origin);
  }
});

async function prepareAdminNotification(
  supabaseAdmin: ReturnType<typeof createClient>,
  messageId: string,
  fullName: string,
  email: string,
  subject: string,
): Promise<void> {
  const { data: adminUsers, error: adminError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (adminError || !adminUsers || adminUsers.length === 0) return;

  const { error: notifyError } = await supabaseAdmin
    .from("contact_message_notifications")
    .insert([
      {
        contact_message_id: messageId,
        admin_user_id: adminUsers[0].id,
        type: "new_contact_message",
        title: `New contact message from ${fullName}`,
        body: subject,
        email: email,
      },
    ]);

  if (notifyError) {
    console.error("submit-contact:notification-failed", {
      code: notifyError.code,
      message: notifyError.message,
      details: notifyError.details,
      hint: notifyError.hint,
    });
  }
}