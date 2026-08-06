-- =============================================
-- Migration: Lockdown contact_messages write paths
--
-- Live audit (project gpwjdjwzqqvwjbfrobvq) verified that anonymous visitors
-- can INSERT directly into contact_messages (the "Anyone can submit a message"
-- RLS policy passes, data-level errors returned HTTP 400). The public contact
-- form no longer uses that path: it submits through the submit-contact edge
-- function, which validates input, rate-limits by IP, and writes with the
-- service-role key (which bypasses RLS). Keeping an open anonymous INSERT
-- policy lets bots write unvalidated, rate-unlimited rows straight into the
-- table, so it is removed.
--
-- Also revokes EXECUTE on the legacy SECURITY DEFINER helpers
-- submit_contact_message() and get_contact_messages_for_admin() from every
-- non-owner role. The frontend never calls them (only get_all_users,
-- admin_update_user_role, admin_set_user_disabled, and the
-- update_contact_message_reply RPCs are used). submit_contact_message()
-- performs no validation and inserts directly; get_contact_messages_for_admin()
-- returns every message. Revoking EXECUTE removes both as attack surface.
-- =============================================

-- Remove the anonymous INSERT path on contact_messages
DROP POLICY IF EXISTS "Anyone can submit a message" ON public.contact_messages;

-- Remaining contact_messages policies:
--   "Users can view own messages"    SELECT  (authenticated, user_id = auth.uid())
--   contact_messages_admin_all       ALL     (authenticated, public.is_admin())

-- Lock down the legacy SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.submit_contact_message(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_contact_message(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_contact_message(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.get_contact_messages_for_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_contact_messages_for_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_contact_messages_for_admin() FROM authenticated;
