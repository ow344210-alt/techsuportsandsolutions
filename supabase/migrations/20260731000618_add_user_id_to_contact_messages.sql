DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contact_messages'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.contact_messages ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;
