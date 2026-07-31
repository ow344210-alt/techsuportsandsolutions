-- =============================================
-- Migration: Add structured content columns to site_content
-- =============================================

-- Add new columns for page-section architecture
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'page_key'
  ) THEN
    ALTER TABLE site_content ADD COLUMN page_key TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'section_key'
  ) THEN
    ALTER TABLE site_content ADD COLUMN section_key TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'title'
  ) THEN
    ALTER TABLE site_content ADD COLUMN title TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'subtitle'
  ) THEN
    ALTER TABLE site_content ADD COLUMN subtitle TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'description'
  ) THEN
    ALTER TABLE site_content ADD COLUMN description TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'body'
  ) THEN
    ALTER TABLE site_content ADD COLUMN body TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE site_content ADD COLUMN image_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'image_alt'
  ) THEN
    ALTER TABLE site_content ADD COLUMN image_alt TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'button_text'
  ) THEN
    ALTER TABLE site_content ADD COLUMN button_text TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'button_url'
  ) THEN
    ALTER TABLE site_content ADD COLUMN button_url TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE site_content ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_content' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE site_content ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- Backfill page_key and section_key from existing section and field_key
-- Map common sections to pages
UPDATE site_content
SET
  page_key = CASE
    WHEN section IN ('hero', 'stats', 'services', 'cta-banner', 'navbar') THEN 'home'
    WHEN section IN ('about', 'about-preview', 'achievements', 'core-values', 'leadership', 'why-started', 'company-culture', 'future-goals', 'why-clients-trust', 'mission-vision', 'timeline', 'process', 'why-choose-us') THEN 'about'
    WHEN section IN ('contact', 'contact-info', 'contact-faq', 'faq') THEN 'contact'
    WHEN section IN ('footer', 'projects', 'testimonials', 'portfolio') THEN 'home'
    ELSE 'home'
  END,
  section_key = section
WHERE page_key IS NULL;

-- Set display_order based on common section ordering
UPDATE site_content
SET display_order = CASE section
  WHEN 'hero' THEN 0
  WHEN 'stats' THEN 1
  WHEN 'services' THEN 2
  WHEN 'why-choose-us' THEN 3
  WHEN 'about-preview' THEN 4
  WHEN 'about' THEN 5
  WHEN 'achievements' THEN 6
  WHEN 'core-values' THEN 7
  WHEN 'leadership' THEN 8
  WHEN 'timeline' THEN 9
  WHEN 'process' THEN 10
  WHEN 'contact' THEN 11
  WHEN 'contact-info' THEN 12
  WHEN 'faq' THEN 13
  WHEN 'contact-faq' THEN 14
  WHEN 'cta-banner' THEN 15
  WHEN 'footer' THEN 16
  WHEN 'navbar' THEN 17
  ELSE 99
END
WHERE display_order = 0;

-- Create index for page_key
CREATE INDEX IF NOT EXISTS idx_site_content_page_key ON site_content(page_key);

-- Create index for section_key
CREATE INDEX IF NOT EXISTS idx_site_content_section_key ON site_content(section_key);

-- Create index for is_published
CREATE INDEX IF NOT EXISTS idx_site_content_published ON site_content(is_published);
