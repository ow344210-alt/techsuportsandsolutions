import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
const brevoApiKey = getRequiredEnv("BREVO_API_KEY");
const brevoSenderEmail = getRequiredEnv("BREVO_SENDER_EMAIL");
const brevoSenderName = getRequiredEnv("BREVO_SENDER_NAME");
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const CORS_ORIGINS = [
  Deno.env.get("APP_URL") ?? "",
  Deno.env.get("VITE_APP_URL") ?? "",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
].filter((origin) => origin.length > 0);

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = CORS_ORIGINS.includes(origin)
    ? origin
    : CORS_ORIGINS[0] ?? "*";

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(allowOrigin),
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, allowOrigin);
  }

  if (origin && !CORS_ORIGINS.includes(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, allowOrigin);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse(
        { error: "Missing authorization header" },
        401,
        allowOrigin,
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
        allowOrigin,
      );
    }
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, is_disabled")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin" || profile.is_disabled) {
      return jsonResponse({ error: "Unauthorized" }, 403, allowOrigin);
    }

    const body = await req.json();
    const replyId = body?.replyId;

    if (!replyId || typeof replyId !== "string") {
      return jsonResponse(
        { error: "Missing or invalid replyId" },
        400,
        allowOrigin,
      );
    }

    const { data: reply, error: replyError } = await supabaseAdmin
      .from("contact_message_replies")
      .select("id, contact_message_id, subject, message, delivery_status")
      .eq("id", replyId)
      .single();

    if (replyError || !reply) {
      return jsonResponse(
        { error: "Reply record not found" },
        404,
        allowOrigin,
      );
    }

    if (reply.delivery_status === "sent") {
      return jsonResponse(
        { error: "Reply has already been sent" },
        400,
        allowOrigin,
      );
    }

    if (reply.delivery_status === "processing") {
      return jsonResponse(
        { error: "Reply is already being processed" },
        409,
        allowOrigin,
      );
    }

    await supabaseAdmin
      .from("contact_message_replies")
      .update({ delivery_status: "processing" })
      .eq("id", replyId);

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
        allowOrigin,
      );
    }

    const recipientEmail = contactMessage.email;
    const customerName = contactMessage.full_name ?? "Customer";

    if (!recipientEmail) {
      await supabaseAdmin
        .from("contact_message_replies")
        .update({
          delivery_status: "failed",
          error_message: "Recipient email is missing.",
        })
        .eq("id", replyId);

      return jsonResponse(
        { error: "Recipient email is missing" },
        400,
        allowOrigin,
      );
    }

    await supabaseAdmin
      .from("contact_message_replies")
      .update({ recipient_email: recipientEmail })
      .eq("id", replyId);

    const emailSubject = reply.subject;
    const emailBody = buildEmailBody(reply.message, customerName);

    let providerMessageId: string | null = null;
    const emailProvider = "brevo";

    try {
      const brevoResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: { email: brevoSenderEmail, name: brevoSenderName },
          to: [{ email: recipientEmail, name: customerName }],
          subject: emailSubject,
          htmlContent: emailBody,
          textContent: stripHtml(emailBody),
        }),
      });

      const brevoData = await brevoResponse.json();

      if (!brevoResponse.ok) {
        throw new Error(
          brevoData?.message || `Brevo API error: ${brevoResponse.status}`,
        );
      }

      providerMessageId = brevoData?.messageId ?? null;
    } catch (emailError) {
      const errorMessage =
        emailError instanceof Error ? emailError.message : "Unknown email error";

      await supabaseAdmin
        .from("contact_message_replies")
        .update({
          delivery_status: "failed",
          error_message: "Email provider rejected the message.",
          email_provider: emailProvider,
        })
        .eq("id", replyId);

      console.error("Email send failed:", errorMessage);

      return jsonResponse(
        { error: "Failed to send email" },
        500,
        allowOrigin,
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
      allowOrigin,
    );
  } catch (err) {
    console.error("Edge Function error:", err);
    return jsonResponse(
      { error: "Internal server error" },
      500,
      allowOrigin,
    );
  }
});

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
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Tech Support & Solutions</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Reply to your inquiry</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Dear ${escapeHtml(customerName)},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
              <p style="margin:0;font-size:13px;color:#94a3b8;">
                This is an automated reply from Tech Support & Solutions. If you have further questions, please reply to this email or contact us through our website.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">&copy; ${new Date().getFullYear()} Tech Support & Solutions. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
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