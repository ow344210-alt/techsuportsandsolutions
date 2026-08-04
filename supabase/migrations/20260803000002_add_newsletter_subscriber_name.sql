-- Add an optional real-name field to newsletter subscriptions.
--
-- Why: before this migration, newsletter_subscribers only stored an email, so
-- the dashboard could never show a real subscriber name. The Recent Subscribers
-- card had to derive a display name from the email's local part, which is not a
-- real name. This migration lets future signups capture an optional real name.
--
-- Effect:
--   * Adds a nullable TEXT column `name` to public.newsletter_subscribers.
--   * No NOT NULL / UNIQUE constraint: the name is optional and existing rows
--     keep NULL (the dashboard shows "Name not provided" for them).
--   * No RLS changes required: the existing insert policy
--     (newsletter_subscribers_insert_anon, WITH CHECK true) and the admin policy
--     (newsletter_subscribers_admin_all) already cover the new column for anon
--     inserts and admin reads/writes.
--   * No backfill: we do not invent names for existing email-only records.
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN IF NOT EXISTS name TEXT;

COMMENT ON COLUMN public.newsletter_subscribers.name
  IS 'Optional real name captured from a newsletter signup.';
