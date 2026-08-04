import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsPreflight,
  jsonResponse,
  resolveAllowedOrigin,
} from "../_shared/cors.ts";

const GMAIL_SENDER_NAME = "Tech Supports & Solutions";

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(
      `Missing required secret: ${name}. Set it with: supabase secrets set ${name}=<value>`,
    );
  }
  return value;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const googleClientId = getRequiredEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
const googleRefreshToken = getRequiredEnv("GOOGLE_REFRESH_TOKEN");
const gmailSenderEmail = getRequiredEnv("GMAIL_SENDER_EMAIL");
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Email provider failures are converted into this type so the failure path can
// log only the HTTP status plus Google's short error reason — never tokens,
// secrets, or the full email body.
class EmailSendError extends Error {
  status: number;
  reason: string;

  constructor(status: number, reason: string) {
    super(`Email send failed: HTTP ${status}, reason: ${reason}`);
    this.name = "EmailSendError";
    this.status = status;
    this.reason = reason;
  }
}

serve(async (req: Request) => {
  let claimedReplyId: string | null = null;

  try {
    const origin = req.headers.get("origin");

    if (req.method === "OPTIONS") {
      return corsPreflight(origin);
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, origin);
    }

    if (origin && !resolveAllowedOrigin(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, origin);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Missing authorization header" },
        401,
        origin,
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse(
        { error: "Invalid authentication" },
        401,
        origin,
      );
    }
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, is_disabled")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin" || profile.is_disabled) {
      return jsonResponse({ error: "Unauthorized" }, 403, origin);
    }

    const body = await req.json();
    const replyId = body?.replyId;

    if (!replyId || typeof replyId !== "string") {
      return jsonResponse(
        { error: "Missing or invalid replyId" },
        400,
        origin,
      );
    }

    const { data: reply, error: replyError } = await supabaseAdmin
      .from("contact_message_replies")
      .select("id, contact_message_id, subject, message")
      .eq("id", replyId)
      .single();

    if (replyError || !reply) {
      return jsonResponse(
        { error: "Reply record not found" },
        404,
        origin,
      );
    }

    // Atomically claim the reply so a double-clicked "Send Reply" (or a retry
    // racing a manual send) can never dispatch two duplicate emails. Only a
    // pending or failed reply can be claimed; sent replies get a 400 and
    // already-processing replies get a 409.
    const { data: claimedReply, error: claimError } = await supabaseAdmin
      .from("contact_message_replies")
      .update({ delivery_status: "processing" })
      .eq("id", replyId)
      .in("delivery_status", ["pending", "failed"])
      .select("id")
      .maybeSingle();

    if (claimError) {
      return jsonResponse(
        { error: "Failed to reserve reply for sending" },
        500,
        origin,
      );
    }

    if (!claimedReply) {
      const { data: currentReply } = await supabaseAdmin
        .from("contact_message_replies")
        .select("delivery_status")
        .eq("id", replyId)
        .maybeSingle();

      if (currentReply?.delivery_status === "sent") {
        return jsonResponse(
          { error: "Reply has already been sent" },
          400,
          origin,
        );
      }
      return jsonResponse(
        { error: "Reply is already being processed" },
        409,
        origin,
      );
    }

    claimedReplyId = replyId;

    const { data: contactMessage, error: msgError } = await supabaseAdmin
      .from("contact_messages")
      .select("id, email, subject, full_name")
      .eq("id", reply.contact_message_id)
      .single();

    if (msgError || !contactMessage) {
      await supabaseAdmin
        .from("contact_message_replies")
        .update({
          delivery_status: "failed",
          error_message: "Original contact message not found.",
        })
        .eq("id", replyId);

      return jsonResponse(
        { error: "Original contact message not found" },
        404,
        origin,
      );
    }

    const recipientEmail = contactMessage.email;
    const customerName = contactMessage.full_name ?? "Customer";

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      await supabaseAdmin
        .from("contact_message_replies")
        .update({
          delivery_status: "failed",
          error_message: "Recipient email is missing or invalid.",
        })
        .eq("id", replyId);

      return jsonResponse(
        { error: "Recipient email is missing or invalid" },
        400,
        origin,
      );
    }

    await supabaseAdmin
      .from("contact_message_replies")
      .update({ recipient_email: recipientEmail })
      .eq("id", replyId);

    const emailSubject = reply.subject;
    const emailProvider = "gmail";
    let providerMessageId: string | null = null;

    try {
      const accessToken = await getGmailAccessToken();

      const mimeEmail = buildMimeEmail({
        to: recipientEmail,
        subject: emailSubject,
        senderEmail: gmailSenderEmail,
        senderName: GMAIL_SENDER_NAME,
        plainText: buildPlainTextBody(reply.message, customerName),
        html: buildEmailBody(reply.message, customerName),
      });

      const raw = toBase64Url(new TextEncoder().encode(mimeEmail));

      const sendResponse = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ raw }),
        },
      );

      const sendData = await sendResponse.json().catch(() => null);

      if (!sendResponse.ok || typeof sendData?.id !== "string" || sendData.id === "") {
        const reason =
          typeof sendData?.error?.message === "string"
            ? sendData.error.message
            : `gmail_api_error_${sendResponse.status}`;
        throw new EmailSendError(sendResponse.status, reason);
      }

      providerMessageId = sendData.id;
    } catch (emailError) {
      const status =
        emailError instanceof EmailSendError ? emailError.status : 0;
      const reason =
        emailError instanceof EmailSendError
          ? emailError.reason
          : "unknown_email_error";

      await supabaseAdmin
        .from("contact_message_replies")
        .update({
          delivery_status: "failed",
          error_message: "Email provider rejected the message.",
          email_provider: emailProvider,
        })
        .eq("id", replyId);

      console.error("Email send failed:", { status, reason });

      return jsonResponse(
        { error: "Failed to send email" },
        500,
        origin,
      );
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("contact_message_replies")
      .update({
        delivery_status: "sent",
        email_provider: emailProvider,
        provider_message_id: providerMessageId,
        sent_at: now,
        error_message: null,
      })
      .eq("id", replyId);

    await supabaseAdmin
      .from("contact_messages")
      .update({
        status: "replied",
        replied_at: now,
      })
      .eq("id", reply.contact_message_id);

    return jsonResponse(
      { success: true, replyId, sentAt: now },
      200,
      origin,
    );
  } catch (err) {
    if (claimedReplyId) {
      await supabaseAdmin
        .from("contact_message_replies")
        .update({
          delivery_status: "failed",
          error_message: "Email sending failed unexpectedly.",
        })
        .eq("id", claimedReplyId);
    }

    console.error(
      "Edge Function error:",
      err instanceof Error ? err.message : err,
    );
    return jsonResponse(
      { error: "Internal server error" },
      500,
      origin,
    );
  }
});

async function getGmailAccessToken(): Promise<string> {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  const tokenData = await tokenResponse.json().catch(() => null);

  if (!tokenResponse.ok || typeof tokenData?.access_token !== "string") {
    const reason =
      typeof tokenData?.error === "string"
        ? tokenData.error
        : "oauth_token_exchange_failed";
    throw new EmailSendError(tokenResponse.status, reason);
  }

  return tokenData.access_token;
}

interface MimeEmailParams {
  to: string;
  subject: string;
  senderEmail: string;
  senderName: string;
  plainText: string;
  html: string;
}

function buildMimeEmail(params: MimeEmailParams): string {
  const boundary = "TSS" + crypto.randomUUID().replaceAll("-", "");

  return [
    `From: ${params.senderName} <${params.senderEmail}>`,
    `Reply-To: ${params.senderEmail}`,
    `To: ${params.to}`,
    `Subject: ${encodeHeaderValue(params.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@techsupportandsolutions.com>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    params.plainText,
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    params.html,
    `--${boundary}--`,
  ].join("\r\n");
}

// Recipient and subject travel in MIME header lines. CR/LF and NUL bytes are
// stripped first so a crafted value cannot smuggle extra headers or a payload.
function sanitizeHeaderValue(value: string): string {
  const nul = String.fromCharCode(0);
  return value.replace(/[\r\n]/g, "").replaceAll(nul, "").trim();
}

// ASCII subjects are kept verbatim; anything non-ASCII is encoded as a folded
// UTF-8 base64 encoded-word (RFC 2047) so the header line stays injection-safe.
const ENCODED_WORD_PREFIX = "=?UTF-8?B?";
const ENCODED_WORD_SUFFIX = "?=";
const MAX_HEADER_LINE = 75;

function encodeHeaderValue(value: string): string {
  const safe = sanitizeHeaderValue(value);
  if (safe.length === 0) return "Re: Your inquiry";
  if (/^[\x20-\x7e]*$/.test(safe)) return safe;

  const base64 = toBase64(new TextEncoder().encode(safe));
  const chunkSize =
    MAX_HEADER_LINE - ENCODED_WORD_PREFIX.length - ENCODED_WORD_SUFFIX.length;

  const words: string[] = [];
  let rest = base64;
  while (rest.length > 0) {
    words.push(ENCODED_WORD_PREFIX + rest.slice(0, chunkSize) + ENCODED_WORD_SUFFIX);
    rest = rest.slice(chunkSize);
  }

  return words.join("\r\n ");
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > 320) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizeHeaderValue(email));
}

function buildPlainTextBody(message: string, customerName: string): string {
  const safeName = customerName.replace(/[\r\n]+/g, " ").trim();

  return [
    `Dear ${safeName},`,
    "",
    message.trim(),
    "",
    "--",
    "This is an automated reply from Tech Supports & Solutions. If you have further questions, please reply to this email or contact us through our website.",
    "",
    "Tech Supports & Solutions",
  ].join("\n");
}

function buildEmailBody(message: string, customerName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reply to your inquiry</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:24px 32px;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Tech Supports &amp; Solutions</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Reply to your inquiry</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Dear ${escapeHtml(customerName)},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                This is an automated reply from Tech Supports &amp; Solutions. If you have further questions, please reply to this email or contact us through our website.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">&copy; ${new Date().getFullYear()} Tech Supports &amp; Solutions. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function toBase64(input: Uint8Array): string {
  let binary = "";
  for (const byte of input) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toBase64Url(input: Uint8Array): string {
  return toBase64(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch]);
}
