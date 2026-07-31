-- =============================================
-- Migration: Scope rate limit INSERT/UPDATE RLS policies to service_role
-- Least-privilege hardening: public roles should not write rate limit rows
-- The submit-contact edge function writes via the service role (RLS bypassed)
-- =============================================

DROP POLICY IF EXISTS contact_msg_rl_insert_service ON public.contact_message_rate_limits;
DROP POLICY IF EXISTS contact_msg_rl_update_service ON public.contact_message_rate_limits;

CREATE POLICY contact_msg_rl_insert_service ON public.contact_message_rate_limits
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY contact_msg_rl_update_service ON public.contact_message_rate_limits
  FOR UPDATE TO service_role WITH CHECK (true);
