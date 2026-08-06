-- Rewrite the public footer description to a concise, professional paragraph
-- that fills roughly six visual lines on desktop. This keeps the Brand column
-- visually balanced with the six-row Services, Quick Links, and Contact
-- columns while preserving the company's existing information and meaning.
UPDATE site_content
SET field_value = 'Tech Supports & Solutions builds and maintains websites, mobile applications, and reliable business software for startups and growing companies. Based in Karachi, we provide practical technology solutions and trusted, ongoing support to clients worldwide — from initial planning through launch and beyond.',
    updated_at = NOW()
WHERE section = 'footer'
  AND field_key = 'description';
