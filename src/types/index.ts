export type UserRole = "admin" | "editor" | "user";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type ContactMessageStatus = "new" | "in_progress" | "replied" | "resolved" | "spam" | "read";

export type ContactMessagePriority = "low" | "normal" | "high" | "urgent";

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  budget: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  priority: ContactMessagePriority;
  assigned_to: string | null;
  admin_notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  replied_at: string | null;
}

export interface ServiceOption {
  value: string;
  label: string;
  description: string | null;
}

export interface ContactMessageActivity {
  id: string;
  contact_message_id: string;
  admin_user_id: string | null;
  action: string;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  note: string | null;
  created_at: string;
}

export interface SiteContent {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}