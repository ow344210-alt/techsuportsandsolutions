-- ============================================================================
-- Migration: Remove table-level DML grants on public.profiles (least privilege)
--
-- Closes the privilege self-escalation hole on public.profiles. The earlier
-- column-level REVOKE in 20260804000001 had no effect because the privileges
-- come from TABLE-level grants, not column-level grants (PostgreSQL only
-- honors column REVOKE when the grant itself was column-level).
--
-- Least-privilege model:
--   * anon / authenticated keep SELECT (own-row + admin-all reads).
--   * INSERT/UPDATE/DELETE are revoked from anon and authenticated.
--   * All row writes happen through paths that bypass table grants:
--       - INSERT: trigger on_auth_user_created -> handle_new_user()
--         (SECURITY DEFINER, owned by postgres)
--       - UPDATE: admin_update_user_role / admin_set_user_disabled
--         (SECURITY DEFINER, owned by postgres)
--   * No legitimate browser path writes profiles directly: profile name/avatar
--     live in auth.users.user_metadata via supabase.auth.updateUser.
--
-- Idempotent. No tables/columns dropped, no data deleted, RLS untouched,
-- no storage changes, no role/RPC/ownership changes, no SET ROLE.
-- ============================================================================

REVOKE INSERT, UPDATE, DELETE
ON public.profiles
FROM anon;

REVOKE INSERT, UPDATE, DELETE
ON public.profiles
FROM authenticated;
