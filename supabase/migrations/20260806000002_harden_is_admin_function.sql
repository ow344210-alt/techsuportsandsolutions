-- =============================================
-- Migration: Harden public.is_admin() to exclude disabled accounts
--
-- The user-management feature lets an admin disable a profile
-- (profiles.is_disabled = true). The frontend signs disabled users out, but
-- the RLS check public.is_admin() only looked at role = 'admin', so a disabled
-- admin kept full admin RLS access for the remainder of a live session.
-- Requiring is_disabled IS NOT TRUE closes that gap at the database layer,
-- matching the guard already used by update_contact_message_reply.
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  user_disabled BOOLEAN;
BEGIN
  SELECT role, is_disabled INTO user_role, user_disabled
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN user_role = 'admin' AND user_disabled IS NOT TRUE;
END;
$$;

-- Keep the same grant shape as before (anon/public revoked, authenticated only)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
