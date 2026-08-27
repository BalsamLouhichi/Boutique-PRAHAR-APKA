-- Replace category slugs with slugs and remove display ordering.
ALTER TABLE categories RENAME COLUMN slug TO slug;
ALTER TABLE categories DROP COLUMN IF EXISTS display_order;