-- ============================================================================
-- Reconciliation: storage.objects RLS (policy DDL only)
--
-- WHY THIS EXISTS
--   The remote migration-history table is missing 20260802000001, yet the live
--   database already contains the seven buckets (all public = true) with RLS
--   enabled and a hand-crafted set of storage.objects policies. That live
--   policy set was created outside of migrations and differs from both the
--   migration file and the intended hardening in 20260804000001:
--
--     * content-images / hero-slides / service-images currently allow ANY
--       authenticated user to INSERT / DELETE objects (the write gap).
--     * avatars currently allow ANY authenticated user to read / update /
--       upload objects in the bucket (no owner scoping; dashboard-generated
--       "Allow ... 1oj01fe_*" policies).
--
--   This migration therefore:
--     1. Drops the broad live policies that conflict with the hardening intent.
--     2. Recreates the hardened storage.objects policy set using the SAME
--        names that 20260804000001 expects, so that file's storage section
--        remains idempotent (DROP IF EXISTS + CREATE) when it runs next.
--
-- SAFETY GUARANTEES
--   * Policy DDL only. NO bucket INSERT/UPDATE, NO ALTER TABLE, NO ENABLE RLS,
--     NO SET ROLE, NO OWNER TO, NO index/column changes.
--   * Does NOT touch the working admin policies on project-images,
--     testimonial-images and website-images ("Admin can ... managed images").
--   * Does NOT touch the public-read policies on content-images, hero-slides
--     and service-images (the public site depends on them).
--   * storage.buckets is untouched; public = true stays as-is, so anonymous
--     reads via getPublicUrl keep working (public buckets serve URLs without
--     RLS SELECT policies).
--   * Idempotent: safe to run multiple times.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop broad live policies that conflict with hardening intent
-- ----------------------------------------------------------------------------

-- Content buckets: any-authenticated INSERT / DELETE (the write gap).
DROP POLICY IF EXISTS "Authenticated upload content images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload hero slide media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete content images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete hero slide media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete service images" ON storage.objects;

-- Avatars: dashboard-generated, bucket-wide, no owner scoping.
DROP POLICY IF EXISTS "Allow Read 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update 1oj01fe_0" ON storage.objects;
DROP POLICY IF EXISTS "Allow Update 1oj01fe_1" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads 1oj01fe_0" ON storage.objects;

-- ----------------------------------------------------------------------------
-- 2. Recreate the hardened storage.objects policy set
--    (same names as 20260804000001 so its storage section stays idempotent)
-- ----------------------------------------------------------------------------

-- 2a. Content buckets: admin-only writes.
DROP POLICY IF EXISTS storage_authenticated_insert ON storage.objects;
CREATE POLICY storage_authenticated_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images'
    )
    AND public.is_admin()
  );

DROP POLICY IF EXISTS storage_authenticated_update ON storage.objects;
CREATE POLICY storage_authenticated_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images'
    )
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images'
    )
    AND public.is_admin()
  );

DROP POLICY IF EXISTS storage_authenticated_delete ON storage.objects;
CREATE POLICY storage_authenticated_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images'
    )
    AND public.is_admin()
  );

-- 2b. Avatars: users manage only their own avatar, admins manage all.
--     The app uploads avatars as "<user-id>.<ext>", so the filename's first
--     dot-separated segment is the owning user's uuid.
DROP POLICY IF EXISTS storage_avatars_insert_own ON storage.objects;
CREATE POLICY storage_avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      public.is_admin()
      OR split_part(name, '.', 1) = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS storage_avatars_update_own ON storage.objects;
CREATE POLICY storage_avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      public.is_admin()
      OR split_part(name, '.', 1) = auth.uid()::text
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      public.is_admin()
      OR split_part(name, '.', 1) = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS storage_avatars_delete_own ON storage.objects;
CREATE POLICY storage_avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      public.is_admin()
      OR split_part(name, '.', 1) = auth.uid()::text
    )
  );
