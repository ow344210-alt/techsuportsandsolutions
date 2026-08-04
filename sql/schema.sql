-- =============================================
-- Tech Supports & Solutions — Schema Reference
-- =============================================
-- WARNING: This file is a READ-ONLY reference document.
-- It must NOT be executed as a bootstrap script. The live
-- database is managed exclusively by migration files under
-- supabase/migrations/ (applied via supabase db push).
--
-- Migrations are the single source of truth for:
--   - Storage bucket creation and RLS policies
--   - Profile table grants and RLS policies
--   - Admin RPCs (admin_update_user_role, admin_set_user_disabled)
--   - Profile privilege revocations
--
-- This file documents the final secured schema state after
-- all migrations are applied. If this file ever diverges
-- from the migrations, the migrations win.

-- =============================================
-- 1. PROFILES (extends Supabase Auth users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  is_disabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_disabled ON profiles(is_disabled);

-- RLS enforced. Profiles are never directly written by browser clients:
--   INSERT is handled by the handle_new_user() trigger (SECURITY DEFINER).
--   UPDATE role/is_disabled is handled by admin RPCs (SECURITY DEFINER).
--   SELECT own row is the only direct access normal users have.
--   Name and avatar are edited via auth.users.user_metadata, not this table.
-- Applied by migrations 20260804000001 + 20260804000002:
--   REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
--   REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;

DROP POLICY IF EXISTS profiles_select_own ON profiles;
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_admin_all ON profiles;
CREATE POLICY profiles_admin_all ON profiles
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 1b. ADMIN AUTHORIZATION FUNCTION
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

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- =============================================
-- 1c. Admin RPCs (SECURITY DEFINER, applied by 20260804000001)
--     Only authenticated users may call these; the function
--     itself checks is_admin() server-side.
-- =============================================

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
     SET role = p_role, updated_at = NOW()
   WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;

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
     SET is_disabled = COALESCE(p_disabled, false), updated_at = NOW()
   WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_disabled(UUID, BOOLEAN) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_disabled(UUID, BOOLEAN) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_disabled(UUID, BOOLEAN) TO authenticated;

-- =============================================
-- 2. HERO SLIDES
-- =============================================
CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  button_text TEXT,
  button_link TEXT,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  media_url TEXT,
  overlay_opacity NUMERIC NOT NULL DEFAULT 0.4,
  animation_type TEXT NOT NULL DEFAULT 'fade' CHECK (animation_type IN ('fade', 'slide')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(order_index);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active);

ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hero_slides_public_select ON hero_slides;
CREATE POLICY hero_slides_public_select ON hero_slides
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS hero_slides_admin_all ON hero_slides;
CREATE POLICY hero_slides_admin_all ON hero_slides
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 3. SERVICES
-- =============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Monitor',
  category TEXT NOT NULL DEFAULT 'General',
  featured BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Published', 'Draft')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_order ON services(order_index);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active, status);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_public_select ON services;
CREATE POLICY services_public_select ON services
  FOR SELECT USING (is_active = true AND status = 'Published');

DROP POLICY IF EXISTS services_admin_all ON services;
CREATE POLICY services_admin_all ON services
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 4. TECH STACK
-- =============================================
CREATE TABLE IF NOT EXISTS tech_stack (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tech_stack_order ON tech_stack(order_index);
CREATE INDEX IF NOT EXISTS idx_tech_stack_active ON tech_stack(is_active);

ALTER TABLE tech_stack ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tech_stack_public_select ON tech_stack;
CREATE POLICY tech_stack_public_select ON tech_stack
  FOR SELECT USING (is_active = true);

-- =============================================
-- 5. PROJECTS / PORTFOLIO
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Web Development',
  technologies TEXT[] DEFAULT '{}',
  image_url TEXT,
  live_url TEXT,
  github_url TEXT,
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(order_index);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active, status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_public_select ON projects;
CREATE POLICY projects_public_select ON projects
  FOR SELECT USING (is_active = true AND status = 'Published');

-- =============================================
-- 6. TESTIMONIALS
-- =============================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  company_name TEXT,
  profile_image_url TEXT,
  review TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_order ON testimonials(order_index);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active, status);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS testimonials_public_select ON testimonials;
CREATE POLICY testimonials_public_select ON testimonials
  FOR SELECT USING (is_active = true AND status = 'Published');

-- =============================================
-- 7. SITE CONTENT
-- =============================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_value TEXT NOT NULL DEFAULT '',
  field_type TEXT NOT NULL DEFAULT 'text',
  page_key TEXT,
  section_key TEXT,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  body TEXT,
  image_url TEXT,
  image_alt TEXT,
  button_text TEXT,
  button_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section, field_key)
);

CREATE INDEX IF NOT EXISTS idx_site_content_section ON site_content(section);
CREATE INDEX IF NOT EXISTS idx_site_content_page_key ON site_content(page_key);
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);
CREATE INDEX IF NOT EXISTS idx_site_content_published ON site_content(is_published);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_content_public_select ON site_content;
CREATE POLICY site_content_public_select ON site_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS site_content_admin_all ON site_content;
CREATE POLICY site_content_admin_all ON site_content
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 8. CONTENT CARD GROUPS
-- =============================================
CREATE TABLE IF NOT EXISTS content_card_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  group_key TEXT NOT NULL,
  group_title TEXT NOT NULL,
  group_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_card_groups_page ON content_card_groups(page);
CREATE INDEX IF NOT EXISTS idx_content_card_groups_active ON content_card_groups(is_active);

ALTER TABLE content_card_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_card_groups_public_select ON content_card_groups;
CREATE POLICY content_card_groups_public_select ON content_card_groups
  FOR SELECT USING (is_active = true);

-- =============================================
-- 9. CONTENT CARDS
-- =============================================
CREATE TABLE IF NOT EXISTS content_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES content_card_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_cards_group ON content_cards(group_id);
CREATE INDEX IF NOT EXISTS idx_content_cards_active ON content_cards(is_active);

ALTER TABLE content_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_cards_public_select ON content_cards;
CREATE POLICY content_cards_public_select ON content_cards
  FOR SELECT USING (is_active = true);

-- =============================================
-- 10. FAQS
-- =============================================
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL DEFAULT 'home',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faqs_page ON faqs(page);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS faqs_public_select ON faqs;
CREATE POLICY faqs_public_select ON faqs
  FOR SELECT USING (is_active = true);

-- =============================================
-- 11. PROCESS STEPS
-- =============================================
CREATE TABLE IF NOT EXISTS process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  purpose TEXT,
  activities TEXT,
  deliverables TEXT,
  timeline TEXT,
  client_involvement TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_process_steps_order ON process_steps(order_index);
CREATE INDEX IF NOT EXISTS idx_process_steps_active ON process_steps(is_active);

ALTER TABLE process_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS process_steps_public_select ON process_steps;
CREATE POLICY process_steps_public_select ON process_steps
  FOR SELECT USING (is_active = true);

-- =============================================
-- 12. INDUSTRIES
-- =============================================
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_industries_order ON industries(order_index);
CREATE INDEX IF NOT EXISTS idx_industries_active ON industries(is_active);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS industries_public_select ON industries;
CREATE POLICY industries_public_select ON industries
  FOR SELECT USING (is_active = true);

-- =============================================
-- 13. FOOTER LINKS
-- =============================================
CREATE TABLE IF NOT EXISTS footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_footer_links_order ON footer_links(order_index);
CREATE INDEX IF NOT EXISTS idx_footer_links_active ON footer_links(is_active);

ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS footer_links_public_select ON footer_links;
CREATE POLICY footer_links_public_select ON footer_links
  FOR SELECT USING (is_active = true);

-- =============================================
-- 14. CONTACT MESSAGES (base table)
-- =============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  company_name TEXT,
  phone TEXT,
  country TEXT,
  website_url TEXT,
  service_required TEXT,
  budget_range TEXT,
  project_timeline TEXT,
  business_type TEXT,
  project_description TEXT,
  selected_services TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'New',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_messages_insert_anon ON contact_messages;
CREATE POLICY contact_messages_insert_anon ON contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS contact_messages_select_own ON contact_messages;
CREATE POLICY contact_messages_select_own ON contact_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS contact_messages_admin_all ON contact_messages;
CREATE POLICY contact_messages_admin_all ON contact_messages
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 15. NEWSLETTER SUBSCRIBERS
-- =============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS newsletter_subscribers_insert_anon ON newsletter_subscribers;
CREATE POLICY newsletter_subscribers_insert_anon ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS newsletter_subscribers_admin_all ON newsletter_subscribers;
CREATE POLICY newsletter_subscribers_admin_all ON newsletter_subscribers
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================
-- 16. SUPPORT REQUESTS
-- =============================================
CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);

ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_requests_insert_anon ON support_requests;
CREATE POLICY support_requests_insert_anon ON support_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS support_requests_select_own ON support_requests;
CREATE POLICY support_requests_select_own ON support_requests
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- 17. SUPPORT TICKETS
-- =============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_tickets_select_own ON support_tickets;
CREATE POLICY support_tickets_select_own ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS support_tickets_insert_own ON support_tickets;
CREATE POLICY support_tickets_insert_own ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 18. ACTIVITY LOGS
-- =============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_logs_select ON activity_logs;
CREATE POLICY activity_logs_select ON activity_logs
  FOR SELECT USING (false);

-- =============================================
-- 19. WEBSITE SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_value TEXT NOT NULL DEFAULT '',
  field_type TEXT NOT NULL DEFAULT 'text',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section, field_key)
);

CREATE INDEX IF NOT EXISTS idx_website_settings_section ON website_settings(section);

ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS website_settings_public_select ON website_settings;
CREATE POLICY website_settings_public_select ON website_settings
  FOR SELECT USING (true);

-- =============================================
-- 20. MANAGED IMAGES
-- =============================================
CREATE TABLE IF NOT EXISTS managed_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  section TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_managed_images_section ON managed_images(section);

ALTER TABLE managed_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS managed_images_public_select ON managed_images;
CREATE POLICY managed_images_public_select ON managed_images
  FOR SELECT USING (is_active = true);

-- =============================================
-- 21. UPGRADE: ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add lead_status to contact_messages if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contact_messages' AND column_name = 'lead_status'
  ) THEN
    ALTER TABLE contact_messages ADD COLUMN lead_status TEXT NOT NULL DEFAULT 'New' CHECK (lead_status IN ('New', 'Contacted', 'Qualified', 'Converted', 'Lost'));
  END IF;
END $$;

-- Add index for lead_status if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contact_messages_lead_status'
  ) THEN
    CREATE INDEX idx_contact_messages_lead_status ON contact_messages(lead_status);
  END IF;
END $$;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  is_disabled BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(u.email, '') as email,
    p.role,
    p.is_disabled,
    p.created_at
  FROM profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- REALTIME PUBLICATION
-- =============================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE hero_slides;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE services;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE projects;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE testimonials;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE contact_messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE support_requests;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 22. STORAGE OBJECTS POLICIES
-- =============================================
-- Applied by migration 20260804000000_reconcile_storage_rls.sql.
-- Bucket creation (INSERT INTO storage.buckets) and
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY
-- live in the live database and are managed outside migrations.
-- This section documents the final hardened policy set only.

-- Public read: anonymous visitors can read all content via getPublicUrl.
DROP POLICY IF EXISTS storage_public_read ON storage.objects;
CREATE POLICY storage_public_read ON storage.objects
  FOR SELECT TO public
  USING (
    bucket_id IN (
      'project-images', 'service-images', 'testimonial-images',
      'website-images', 'hero-slides', 'content-images', 'avatars'
    )
  );

-- Content buckets: admin-only INSERT.
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

-- Content buckets: admin-only UPDATE.
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

-- Content buckets: admin-only DELETE.
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

-- Avatars: owner-or-admin INSERT.
-- The app uploads avatars as "<user-id>.<ext>", so the filename's first
-- dot-separated segment is the owning user's uuid.
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

-- Avatars: owner-or-admin UPDATE.
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

-- Avatars: owner-or-admin DELETE.
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
