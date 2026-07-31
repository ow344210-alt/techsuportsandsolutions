-- =============================================
-- Migration: Fix contact message status values + scope admin RLS
--
-- 1. The dashboard "mark as read" action writes status = 'read'. The remote
--    contact_messages_status_check constraint allows 'read' (previously the
--    app wrote 'in_progress', which violated the constraint and surfaced as
--    error 23514). Keep the schema aligned by allowing every value the app
--    reads/writes ('read', 'archived', and legacy 'in_progress', etc.).
--
-- 2. contact_messages_admin_all is a FOR ALL policy scoped to public. For
--    anonymous INSERT attempts (the public contact form path), PostgreSQL
--    evaluates the policy's WITH CHECK expression public.is_admin(), which
--    raises "permission denied for function is_admin" for the anon role
--    (EXECUTE on is_admin is revoked from anon/public). Scoping the policy
--    to authenticated prevents the admin policy from blocking public writes.
-- =============================================

-- Scope the admin FOR ALL policy to authenticated users only
DROP POLICY IF EXISTS contact_messages_admin_all ON public.contact_messages;
CREATE POLICY contact_messages_admin_all ON public.contact_messages
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Align the status CHECK constraint with the values the app uses
DO $$
BEGIN
  ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_status_check;
  ALTER TABLE public.contact_messages
    ADD CONSTRAINT contact_messages_status_check
    CHECK (status IN ('new', 'read', 'replied', 'resolved', 'archived', 'spam', 'in_progress'));
END $$;
