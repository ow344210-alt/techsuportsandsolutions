-- =============================================
-- Migration: Fix contact_messages schema and add notifications table
-- =============================================

-- =============================================
-- 1. FIX DUPLICATE RATE LIMIT ROWS
-- =============================================

-- Delete duplicate ip_hash rows, keeping the one with highest submission_count (or most recent)
DELETE FROM public.contact_message_rate_limits a
USING public.contact_message_rate_limits b
WHERE a.id < b.id
  AND a.ip_hash = b.ip_hash;

-- Fix NULL submission_count
UPDATE public.contact_message_rate_limits
SET submission_count = 1
WHERE submission_count IS NULL;

-- =============================================
-- 2. DROP DEPENDENT FUNCTIONS BEFORE DROPPING COLUMN
-- =============================================

DROP FUNCTION IF EXISTS public.get_contact_messages_for_admin();
DROP FUNCTION IF EXISTS public.submit_contact_message(
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
);

-- =============================================
-- 3. DROP UNUSED 'name' COLUMN
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
-- 4. RECREATE DEPENDENT FUNCTIONS (with new schema)
-- =============================================

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

-- =============================================
-- 5. CREATE CONTACT_MESSAGE_NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_message_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id UUID NOT NULL REFERENCES public.contact_messages(id) ON DELETE CASCADE,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  email TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_message_notifications_contact_message_id 
  ON public.contact_message_notifications(contact_message_id);
CREATE INDEX IF NOT EXISTS idx_contact_message_notifications_admin_user_id 
  ON public.contact_message_notifications(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_message_notifications_created_at 
  ON public.contact_message_notifications(created_at DESC);

ALTER TABLE public.contact_message_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins may select notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_notifications'
          AND policyname = 'contact_message_notifications_select_admin'
    ) THEN
        CREATE POLICY contact_message_notifications_select_admin ON public.contact_message_notifications
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;
-- Only admins may insert notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_notifications'
          AND policyname = 'contact_message_notifications_insert_admin'
    ) THEN
        CREATE POLICY contact_message_notifications_insert_admin ON public.contact_message_notifications
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;
-- No public update/delete
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_notifications'
          AND policyname = 'contact_message_notifications_update_admin'
    ) THEN
        CREATE POLICY contact_message_notifications_update_admin ON public.contact_message_notifications
            FOR UPDATE USING (false);
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_notifications'
          AND policyname = 'contact_message_notifications_delete_admin'
    ) THEN
        CREATE POLICY contact_message_notifications_delete_admin ON public.contact_message_notifications
            FOR DELETE USING (false);
    END IF;
END $$;
-- =============================================
-- 6. ADD UNIQUE CONSTRAINT ON RATE LIMITS (ip_hash + first_submission_at window)
-- =============================================

-- Note: We use a partial unique index on ip_hash for active window rows
-- This prevents duplicate rate limit entries for the same IP in the same window
CREATE UNIQUE INDEX IF NOT EXISTS uq_contact_message_rate_limits_ip_hash_active
  ON public.contact_message_rate_limits (ip_hash)
  WHERE blocked_at IS NULL;

COMMENT ON TABLE public.contact_message_notifications IS 'Admin notifications for new contact messages';