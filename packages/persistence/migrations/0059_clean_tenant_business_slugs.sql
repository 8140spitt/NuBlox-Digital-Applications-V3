CREATE TEMPORARY TABLE legacy_tenant_slug_rewrites AS
SELECT
  t.id AS tenant_id,
  t.slug AS old_slug,
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(t.slug, '-[0-9a-f]{8}$', ''),
      '[^a-z0-9]',
      ''
    )
  ) AS new_slug
FROM tenants t
WHERE t.slug REGEXP '-[0-9a-f]{8}$';

UPDATE tenants t
JOIN legacy_tenant_slug_rewrites r
  ON r.tenant_id = t.id
LEFT JOIN tenants conflict
  ON conflict.slug = r.new_slug
 AND conflict.id <> t.id
SET t.slug = r.new_slug
WHERE conflict.id IS NULL
  AND CHAR_LENGTH(r.new_slug) BETWEEN 3 AND 80
  AND r.new_slug NOT IN (
    'about','api','app','assets','auth','candidate','careers','contact','docs',
    'enterprise','functions','industries','legal','login','logout','pricing',
    'privacy','product','public','register','security','status','support','terms'
  );

DROP TEMPORARY TABLE legacy_tenant_slug_rewrites;
