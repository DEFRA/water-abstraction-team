# Water Company licences without return versions

- **Business**
- **2025-01-22**
- [WATER-4880](https://eaflood.atlassian.net/browse/WATER-4880)

> This report generates a list of all water companies (water undertakers) that we will be migrating for quarterly returns.
>
> We want to have the business check each of these licences before we migrate all licences with return versions to
> quarterly.

## Query

```sql
SELECT
  licence_data.*,
  (CASE
    WHEN licence_data.needs_migration AND (licence_data.has_existing_rtn_version = FALSE) THEN TRUE
    ELSE FALSE
  END) AS has_issue
FROM (
  SELECT
    r.display_name AS region,
    l.licence_ref,
    (LEAST(l.expired_date, l.lapsed_date, l.revoked_date)) AS end_date,
    EXISTS (SELECT 1 FROM public.return_versions rv1 WHERE rv1.licence_id = l.id) AS has_existing_rtn_version,
    (CASE
      WHEN LEAST(l.expired_date, l.lapsed_date, l.revoked_date) < '2025-04-01' THEN FALSE
      ELSE TRUE
    END) AS needs_migration
  FROM public.licences l
  INNER JOIN public.regions r
    ON r.id = l.region_id
  WHERE
    l.water_undertaker = true
) licence_data
ORDER BY
  licence_data.region,
  licence_data.licence_ref;
```

