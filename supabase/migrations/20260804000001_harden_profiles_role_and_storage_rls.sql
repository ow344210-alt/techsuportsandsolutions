-- ============================================================================
-- Migration: Harden profiles role/disabled management
--
-- 1. CRITICAL — prevent privilege self-escalation on public.profiles
--    The existing "profiles_update_own" policy (FOR UPDATE USING auth.uid() = id)
--    has no WITH CHECK and no column restriction, so ANY authenticated user
--    could update their OWN row and set role = 'admin' or is_disabled = false.
--      * Revoke column-level UPDATE on role / is_disabled from anon and
--        authenticated so direct writes to those columns are impossible for
--        browser clients.
--      * Recreate profiles_update_own WITH CHECK (auth.uid() = id) so a row can
--        never be moved to a different owner.
--    Admin role / disabled management now happens ONLY through the SECURITY
--    DEFINER RPCs admin_update_user_role() / admin_set_user_disabled(), which
--    check public.is_admin() server-side. Function owners bypass RLS, so the
--    column REVOKE does not affect them.
--
-- NOTE: Storage policy reconciliation and hardening live exclusively in
-- 20260804000000_reconcile_storage_rls.sql. This migration touches storage
-- objects, storage buckets, RLS-enable flags, roles or ownership at all.
--
-- Idempotent: safe to run multiple times. No tables/columns are dropped, no
-- existing data is touched, RLS stays enabled.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1a. Admin-gated RPC: update a user's role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_user_id UUID,
  p_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change user roles.';
  END IF;

  IF p_role NOT IN ('admin', 'customer') THEN
    RAISE EXCEPTION 'Invalid role value.';
  END IF;

  UPDATE public.profiles
     SET role = p_role,
         updated_at = NOW()
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- 1b. Admin-gated RPC: enable / disable a user account
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_user_disabled(
  p_user_id UUID,
  p_disabled BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can enable or disable accounts.';
  END IF;

  UPDATE public.profiles
     SET is_disabled = COALESCE(p_disabled, false),
         updated_at = NOW()
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_disabled(UUID, BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_disabled(UUID, BOOLEAN) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_disabled(UUID, BOOLEAN) TO authenticated;

-- ----------------------------------------------------------------------------
-- 1c. Block direct writes to sensitive profile columns from browser clients
--     (anon and authenticated can no longer update role / is_disabled at all;
--     the SECURITY DEFINER RPCs above are the only path for admins).
-- ----------------------------------------------------------------------------
REVOKE UPDATE (role) ON public.profiles FROM anon;
REVOKE UPDATE (is_disabled) ON public.profiles FROM anon;
REVOKE UPDATE (role) ON public.profiles FROM authenticated;
REVOKE UPDATE (is_disabled) ON public.profiles FROM authenticated;

-- ----------------------------------------------------------------------------
-- 1d. Harden profiles_update_own: add WITH CHECK so a row can't be re-owned.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
