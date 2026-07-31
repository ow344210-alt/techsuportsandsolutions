export interface ContactMessageReply {
  id: string;
  contact_message_id: string;
  admin_user_id: string | null;
  admin_email: string | null;
  admin_name: string | null;
  recipient_email: string | null;
  subject: string;
  message: string;
  delivery_status: "pending" | "processing" | "sent" | "failed";
  email_provider: string | null;
  provider_message_id: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ReplyFormData {
  subject: string;
  message: string;
}

export interface ReplySendResult {
  success: boolean;
  replyId?: string;
  error?: string;
}