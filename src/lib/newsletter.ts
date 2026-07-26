// Handles newsletter email subscriptions from the public Footer.
import { supabase } from "../supabase/client";

export async function subscribeToNewsletter(email: string): Promise<void> {
  const { error } = await supabase.from("newsletter_subscribers").insert([{ email }]);

  if (error) {
    if (error.code === "23505") {
      throw new Error("ALREADY_SUBSCRIBED");
    }
    throw error;
  }
}