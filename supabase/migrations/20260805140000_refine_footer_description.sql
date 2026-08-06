-- Refine the public footer description so it fills roughly six visual lines
-- on desktop (the previous wording wrapped to seven). Meaning is unchanged.
UPDATE site_content
SET field_value = 'Tech Supports & Solutions builds and maintains websites, mobile applications, and reliable business software for startups and growing companies. Based in Karachi, we deliver practical technology solutions with trusted ongoing support to clients worldwide.',
    updated_at = NOW()
WHERE section = 'footer'
  AND field_key = 'description';
