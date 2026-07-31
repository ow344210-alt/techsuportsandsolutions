-- =============================================
-- Migration: Create rate limit tracking for contact messages
-- Uses hashed IPs only - never stores raw IP addresses
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_message_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash TEXT NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  first_submission_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_submission_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_msg_rl_ip_hash ON public.contact_message_rate_limits(ip_hash);
CREATE INDEX IF NOT EXISTS idx_contact_msg_rl_blocked ON public.contact_message_rate_limits(blocked_at);
CREATE INDEX IF NOT EXISTS idx_contact_msg_rl_first_submission ON public.contact_message_rate_limits(first_submission_at);

ALTER TABLE public.contact_message_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_msg_rl_select_admin ON public.contact_message_rate_limits;
CREATE POLICY contact_msg_rl_select_admin ON public.contact_message_rate_limits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS contact_msg_rl_insert_service ON public.contact_message_rate_limits;
CREATE POLICY contact_msg_rl_insert_service ON public.contact_message_rate_limits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS contact_msg_rl_update_service ON public.contact_message_rate_limits;
CREATE POLICY contact_msg_rl_update_service ON public.contact_message_rate_limits
  FOR UPDATE WITH CHECK (true);

DROP POLICY IF EXISTS contact_msg_rl_delete_admin ON public.contact_message_rate_limits;
CREATE POLICY contact_msg_rl_delete_admin ON public.contact_message_rate_limits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.update_contact_message_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_message_rate_limits_updated_at ON public.contact_message_rate_limits;

CREATE TRIGGER update_contact_message_rate_limits_updated_at
  BEFORE UPDATE ON public.contact_message_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_message_rate_limits_updated_at();