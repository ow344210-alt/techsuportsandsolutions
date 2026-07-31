-- =============================================
-- RLS Policy Audit — Missing Policies
-- Adds admin ALL policies for all content-management
-- tables and fixes public access where needed.
-- =============================================

-- ──────────────────────────────────────────────
-- 1. profiles — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 2. tech_stack — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS tech_stack_admin_all ON tech_stack;
CREATE POLICY tech_stack_admin_all ON tech_stack
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 3. projects — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS projects_admin_all ON projects;
CREATE POLICY projects_admin_all ON projects
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 4. testimonials — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS testimonials_admin_all ON testimonials;
CREATE POLICY testimonials_admin_all ON testimonials
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 5. content_card_groups — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS content_card_groups_admin_all ON content_card_groups;
CREATE POLICY content_card_groups_admin_all ON content_card_groups
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 6. content_cards — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS content_cards_admin_all ON content_cards;
CREATE POLICY content_cards_admin_all ON content_cards
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 7. faqs — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS faqs_admin_all ON faqs;
CREATE POLICY faqs_admin_all ON faqs
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 8. process_steps — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS process_steps_admin_all ON process_steps;
CREATE POLICY process_steps_admin_all ON process_steps
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 9. industries — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS industries_admin_all ON industries;
CREATE POLICY industries_admin_all ON industries
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 10. footer_links — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS footer_links_admin_all ON footer_links;
CREATE POLICY footer_links_admin_all ON footer_links
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 11. website_settings — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS website_settings_admin_all ON website_settings;
CREATE POLICY website_settings_admin_all ON website_settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 12. managed_images — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS managed_images_admin_all ON managed_images;
CREATE POLICY managed_images_admin_all ON managed_images
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 13. support_requests — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS support_requests_admin_all ON support_requests;
CREATE POLICY support_requests_admin_all ON support_requests
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 14. support_tickets — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS support_tickets_admin_all ON support_tickets;
CREATE POLICY support_tickets_admin_all ON support_tickets
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 15. activity_logs — admin full access
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS activity_logs_admin_all ON activity_logs;
CREATE POLICY activity_logs_admin_all ON activity_logs
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────
-- 16. newsletter_subscribers — public SELECT for counting
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS newsletter_subscribers_public_select ON newsletter_subscribers;
CREATE POLICY newsletter_subscribers_public_select ON newsletter_subscribers
  FOR SELECT USING (true);