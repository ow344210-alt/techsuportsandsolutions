-- ============================================================================
-- Create Storage Buckets
--
-- The application references seven storage buckets for uploading and serving
-- images, but none were created by the schema or existing migrations. This
-- migration creates all of them (public = true so getPublicUrl works without
-- authentication on the public-facing website) and the row-level security
-- policies on storage.objects so:
--
--   * anonymous visitors can read (SELECT) from every bucket
--   * authenticated users (admins via the dashboard) can upload (INSERT)
--     and manage objects (UPDATE / DELETE)
--
-- Buckets:
--   project-images     - Projects/Portfolio upload + display
--   service-images     - Services upload + display
--   testimonial-images  - Testimonials upload + profile images
--   website-images     - Arbitrary managed images uploaded via dashboard
--   hero-slides        - Hero slider backgrounds
--   content-images     - Content card images
--   avatars            - User profile avatars (Account / Profile pages)
--
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Bucket definitions
--    Insert each bucket only if it does not already exist.
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('project-images',    'project-images',    TRUE),
  ('service-images',    'service-images',    TRUE),
  ('testimonial-images','testimonial-images', TRUE),
  ('website-images',    'website-images',    TRUE),
  ('hero-slides',       'hero-slides',       TRUE),
  ('content-images',    'content-images',    TRUE),
  ('avatars',           'avatars',           TRUE)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on storage.objects
--    storage.objects is created automatically by the Supabase storage extension.
-- ----------------------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Public read — anyone can SELECT objects from every managed bucket
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS storage_public_read ON storage.objects;
CREATE POLICY storage_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images', 'avatars'
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Authenticated upload — logged-in users (dashboard admins) can upload
--    objects into any of these buckets.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS storage_authenticated_insert ON storage.objects;
CREATE POLICY storage_authenticated_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images', 'avatars'
    )
  );

-- ----------------------------------------------------------------------------
-- 5. Authenticated management — logged-in users can update or delete
--    objects in any of these buckets.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS storage_authenticated_update ON storage.objects;
CREATE POLICY storage_authenticated_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images', 'avatars'
    )
  )
  WITH CHECK (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images', 'avatars'
    )
  );

DROP POLICY IF EXISTS storage_authenticated_delete ON storage.objects;
CREATE POLICY storage_authenticated_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images', 'avatars'
    )
  );
