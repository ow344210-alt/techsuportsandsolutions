-- =============================================
-- Migration: Fix get_all_users + wire up contact message reply system
--
-- 1. Fix public.get_all_users() so the RPC actually returns rows.
--    The previous version returned "structure of query does not match
--    function result type" (42804) because auth.users.email is varchar
--    while the declared return type was text. Also added an admin-only
--    guard (matching get_contact_messages_for_admin) and proper grants.
--
-- 2. Create public.create_contact_message_reply(...) RPC used by the
--    dashboard reply modal. The function did not exist in the database,
--    so replying always failed with PGRST202.
--
-- 3. Add missing admin_email / admin_name columns to
--    public.contact_message_replies and lock the table down with
--    admin-only RLS policies.
-- =============================================

-- =============================================
-- 1. FIX get_all_users
-- =============================================

CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  is_disabled BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  ) THEN
    RETURN QUERY
    SELECT
      p.id,
      COALESCE(u.email::text, ''),
      p.role::text,
      p.is_disabled,
      p.created_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    ORDER BY p.created_at DESC;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_all_users() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_all_users() FROM public;
GRANT EXECUTE ON FUNCTION public.get_all_users() TO authenticated;

-- =============================================
-- 2. ENSURE contact_message_replies HAS REQUIRED COLUMNS
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_message_replies'
      AND column_name = 'admin_email'
  ) THEN
    ALTER TABLE public.contact_message_replies ADD COLUMN admin_email TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_message_replies'
      AND column_name = 'admin_name'
  ) THEN
    ALTER TABLE public.contact_message_replies ADD COLUMN admin_name TEXT;
  END IF;
END $$;

-- =============================================
-- 3. CREATE create_contact_message_reply RPC
-- =============================================

CREATE OR REPLACE FUNCTION public.create_contact_message_reply(
  p_contact_message_id UUID,
  p_subject TEXT,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT;
  v_admin_name TEXT;
  v_reply_id UUID;
BEGIN
  SELECT
    u.id,
    u.email::text,
    NULLIF(
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        ''
      )::text,
      ''
    )
  INTO v_admin_id, v_admin_email, v_admin_name
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = v_admin_id
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reply to contact messages.';
  END IF;

  IF p_contact_message_id IS NULL
     OR p_subject IS NULL OR btrim(p_subject) = ''
     OR p_message IS NULL OR btrim(p_message) = '' THEN
    RAISE EXCEPTION 'Contact message id, subject and message are required.';
  END IF;

  INSERT INTO public.contact_message_replies (
    contact_message_id,
    admin_user_id,
    admin_email,
    admin_name,
    subject,
    message,
    delivery_status
  )
  VALUES (
    p_contact_message_id,
    v_admin_id,
    v_admin_email,
    v_admin_name,
    p_subject,
    p_message,
    'pending'
  )
  RETURNING id INTO v_reply_id;

  RETURN v_reply_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_contact_message_reply(UUID, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_contact_message_reply(UUID, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.create_contact_message_reply(UUID, TEXT, TEXT) TO authenticated;

-- =============================================
-- 4. LOCK DOWN contact_message_replies WITH RLS
-- =============================================

ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_message_replies_select_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_select_admin ON public.contact_message_replies
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS contact_message_replies_insert_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_insert_admin ON public.contact_message_replies
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS contact_message_replies_update_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_update_admin ON public.contact_message_replies
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS contact_message_replies_delete_admin ON public.contact_message_replies;
CREATE POLICY contact_message_replies_delete_admin ON public.contact_message_replies
  FOR DELETE USING (public.is_admin());

-- =============================================
-- 5. REALTIME PUBLICATION FOR REPLY STATUS
-- =============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_message_replies;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
