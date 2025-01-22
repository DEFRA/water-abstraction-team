# Water Company licences without return versions

- **Business**
- **2025-01-22**
- [WATER-4880](https://eaflood.atlassian.net/browse/WATER-4880)

> This report generates a list of all water companies (water undertakers) licences that do not have a return version.
>
> We want to have the business check each of this licences before we migrate all licences with return versions to
> quarterly.

## Query

```sql
SELECT
  l.licence_ref,
  l.expired_date,
  l.lapsed_date,
  l.revoked_date,
  l.regions->'regionalChargeArea' AS regionalChargeArea
FROM public.licences l
WHERE l.water_undertaker = true
and l.id NOT IN (SELECT rv.licence_id FROM public.return_versions rv)
```

