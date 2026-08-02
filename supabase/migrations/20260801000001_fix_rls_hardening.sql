-- ============================================================================
-- RLS Hardening + Cleanup
--
-- Live audit results (project gpwjdjwzqqvwjbfrobvq) revealed:
--
-- CRITICAL (PII exposure)
--   newsletter_subscribers_public_select       SELECT qual true, role public
--     -> ANY anonymous visitor can read every subscriber email.
--   "Authenticated can view subscribers"       SELECT qual true, role authenticated
--     -> ANY logged-in user can read every subscriber email.
--     The admin dashboard reads subscribers through newsletter_subscribers_admin_all
--     (public.is_admin()), so removing the two broad policies does not break it.
--
-- HIGH (any authenticated user can mutate CMS tables)
--   "Authenticated manage faqs" / footer_links / slides / industries /
--   process steps / tech / site content       ALL USING true WITH CHECK true
--     -> ANY logged-in (non-admin) user could edit public-facing content.
--     Each table also has an <table>_admin_all policy (public.is_admin()),
--     so these broad policies are both dangerous and redundant.
--
-- MEDIUM
--   activity_logs "Authenticated can read logs" (qual true)  -> logs may carry
--     email/contact PII. Admin reads go through activity_logs_admin_all.
--   support_requests "Admins can view all support requests"  -> checked
--     auth.users.raw_user_meta_data->>'role' = 'admin' instead of the
--     profiles-based public.is_admin() used everywhere else.
--   Several *_admin policies were created with role "public" while calling
--     is_admin() (or an admin subquery). Anonymous requests that evaluate them
--     throw "permission denied for function is_admin" (the same bug fixed for
--     services in 20260801000000). They are re-scoped to TO authenticated.
--
-- CLEANUP (redundant, no behavior change)
--   Duplicate dashboard-named policies that exactly mirror _admin_all /
--     _public_select policies.
--   Duplicate indexes: idx_profiles_disabled (vs idx_profiles_is_disabled),
--     site_content_section_field_key_idx (vs ..._key), idx_newsletter_subscribers_email
--     (vs unique constraint newsletter_subscribers_email_key).
--   Duplicate updated_at trigger on contact_messages: set_contact_messages_updated_at
--     (EXECUTE set_updated_at()) vs update_contact_messages_updated_at
--     (EXECUTE update_contact_messages_updated_at()); both do NEW.updated_at = NOW().
--
-- Incremental + idempotent: only DROP POLICY / DROP INDEX / DROP TRIGGER on
-- redundant objects and CREATE POLICY replacements. No table is dropped or
-- recreated, no column renamed or removed, and RLS stays enabled.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CRITICAL — newsletter subscriber PII
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS newsletter_subscribers_public_select ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated can view subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS newsletter_subscribers_insert_anon ON public.newsletter_subscribers;

-- Remaining newsletter policies:
--   "Anyone can subscribe"                      INSERT (anon, authenticated) WITH CHECK true
--   newsletter_subscribers_admin_all            ALL (authenticated) USING/WITH CHECK is_admin()

-- ----------------------------------------------------------------------------
-- 2. HIGH — restrict broad "any authenticated user" CMS policies to admins
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated manage faqs" ON public.faqs;
DROP POLICY IF EXISTS "Authenticated manage footer links" ON public.footer_links;
DROP POLICY IF EXISTS "Authenticated manage slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Authenticated manage industries" ON public.industries;
DROP POLICY IF EXISTS "Authenticated manage process steps" ON public.process_steps;
DROP POLICY IF EXISTS "Authenticated manage tech" ON public.tech_stack;
DROP POLICY IF EXISTS "Authenticated users can manage site content" ON public.site_content;

-- ----------------------------------------------------------------------------
-- 3. MEDIUM — activity_logs read restricted to admins
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read logs" ON public.activity_logs;

-- ----------------------------------------------------------------------------
-- 4. MEDIUM — support_requests admin check unified on public.is_admin()
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all support requests" ON public.support_requests;

-- ----------------------------------------------------------------------------
-- 5. MEDIUM — re-scope public-role *_admin policies to authenticated
--    (same root cause as the services bug fixed in 20260801000000)
-- ----------------------------------------------------------------------------

-- contact_message_activity
DROP POLICY IF EXISTS contact_message_activity_insert_admin ON public.contact_message_activity;
CREATE POLICY contact_message_activity_insert_admin ON public.contact_message_activity
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- contact_message_notifications
DROP POLICY IF EXISTS contact_message_notifications_insert_admin ON public.contact_message_notifications;
CREATE POLICY contact_message_notifications_insert_admin ON public.contact_message_notifications
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

DROP POLICY IF EXISTS contact_message_notifications_select_admin ON public.contact_message_notifications;
CREATE POLICY contact_message_notifications_select_admin ON public.contact_message_notifications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- contact_message_rate_limits
DROP POLICY IF EXISTS contact_msg_rl_select_admin ON public.contact_message_rate_limits;
CREATE POLICY contact_msg_rl_select_admin ON public.contact_message_rate_limits
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS contact_msg_rl_delete_admin ON public.contact_message_rate_limits;
CREATE POLICY contact_msg_rl_delete_admin ON public.contact_message_rate_limits
  FOR DELETE TO authenticated USING (public.is_admin());

-- contact_message_replies
DROP POLICY IF EXISTS contact_message_replies_select_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_select_admin ON public.contact_message_replies
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS contact_message_replies_insert_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_insert_admin ON public.contact_message_replies
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS contact_message_replies_update_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_update_admin ON public.contact_message_replies
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS contact_message_replies_delete_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_delete_admin ON public.contact_message_replies
  FOR DELETE TO authenticated USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. CLEANUP — duplicate policies on contact_messages (14 -> 5)
--    Kept: "Anyone can submit a message", "Users can view own messages",
--    contact_messages_admin_all. The dropped *_select_admin / *_update_admin /
--    *_delete_admin were public-role duplicates of contact_messages_admin_all;
--    the *_public no-op deny policies are implicit in RLS.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can delete messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_delete_admin ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_delete_public ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_insert_anon ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_select_admin ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_select_own ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_select_public ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_update_admin ON public.contact_messages;
DROP POLICY IF EXISTS contact_messages_update_public ON public.contact_messages;

-- ----------------------------------------------------------------------------
-- 7. CLEANUP — duplicate policies on profiles (6 -> 3)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- ----------------------------------------------------------------------------
-- 8. CLEANUP — duplicate dashboard-named policies on CMS tables
--    (each duplicates the corresponding <table>_admin_all / _public_select)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage cards" ON public.content_cards;
DROP POLICY IF EXISTS "Public can view active cards" ON public.content_cards;

DROP POLICY IF EXISTS "Admins can manage groups" ON public.content_card_groups;
DROP POLICY IF EXISTS "Public can view active groups" ON public.content_card_groups;

DROP POLICY IF EXISTS "Public can read active faqs" ON public.faqs;
DROP POLICY IF EXISTS "Public can read active footer links" ON public.footer_links;
DROP POLICY IF EXISTS "Public can read active slides" ON public.hero_slides;
DROP POLICY IF EXISTS "Public can read active industries" ON public.industries;
DROP POLICY IF EXISTS "Public can read active process steps" ON public.process_steps;
DROP POLICY IF EXISTS "Public can read active tech" ON public.tech_stack;
DROP POLICY IF EXISTS "Public can read site content" ON public.site_content;

-- contact_message_activity no-op deny policies (implicit in RLS)
DROP POLICY IF EXISTS contact_message_activity_delete_public ON public.contact_message_activity;
DROP POLICY IF EXISTS contact_message_activity_insert_public ON public.contact_message_activity;
DROP POLICY IF EXISTS contact_message_activity_select_public ON public.contact_message_activity;
DROP POLICY IF EXISTS contact_message_activity_update_public ON public.contact_message_activity;

-- ----------------------------------------------------------------------------
-- 9. CLEANUP — duplicate indexes
-- ----------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_profiles_disabled;
DROP INDEX IF EXISTS public.site_content_section_field_key_idx;
DROP INDEX IF EXISTS public.idx_newsletter_subscribers_email;

-- ----------------------------------------------------------------------------
-- 10. CLEANUP — duplicate updated_at trigger on contact_messages
--     (keeps update_contact_messages_updated_at)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_contact_messages_updated_at ON public.contact_messages;
