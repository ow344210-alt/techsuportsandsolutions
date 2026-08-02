-- ============================================================================
-- Fix RLS so anonymous/public visitors can read published services and so that
-- only authenticated admins can manage services.
--
-- ROOT CAUSE
--   services_admin_all was created as:
--     CREATE POLICY services_admin_all ON services
--       FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
--   with no "TO" clause, so it applied to the "public" role (all roles,
--   including anonymous). public.is_admin() has EXECUTE revoked from anon, so
--   ANY anonymous SELECT on the services table evaluated is_admin() and failed
--   with "permission denied for function is_admin". The public Services section
--   therefore could never read the published services and silently fell back to
--   hardcoded cards.
--
-- FIX
--   1. Restrict the admin ALL policy to the authenticated role so anonymous
--      users never evaluate is_admin().
--   2. Remove the over-broad dashboard-generated services policies so the RLS
--      matrix matches the intended access model:
--        - anon:                 SELECT published + active services
--        - authenticated admins: SELECT all services
--        - authenticated admins: INSERT / UPDATE / DELETE services
--        - public:               no modification
--   3. Apply the same "TO authenticated" fix to every other *_admin_all policy
--      that references is_admin() and currently applies to "public". Those
--      tables share the exact same root cause and were verified to fail for
--      anonymous SELECTs in the same way (hero_slides, projects, testimonials,
--      tech_stack, ...).
--
-- Incremental, idempotent, does not drop or recreate any table, and does NOT
-- disable RLS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SERVICES — the reported bug
-- ----------------------------------------------------------------------------

-- Restrict the admin "FOR ALL" policy to authenticated so anonymous users never
-- call is_admin() (which is revoked from anon).
DROP POLICY IF EXISTS services_admin_all ON services;
CREATE POLICY services_admin_all ON services
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Drop dashboard-generated over-broad policies on services.
DROP POLICY IF EXISTS "Authenticated can manage services" ON services;
DROP POLICY IF EXISTS "Authenticated can view all services" ON services;
DROP POLICY IF EXISTS "Public can view active services" ON services;

-- services_public_select is kept unchanged:
--   SELECT for role public WHERE is_active = true AND status = 'Published'
-- This is the only policy anonymous visitors use to read services.

-- ----------------------------------------------------------------------------
-- 2. OTHER *_admin_all POLICIES — same root cause, same remedy
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS activity_logs_admin_all ON activity_logs;
CREATE POLICY activity_logs_admin_all ON activity_logs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS content_card_groups_admin_all ON content_card_groups;
CREATE POLICY content_card_groups_admin_all ON content_card_groups
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS content_cards_admin_all ON content_cards;
CREATE POLICY content_cards_admin_all ON content_cards
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS faqs_admin_all ON faqs;
CREATE POLICY faqs_admin_all ON faqs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS footer_links_admin_all ON footer_links;
CREATE POLICY footer_links_admin_all ON footer_links
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS hero_slides_admin_all ON hero_slides;
CREATE POLICY hero_slides_admin_all ON hero_slides
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS industries_admin_all ON industries;
CREATE POLICY industries_admin_all ON industries
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS managed_images_admin_all ON managed_images;
CREATE POLICY managed_images_admin_all ON managed_images
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS newsletter_subscribers_admin_all ON newsletter_subscribers;
CREATE POLICY newsletter_subscribers_admin_all ON newsletter_subscribers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS process_steps_admin_all ON process_steps;
CREATE POLICY process_steps_admin_all ON process_steps
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS projects_admin_all ON projects;
CREATE POLICY projects_admin_all ON projects
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS site_content_admin_all ON site_content;
CREATE POLICY site_content_admin_all ON site_content
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS support_requests_admin_all ON support_requests;
CREATE POLICY support_requests_admin_all ON support_requests
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS support_tickets_admin_all ON support_tickets;
CREATE POLICY support_tickets_admin_all ON support_tickets
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS tech_stack_admin_all ON tech_stack;
CREATE POLICY tech_stack_admin_all ON tech_stack
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS testimonials_admin_all ON testimonials;
CREATE POLICY testimonials_admin_all ON testimonials
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS website_settings_admin_all ON website_settings;
CREATE POLICY website_settings_admin_all ON website_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
