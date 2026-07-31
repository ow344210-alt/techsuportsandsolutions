DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contact_message_replies'
      AND column_name = 'recipient_email'
  ) THEN
    ALTER TABLE public.contact_message_replies
      ADD COLUMN recipient_email TEXT NOT NULL DEFAULT '';
  END IF;
END $$;