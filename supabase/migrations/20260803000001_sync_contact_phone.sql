-- Sync the primary contact phone row that public components read.
-- The admin previously saved the new number into `contact.phone` and
-- `contact-info.emergency_phone`, but the Footer, ContactInfoCard and Contact
-- page all read `contact-info.phone`, which still held the old value.
-- This migration makes the primary phone match the admin's saved number.
UPDATE site_content
SET field_value = '+92 3372579655',
    updated_at = NOW()
WHERE section = 'contact-info'
  AND field_key = 'phone';

-- Keep the `contact.phone` row in sync too so the two sections never diverge.
UPDATE site_content
SET field_value = '+92 3372579655',
    updated_at = NOW()
WHERE section = 'contact'
  AND field_key = 'phone';
