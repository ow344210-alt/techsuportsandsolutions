-- =============================================
-- Migration: Fix contact_messages table - remove unused 'name' column
-- =============================================

-- =============================================
-- 1. DROP DEPENDENT FUNCTIONS FIRST (to avoid dependency issues when dropping column)
-- =============================================

-- Drop dependent functions before dropping column
-- Note: Function DROP requires only name and argument types, not parameter names or defaults
DROP FUNCTION IF EXISTS public.get_contact_messages_for_admin();
DROP FUNCTION IF EXISTS public.submit_contact_message(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

-- =============================================
-- 2. REMOVE UNUSED 'name' COLUMN
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'name'
    ) THEN
        ALTER TABLE public.contact_messages DROP COLUMN name;
    END IF;
END $$;
-- =============================================
-- 3. RECREATE DEPENDENT FUNCTIONS (with new schema)
-- =============================================

-- Recreate get_contact_messages_for_admin
CREATE OR REPLACE FUNCTION public.get_contact_messages_for_admin()
RETURNS SETOF public.contact_messages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
END
$$;

-- Recreate submit_contact_message
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
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
END
$$;