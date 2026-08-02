-- Copies FAQ Q&A that admins entered in the Content Manager (site_content
-- section "contact-faq", fields q1/a1..qN/aN) into the faqs table so the
-- public FAQ section and the dashboard FAQs manager read the same data.
-- No-op when the faqs table already has rows for the page.
INSERT INTO faqs (page, question, answer, order_index, is_active)
SELECT
  'contact-faq',
  sc_q.field_value,
  sc_a.field_value,
  t.i,
  true
FROM generate_series(1, 10) AS t(i)
JOIN site_content sc_q
  ON sc_q.section = 'contact-faq'
 AND sc_q.field_key = 'q' || t.i
JOIN site_content sc_a
  ON sc_a.section = 'contact-faq'
 AND sc_a.field_key = 'a' || t.i
WHERE TRIM(sc_q.field_value) <> ''
  AND TRIM(sc_a.field_value) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM faqs WHERE page = 'contact-faq'
  );
