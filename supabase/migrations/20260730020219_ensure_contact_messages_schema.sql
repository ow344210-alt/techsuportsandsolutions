-- =============================================
-- Migration: Ensure contact_messages table has required schema
-- =============================================

-- =============================================
-- 1. ENSURE COLUMNS EXIST
-- =============================================

DO $$
BEGIN
    -- full_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
    END IF;

    -- email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'email'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN email TEXT NOT NULL DEFAULT '';
    END IF;

    -- phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN phone TEXT;
    END IF;

    -- company
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'company'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN company TEXT;
    END IF;

    -- service
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'service'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN service TEXT;
    END IF;

    -- budget
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'budget'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN budget TEXT;
    END IF;

    -- subject
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'subject'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN subject TEXT NOT NULL DEFAULT '';
    END IF;

    -- message
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'message'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN message TEXT NOT NULL DEFAULT '';
    END IF;

    -- status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN status TEXT NOT NULL DEFAULT 'new';
    END IF;

    -- priority
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
    END IF;

    -- assigned_to
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- admin_notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN admin_notes TEXT;
    END IF;

    -- source
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'source'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN source TEXT DEFAULT 'website';
    END IF;

    -- ip_hash
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'ip_hash'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN ip_hash TEXT;
    END IF;

    -- user_agent
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN user_agent TEXT;
    END IF;

    -- replied_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'replied_at'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN replied_at TIMESTAMPTZ;
    END IF;

    -- created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;

    -- updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END
$$;

-- =============================================
-- 2. ENSURE CHECK CONSTRAINTS EXIST
-- =============================================

DO $$
BEGIN
    -- status constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'contact_messages'
          AND constraint_name = 'contact_messages_status_check'
    ) THEN
        ALTER TABLE public.contact_messages
        ADD CONSTRAINT contact_messages_status_check
        CHECK (status IN ('new', 'in_progress', 'replied', 'resolved', 'spam'));
    END IF;

    -- priority constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'contact_messages'
          AND constraint_name = 'contact_messages_priority_check'
    ) THEN
        ALTER TABLE public.contact_messages
        ADD CONSTRAINT contact_messages_priority_check
        CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END
$$;

-- =============================================
-- 3. ENSURE INDEXES EXIST
-- =============================================

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON public.contact_messages(priority);
CREATE INDEX IF NOT EXISTS idx_contact_messages_assigned_to ON public.contact_messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);

-- =============================================
-- 4. ENSURE UPDATED_AT TRIGGER FUNCTION EXISTS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_contact_messages_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- =============================================
-- 5. ENSURE UPDATED_AT TRIGGER EXISTS
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_contact_messages_updated_at'
          AND tgrelid = 'public.contact_messages'::regclass
    ) THEN
        CREATE TRIGGER update_contact_messages_updated_at
        BEFORE UPDATE ON public.contact_messages
        FOR EACH ROW
        EXECUTE FUNCTION public.update_contact_messages_updated_at();
    END IF;
END $$;
-- ===========================================

-- =============================================
-- 6. ENABLE ROW LEVEL SECURITY (if not already)
-- =============================================

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. ENSURE POLICIES EXIST
-- =============================================

-- Insert policy for public/anonymous users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_messages'
          AND policyname = 'contact_messages_insert_anon'
    ) THEN
        CREATE POLICY contact_messages_insert_anon ON public.contact_messages
            FOR INSERT
            WITH CHECK (true);
    END IF;
END $$;
-- Select policy for public users (deny all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_messages'
          AND policyname = 'contact_messages_select_public'
    ) THEN
        CREATE POLICY contact_messages_select_public ON public.contact_messages
            FOR SELECT
            USING (false);
    END IF;
END $$;
-- Update policy for public users (deny all)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_messages'
          AND policyname = 'contact_messages_update_public'
    ) THEN
        CREATE POLICY contact_messages_update_public ON public.contact_messages
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
          AND tablename = 'contact_messages'
          AND policyname = 'contact_messages_delete_public'
    ) THEN
        CREATE POLICY contact_messages_delete_public ON public.contact_messages
            FOR DELETE
            USING (false);
    END IF;
END $$;
-- Select policy for admins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_messages'
          AND policyname = 'contact_messages_select_admin'
    ) THEN
        CREATE POLICY contact_messages_select_admin ON public.contact_messages
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
-- Update policy for admins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_messages'
          AND policyname = 'contact_messages_update_admin'
    ) THEN
        CREATE POLICY contact_messages_update_admin ON public.contact_messages
            FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;
-- Delete policy for admins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'contact_messages'
          AND policyname = 'contact_messages_delete_admin'
    ) THEN
        CREATE POLICY contact_messages_delete_admin ON public.contact_messages
            FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                      AND profiles.role = 'admin'
                )
            );
    END IF;
END $$;
-- =============================================
-- 8. COMMENT
-- =============================================

COMMENT ON TABLE public.contact_messages IS 'Professional contact inquiry system with RLS and audit support.';
