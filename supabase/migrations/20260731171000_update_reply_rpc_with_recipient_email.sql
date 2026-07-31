DROP FUNCTION IF EXISTS public.create_contact_message_reply(UUID, TEXT, TEXT);

CREATE FUNCTION public.create_contact_message_reply(
  p_contact_message_id UUID,
  p_subject TEXT,
  p_message TEXT,
  p_recipient_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_email TEXT;
  v_admin_name TEXT;
  v_reply_id UUID;
BEGIN
  SELECT
    u.id,
    u.email::text,
    NULLIF(
      COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        ''
      )::text,
      ''
    )
  INTO v_admin_id, v_admin_email, v_admin_name
  FROM auth.users u
  WHERE u.id = auth.uid();

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = v_admin_id
      AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reply to contact messages.';
  END IF;

  IF p_contact_message_id IS NULL
     OR p_subject IS NULL OR btrim(p_subject) = ''
     OR p_message IS NULL OR btrim(p_message) = ''
     OR p_recipient_email IS NULL OR btrim(p_recipient_email) = '' THEN
    RAISE EXCEPTION 'Contact message id, subject, message, and recipient email are required.';
  END IF;

  INSERT INTO public.contact_message_replies (
    contact_message_id,
    admin_user_id,
    admin_email,
    admin_name,
    recipient_email,
    subject,
    message,
    delivery_status
  )
  VALUES (
    p_contact_message_id,
    v_admin_id,
    v_admin_email,
    v_admin_name,
    p_recipient_email,
    p_subject,
    p_message,
    'pending'
  )
  RETURNING id INTO v_reply_id;

  RETURN v_reply_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_contact_message_reply(UUID, TEXT, TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_contact_message_reply(UUID, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.create_contact_message_reply(UUID, TEXT, TEXT, TEXT) TO authenticated;