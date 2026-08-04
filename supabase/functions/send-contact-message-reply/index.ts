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

    const emailProvider = "gmail";
    let providerMessageId: string | null = null;

    try {
      const accessToken = await getGmailAccessToken();

      const mimeEmail = buildPlainTextMimeEmail({
        to: recipientEmail,
        subject: reply.subject,
        fallbackSubject: contactMessage.subject,
        senderEmail: gmailSenderEmail,
        message: reply.message,
        customerName,
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

interface PlainTextMimeEmailParams {
  to: string;
  subject: string;
  fallbackSubject: string;
  senderEmail: string;
  message: string;
  customerName: string;
}

function buildPlainTextMimeEmail(params: PlainTextMimeEmailParams): string {
  const headers = [
    `From: ${GMAIL_SENDER_NAME} <${params.senderEmail}>`,
    `To: ${sanitizeHeaderValue(params.to)}`,
    `Reply-To: ${params.senderEmail}`,
    `Subject: ${encodeHeaderValue(buildReplySubject(params.subject, params.fallbackSubject))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@gmail.com>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
  ].join("\r\n");

  const body = toQuotedPrintable(
    buildPlainTextBody(params.message, params.customerName),
  );

  return `${headers}\r\n\r\n${body}\r\n`;
}

function buildReplySubject(subject: string, fallbackSubject: string): string {
  const stripped = stripReplyPrefixes(sanitizeHeaderValue(subject));
  const base = stripped || sanitizeHeaderValue(fallbackSubject) || "your inquiry";
  return `Response from Tech Supports & Solutions: ${base}`;
}

function stripReplyPrefixes(subject: string): string {
  return subject.replace(/^(\s*(Re|Fwd)(\[\d*\])?:\s*)+/i, "");
}

const QP_MAX_LINE = 76;

function toQuotedPrintable(text: string): string {
  const encodedLines: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    let current = "";

    for (const byte of new TextEncoder().encode(line)) {
      let token: string;

      if (byte === 0x3d) {
        token = "=3D";
      } else if (byte >= 0x20 && byte <= 0x7e) {
        token = String.fromCharCode(byte);
      } else {
        token = "=" + byte.toString(16).toUpperCase().padStart(2, "0");
      }

      if (current.length + token.length > QP_MAX_LINE - 1) {
        current += "=";
        encodedLines.push(current);
        current = "";
      }
      current += token;
    }

    encodedLines.push(current);
  }

  return encodedLines.join("\r\n");
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
  if (safe.length === 0) return "Your inquiry";
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
  const safeName = customerName.replace(/[\r\n]+/g, " ").trim() || "Customer";

  return [
    `Hello ${safeName},`,
    "",
    "Thank you for contacting Tech Supports & Solutions.",
    "",
    message.trim(),
    "",
    "Regards,",
    "Tech Supports & Solutions",
    "techsupportandsolutions@gmail.com",
  ].join("\n");
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
