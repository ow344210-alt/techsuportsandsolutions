-- =============================================
-- Admin Authorization Function
-- public.is_admin() — returns true if the
-- authenticated user has role = 'admin'
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN user_role = 'admin';
END;
$$;

-- Revoke public execution
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;

-- Grant execution to authenticated users only
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================
-- Admin RLS Policies using is_admin()
-- =============================================

-- Hero Slides — admin full access
DROP POLICY IF EXISTS hero_slides_admin_all ON hero_slides;
CREATE POLICY hero_slides_admin_all ON hero_slides
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Services — admin full access
DROP POLICY IF EXISTS services_admin_all ON services;
CREATE POLICY services_admin_all ON services
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Site Content — admin full access
DROP POLICY IF EXISTS site_content_admin_all ON site_content;
CREATE POLICY site_content_admin_all ON site_content
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Contact Messages — admin full access
DROP POLICY IF EXISTS contact_messages_admin_all ON contact_messages;
CREATE POLICY contact_messages_admin_all ON contact_messages
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Newsletter Subscribers — admin full access
DROP POLICY IF EXISTS newsletter_subscribers_admin_all ON newsletter_subscribers;
CREATE POLICY newsletter_subscribers_admin_all ON newsletter_subscribers
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());