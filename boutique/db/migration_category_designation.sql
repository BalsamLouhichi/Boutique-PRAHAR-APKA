-- Replace category slugs with designations and remove display ordering.
ALTER TABLE categories RENAME COLUMN slug TO designation;
ALTER TABLE categories DROP COLUMN IF EXISTS display_order;