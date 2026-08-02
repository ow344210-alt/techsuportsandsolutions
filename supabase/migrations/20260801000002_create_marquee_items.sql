-- ============================================================================
-- Marquee items table for the upcoming public Marquee sections.
--
--   - Admin (authenticated + is_admin()) can manage rows.
--   - Public (anon/authenticated) can only read active rows.
--   - Table is added to the supabase_realtime publication so admin dashboards
--     can live-refresh without polling.
--
-- Incremental + idempotent: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT
-- EXISTS, DROP/CREATE policy and trigger pairs. No table is ever dropped.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.marquee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  row TEXT NOT NULL DEFAULT 'left' CHECK (row IN ('left', 'right')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marquee_items_active ON public.marquee_items(is_active);
CREATE INDEX IF NOT EXISTS idx_marquee_items_order ON public.marquee_items(row, order_index);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE public.marquee_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marquee_items_admin_all ON public.marquee_items;
CREATE POLICY marquee_items_admin_all ON public.marquee_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS marquee_items_public_select ON public.marquee_items;
CREATE POLICY marquee_items_public_select ON public.marquee_items
  FOR SELECT TO public
  USING (is_active = true);

-- ----------------------------------------------------------------------------
-- updated_at maintenance (reuses the existing public.set_updated_at trigger fn)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_marquee_items_updated_at ON public.marquee_items;
CREATE TRIGGER set_marquee_items_updated_at
  BEFORE UPDATE ON public.marquee_items
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
      AND tablename = 'marquee_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.marquee_items;
  END IF;
END $$;
