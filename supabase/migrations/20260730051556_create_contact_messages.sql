-- =============================================
-- Migration: Create professional contact inquiry system
-- Table: public.contact_messages
-- =============================================

-- =============================================
-- 1. DROP EXISTING TABLE IF STRUCTURE MISMATCHES
-- =============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'contact_messages'
  ) THEN
    -- Check if the table has the expected columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'contact_messages'
        AND column_name = 'priority'
    ) THEN
      DROP TABLE public.contact_messages CASCADE;
    END IF;
  END IF;
END $$;

-- =============================================
-- 2. CREATE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  service TEXT,
  budget TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'replied', 'resolved', 'spam')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  source TEXT DEFAULT 'website',
  ip_hash TEXT,
  user_agent TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON public.contact_messages(priority);
CREATE INDEX IF NOT EXISTS idx_contact_messages_assigned_to ON public.contact_messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);

-- =============================================
-- 4. UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_messages_updated_at();

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. POLICIES
-- =============================================

-- Public/anonymous users may insert contact messages
DROP POLICY IF EXISTS contact_messages_insert_anon ON public.contact_messages;
CREATE POLICY contact_messages_insert_anon ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- Public users must NOT select, update, or delete contact messages
DROP POLICY IF EXISTS contact_messages_select_public ON public.contact_messages;
CREATE POLICY contact_messages_select_public ON public.contact_messages
  FOR SELECT USING (false);

DROP POLICY IF EXISTS contact_messages_update_public ON public.contact_messages;
CREATE POLICY contact_messages_update_public ON public.contact_messages
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS contact_messages_delete_public ON public.contact_messages;
CREATE POLICY contact_messages_delete_public ON public.contact_messages
  FOR DELETE USING (false);

-- Only admins may select all messages
DROP POLICY IF EXISTS contact_messages_select_admin ON public.contact_messages;
CREATE POLICY contact_messages_select_admin ON public.contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Only admins may update messages
DROP POLICY IF EXISTS contact_messages_update_admin ON public.contact_messages;
CREATE POLICY contact_messages_update_admin ON public.contact_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Only admins may delete messages
DROP POLICY IF EXISTS contact_messages_delete_admin ON public.contact_messages;
CREATE POLICY contact_messages_delete_admin ON public.contact_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- =============================================
-- 7. HELPER FUNCTION FOR ADMIN CONTACT MESSAGES
-- =============================================
CREATE OR REPLACE FUNCTION public.get_contact_messages_for_admin()
RETURNS SETOF public.contact_messages AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RETURN QUERY
    SELECT * FROM public.contact_messages
    ORDER BY created_at DESC;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 8. HELPER FUNCTION FOR INSERTING CONTACT MESSAGES
-- =============================================
CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_full_name TEXT,
  p_email TEXT,
  p_subject TEXT,
  p_message TEXT,
  p_phone TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_service TEXT DEFAULT NULL,
  p_budget TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'website',
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.contact_messages (
    full_name,
    email,
    phone,
    company,
    service,
    budget,
    subject,
    message,
    source,
    ip_hash,
    user_agent
  )
  VALUES (
    p_full_name,
    p_email,
    p_phone,
    p_company,
    p_service,
    p_budget,
    p_subject,
    p_message,
    p_source,
    p_ip_hash,
    p_user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
