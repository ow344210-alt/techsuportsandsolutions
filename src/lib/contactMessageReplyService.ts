import { supabase } from "../supabase/client";
import { getFunctionErrorMessage } from "./functionErrors";
import type { ContactMessageReply, ReplyFormData, ReplySendResult } from "./contactMessageReplies";

export async function createContactMessageReply(
  contactMessageId: string,
  recipientEmail: string,
  formData: ReplyFormData,
): Promise<ReplySendResult> {
  const { data: replyId, error: rpcError } = await supabase.rpc(
    "create_contact_message_reply",
    {
      p_contact_message_id: contactMessageId,
      p_subject: formData.subject.trim(),
      p_message: formData.message.trim(),
      p_recipient_email: recipientEmail.trim(),
    },
  );

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  return { success: true, replyId: replyId as string };
}

export async function sendReplyEmail(replyId: string): Promise<ReplySendResult> {
  const { data, error } = await supabase.functions.invoke(
    "send-contact-message-reply",
    {
      body: { replyId },
    },
  );

  if (error) {
    return {
      success: false,
      error: await getFunctionErrorMessage(error, "Failed to send reply"),
    };
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    return { success: false, error: data.error as string };
  }

  // Only treat the send as successful once the reply row is confirmed to be
  // in the "sent" state with a real provider message id (the edge function
  // marks it before it responds, so this refetch is authoritative).
  const { data: confirmed } = await supabase
    .from("contact_message_replies")
    .select("delivery_status, provider_message_id")
    .eq("id", replyId)
    .maybeSingle();

  if (
    !confirmed ||
    confirmed.delivery_status !== "sent" ||
    typeof confirmed.provider_message_id !== "string" ||
    confirmed.provider_message_id === ""
  ) {
    return {
      success: false,
      error: "The email was not confirmed as sent. Please try again.",
    };
  }

  return { success: true, replyId };
}

export async function updateContactMessageReply(
  replyId: string,
  formData: ReplyFormData,
): Promise<ReplySendResult> {
  const { data, error } = await supabase.rpc("update_contact_message_reply", {
    p_reply_id: replyId,
    p_subject: formData.subject.trim(),
    p_message: formData.message.trim(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, replyId: data as string };
}

export async function fetchMessageReplies(
  contactMessageId: string,
): Promise<ContactMessageReply[]> {
  const { data, error } = await supabase
    .from("contact_message_replies")
    .select("*")
    .eq("contact_message_id", contactMessageId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ContactMessageReply[];
}

export async function retryFailedReply(
  replyId: string,
): Promise<ReplySendResult> {
  const { data: reply, error: fetchError } = await supabase
    .from("contact_message_replies")
    .select("delivery_status")
    .eq("id", replyId)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  if (!reply) {
    return { success: false, error: "Reply record not found." };
  }

  if (reply.delivery_status !== "failed") {
    return { success: false, error: "Only failed replies can be retried." };
  }

  const { error: updateError } = await supabase
    .from("contact_message_replies")
    .update({
      delivery_status: "pending",
      error_message: null,
      sent_at: null,
      provider_message_id: null,
      email_provider: null,
    })
    .eq("id", replyId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return sendReplyEmail(replyId);
}