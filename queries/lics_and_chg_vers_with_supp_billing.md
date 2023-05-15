# Licences and charge versions with the supplementary billing flag set

- **Business**
- **2023-05-05**
- [WATER-4002](https://eaflood.atlassian.net/browse/WATER-4002)

> For all licences (dead & current) that have a supplementary billing flag on them. Find the charge versions (including the charge version ID) and provide:
>
> - Licence ID
> - Licence number
> - Region
> - Licence start date
> - Licence status
> - Licence effective end date
> - Include in supplementary billing
> - Include in SROC supplementary billing
> - Charge version ID
> - Scheme
> - Charge version start date
> - Charge version end date
> - Charge version billed up to date

## Query

```sql
SELECT
  l.licence_id,
  l.licence_ref,
  r.display_name AS region,
  l.start_date AS lic_start_date,
  (CASE
    WHEN l.revoked_date IS NOT NULL THEN 'revoked'
    WHEN l.lapsed_date IS NOT NULL THEN 'lapsed'
    WHEN l.expired_date IS NOT NULL AND l.expired_date < NOW() THEN 'expired'
    ELSE 'current'
  END) AS licence_status,
  (CASE
    WHEN l.revoked_date IS NOT NULL THEN l.revoked_date
    WHEN l.lapsed_date IS NOT NULL THEN l.lapsed_date
    WHEN l.expired_date IS NOT NULL THEN l.expired_date
  END) AS lic_effective_end_date,
  l."include_in_supplementary_billing",
  l.include_in_sroc_supplementary_billing,
  cv.charge_version_id,
  cv.scheme,
  cv.start_date AS cv_start_date,
  cv.end_date AS cv_end_date,
  cv.billed_upto_date
FROM water.licences l
INNER JOIN water.regions r ON l.region_id =r.region_id
-- Some licences are flagged for supplementary billing but have no charge version. The `LEFT JOIN` ensures these are picked up
LEFT JOIN water.charge_versions cv ON l.licence_id = cv.licence_id
WHERE l."include_in_supplementary_billing" = 'yes'
GROUP BY l.licence_id, r.display_name, cv.charge_version_id
```
