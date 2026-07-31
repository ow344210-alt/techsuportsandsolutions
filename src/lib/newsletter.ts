// Handles newsletter email subscriptions from the public Footer.
import { supabase } from "../supabase/client";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  const { error } = await supabase.from("newsletter_subscribers").insert([{ email }]);

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

export async function deleteNewsletterSubscriber(id: string): Promise<void> {
  const { error } = await supabase
    .from("newsletter_subscribers")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}