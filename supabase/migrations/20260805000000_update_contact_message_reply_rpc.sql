-- ============================================================================
-- Migration: Admin update_contact_message_reply RPC
--
-- Lets an authenticated, enabled admin edit the subject/message of a reply
-- that has NOT been delivered yet:
--   * delivery_status IN ('pending', 'failed') -> editable
--   * 'processing'                             -> atomically rejected (the
--     UPDATE predicate does not match, so a race with the edge function can
--     never be edited mid-send)
--   * 'sent'                                   -> rejected (immutable)
--
-- When an edit succeeds the reply is reset for re-sending:
--   * delivery_status -> 'pending'
--   * error_message   -> NULL
--   * provider_message_id / sent_at / email_provider -> NULL
--
-- Security: SECURITY DEFINER with an explicit search_path, an auth.uid()
-- check, an admin + is_disabled guard (stronger than the legacy
-- create_contact_message_reply which does not check is_disabled), trimmed
-- non-empty validation, control-character stripping consistent with the
-- sending flow, and REVOKE/GRANT so only authenticated users can call it.
-- Table-level grants are untouched (RLS on contact_message_replies still
-- governs direct reads/writes).
--
-- Length limits (subject 150 / message 5000) are new "reasonable" caps; the
-- reply table previously had no constraints and the UI previously had no
-- maxLength, so nothing existing is tightened beyond sensible bounds.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_contact_message_reply(
  p_reply_id UUID,
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
  v_clean_subject TEXT;
  v_clean_message TEXT;
  v_updated_id UUID;
BEGIN
  SELECT u.id
  INTO v_admin_id
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = v_admin_id
      AND profiles.role = 'admin'
      AND profiles.is_disabled IS NOT TRUE
  ) THEN
    RAISE EXCEPTION 'Only enabled admins can edit replies.';
  END IF;

  IF p_reply_id IS NULL THEN
    RAISE EXCEPTION 'Reply id is required.';
  END IF;

  -- Strip header-injection control characters from the subject (single line)
  -- and NUL bytes from the message while keeping legitimate line breaks.
  v_clean_subject := replace(replace(btrim(p_subject), chr(10), ''), chr(13), '');
  v_clean_subject := replace(v_clean_subject, chr(0), '');
  v_clean_message := btrim(replace(p_message, chr(0), ''));

  IF v_clean_subject = '' THEN
    RAISE EXCEPTION 'Subject is required.';
  END IF;

  IF v_clean_message = '' THEN
    RAISE EXCEPTION 'Message is required.';
  END IF;

  IF length(v_clean_subject) > 150 THEN
    RAISE EXCEPTION 'Subject must be 150 characters or fewer.';
  END IF;

  IF length(v_clean_message) > 5000 THEN
    RAISE EXCEPTION 'Message must be 5000 characters or fewer.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.contact_message_replies
    WHERE id = p_reply_id
  ) THEN
    RAISE EXCEPTION 'Reply record not found.';
  END IF;

  UPDATE public.contact_message_replies
  SET subject = v_clean_subject,
      message = v_clean_message,
      delivery_status = 'pending',
      error_message = NULL,
      provider_message_id = NULL,
      sent_at = NULL,
      email_provider = NULL
  WHERE id = p_reply_id
    AND delivery_status IN ('pending', 'failed')
  RETURNING id INTO v_updated_id;

  IF v_updated_id IS NULL THEN
    RAISE EXCEPTION 'Only pending or failed replies can be edited.';
  END IF;

  RETURN v_updated_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_contact_message_reply(UUID, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_contact_message_reply(UUID, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.update_contact_message_reply(UUID, TEXT, TEXT) TO authenticated;
