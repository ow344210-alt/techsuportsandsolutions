-- =============================================
-- Migration: Ensure contact_message_activity table has required schema
-- =============================================

-- =============================================
-- 1. ENSURE TABLE EXISTS
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_message_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_message_id UUID,
  admin_user_id UUID,
  action TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. ENSURE COLUMNS EXIST (in case table existed with fewer columns)
-- =============================================

DO $$
BEGIN
    -- contact_message_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND column_name = 'contact_message_id'
    ) THEN
        ALTER TABLE public.contact_message_activity ADD COLUMN contact_message_id UUID;
    END IF;

    -- admin_user_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND column_name = 'admin_user_id'
    ) THEN
        ALTER TABLE public.contact_message_activity ADD COLUMN admin_user_id UUID;
    END IF;

    -- action
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND column_name = 'action'
    ) THEN
        ALTER TABLE public.contact_message_activity ADD COLUMN action TEXT NOT NULL DEFAULT '';
    END IF;

    -- previous_value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND column_name = 'previous_value'
    ) THEN
        ALTER TABLE public.contact_message_activity ADD COLUMN previous_value JSONB;
    END IF;

    -- new_value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND column_name = 'new_value'
    ) THEN
        ALTER TABLE public.contact_message_activity ADD COLUMN new_value JSONB;
    END IF;

    -- note
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND column_name = 'note'
    ) THEN
        ALTER TABLE public.contact_message_activity ADD COLUMN note TEXT;
    END IF;

    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.contact_message_activity ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

-- =============================================
-- 3. ENSURE FOREIGN KEYS EXIST
-- =============================================

DO $$
BEGIN
    -- FK to contact_messages
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'contact_message_activity_contact_message_id_fkey'
    ) THEN
        ALTER TABLE public.contact_message_activity
        ADD CONSTRAINT contact_message_activity_contact_message_id_fkey
        FOREIGN KEY (contact_message_id) REFERENCES public.contact_messages(id) ON DELETE CASCADE;
    END IF;

    -- FK to auth.users
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'contact_message_activity'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'contact_message_activity_admin_user_id_fkey'
    ) THEN
        ALTER TABLE public.contact_message_activity
        ADD CONSTRAINT contact_message_activity_admin_user_id_fkey
        FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- =============================================
-- 4. ENSURE INDEXES EXIST
-- =============================================

CREATE INDEX IF NOT EXISTS idx_contact_message_activity_contact_message_id ON public.contact_message_activity(contact_message_id);
CREATE INDEX IF NOT EXISTS idx_contact_message_activity_admin_user_id ON public.contact_message_activity(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_contact_message_activity_created_at ON public.contact_message_activity(created_at);

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY (if not already)
-- =============================================

ALTER TABLE public.contact_message_activity ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. ENSURE POLICIES EXIST
-- =============================================

-- Select policy for admins only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_activity'
          AND policyname = 'contact_message_activity_select_admin'
    ) THEN
        CREATE POLICY contact_message_activity_select_admin ON public.contact_message_activity
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;
-- Insert policy for admins only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_activity'
          AND policyname = 'contact_message_activity_insert_admin'
    ) THEN
        CREATE POLICY contact_message_activity_insert_admin ON public.contact_message_activity
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;
-- No public access for select, insert, update, delete
-- We explicitly deny public access by creating policies that use false for public users.
-- But note: if we don't create a policy for a role, the default is deny. However, to be explicit and safe, we create policies that deny.

-- Select policy for public users (deny all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_activity'
          AND policyname = 'contact_message_activity_select_public'
    ) THEN
        CREATE POLICY contact_message_activity_select_public ON public.contact_message_activity
            FOR SELECT
            USING (false);
    END IF;
END $$;
-- Insert policy for public users (deny all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_activity'
          AND policyname = 'contact_message_activity_insert_public'
    ) THEN
        CREATE POLICY contact_message_activity_insert_public ON public.contact_message_activity
            FOR INSERT
            WITH CHECK (false);
    END IF;
END $$;
-- Update policy for public users (deny all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_activity'
          AND policyname = 'contact_message_activity_update_public'
    ) THEN
        CREATE POLICY contact_message_activity_update_public ON public.contact_message_activity
            FOR UPDATE
            USING (false);
    END IF;
END $$;
-- Delete policy for public users (deny all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_message_activity'
          AND policyname = 'contact_message_activity_delete_public'
    ) THEN
        CREATE POLICY contact_message_activity_delete_public ON public.contact_message_activity
            FOR DELETE
            USING (false);
    END IF;
END $$;
-- Update policy for admins (if needed, but note: we only allow insert and select per requirements)
-- Since requirements say only admins can select and insert, we do not create update/delete policies for admins.
-- However, to be safe and prevent accidental updates/deletes, we can create policies that deny unless explicitly allowed.
-- But the requirement does not specify update/delete for admins, so we leave them denied by default (no policy allows it).
-- However, note: if there is no policy for update/delete, then no role can perform update/delete (including admins).
-- This matches the requirement: only admins can select and insert.

-- =============================================
-- 7. COMMENT
-- =============================================

COMMENT ON TABLE public.contact_message_activity IS 'Audit log for contact messages, tracking changes and admin actions.';
