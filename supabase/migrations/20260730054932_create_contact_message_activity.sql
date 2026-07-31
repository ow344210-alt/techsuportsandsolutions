-- =============================================
-- Migration: Create contact message activity audit table
-- Table: public.contact_message_activity
-- =============================================

-- =============================================
-- 1. CREATE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.contact_message_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_contact_message_activity_contact_message_id ON public.contact_message_activity(contact_message_id);
CREATE INDEX IF NOT EXISTS idx_contact_message_activity_admin_user_id ON public.contact_message_activity(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_message_activity_created_at ON public.contact_message_activity(created_at);

-- =============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.contact_message_activity ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. POLICIES
-- =============================================

-- Only admins may select activity records
DROP POLICY IF EXISTS contact_message_activity_select_admin ON public.contact_message_activity;
CREATE POLICY contact_message_activity_select_admin ON public.contact_message_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Only admins may insert activity records
DROP POLICY IF EXISTS contact_message_activity_insert_admin ON public.contact_message_activity;
CREATE POLICY contact_message_activity_insert_admin ON public.contact_message_activity
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- No public access for update or delete
DROP POLICY IF EXISTS contact_message_activity_update_admin ON public.contact_message_activity;
CREATE POLICY contact_message_activity_update_admin ON public.contact_message_activity
  FOR UPDATE USING (false);

DROP POLICY IF EXISTS contact_message_activity_delete_admin ON public.contact_message_activity;
CREATE POLICY contact_message_activity_delete_admin ON public.contact_message_activity
  FOR DELETE USING (false);

-- =============================================
-- 5. HELPER FUNCTION FOR INSERTING ACTIVITY
-- =============================================
CREATE OR REPLACE FUNCTION public.log_contact_message_activity(
  p_contact_message_id UUID,
  p_action TEXT,
  p_admin_user_id UUID DEFAULT NULL,
  p_previous_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_note TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.contact_message_activity (
    contact_message_id,
    admin_user_id,
    action,
    previous_value,
    new_value,
    note
  )
  VALUES (
    p_contact_message_id,
    p_admin_user_id,
    p_action,
    p_previous_value,
    p_new_value,
    p_note
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
