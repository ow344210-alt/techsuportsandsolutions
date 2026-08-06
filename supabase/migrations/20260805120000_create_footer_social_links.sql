-- ============================================================================
-- Footer social links table for the public Footer's social-media strip.
--
--   - Admin (authenticated + is_admin()) can manage rows.
--   - Public (anon/authenticated) can only read enabled rows.
--   - Table is added to the supabase_realtime publication so admin dashboards
--     can live-refresh without polling.
--
-- Incremental + idempotent: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT
-- EXISTS, DROP/CREATE policy and trigger pairs. No table is ever dropped.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.footer_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_key TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'social',
  icon_key TEXT NOT NULL DEFAULT 'link',
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  open_in_new_tab BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_footer_social_links_enabled ON public.footer_social_links(is_enabled);
CREATE INDEX IF NOT EXISTS idx_footer_social_links_order ON public.footer_social_links(sort_order);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE public.footer_social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS footer_social_links_admin_all ON public.footer_social_links;
CREATE POLICY footer_social_links_admin_all ON public.footer_social_links
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS footer_social_links_public_select ON public.footer_social_links;
CREATE POLICY footer_social_links_public_select ON public.footer_social_links
  FOR SELECT TO public
  USING (is_enabled = true);

-- ----------------------------------------------------------------------------
-- updated_at maintenance (reuses the existing public.set_updated_at trigger fn)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_footer_social_links_updated_at ON public.footer_social_links;
CREATE TRIGGER set_footer_social_links_updated_at
  BEFORE UPDATE ON public.footer_social_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Realtime publication membership (idempotent)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'footer_social_links'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.footer_social_links;
  END IF;
END $$;
