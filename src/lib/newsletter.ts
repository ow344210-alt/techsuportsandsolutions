// Handles newsletter email subscriptions from the public Footer.
import { supabase } from "../supabase/client";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  name?: string | null;
}

export async function subscribeToNewsletter(email: string, name?: string): Promise<void> {
  const displayName = name?.trim() || null;
  const payload = displayName ? { email, name: displayName } : { email };
  const { error } = await supabase.from("newsletter_subscribers").insert([payload]);

  if (error) {
    if (error.code === "23505") {
      throw new Error("ALREADY_SUBSCRIBED");
    }
    throw error;
  }
}

export async function fetchNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as NewsletterSubscriber[];
}

export async function fetchRecentNewsletterSubscribers(
  limit = 5,
): Promise<NewsletterSubscriber[]> {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("id, name, email, subscribed_at")
    .order("subscribed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as NewsletterSubscriber[];
}

export async function deleteNewsletterSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}