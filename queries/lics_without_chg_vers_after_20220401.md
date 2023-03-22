# Licences without charge versions created after 2022-04-01

- **Business**
- **2023-04-23**
- [WATER-3901](https://eaflood.atlassian.net/browse/WATER-3901)

> There are 3 reports in the service which are used to aid the business is calculating impact of changes to schemes and accruing any un-billed sums into the following Financial Year. Due to the timings of Supplementary Billing, we will need to accrue anything yet to be billed into the following year.
>
> There are 2 reports required, each can be provided as a data dump upon request from the Business, rather than needing full front end solutions.
>
> Report 2:
>
> For all licences (Live and Dead) with a confirmed charge version created on or after 1/4/2022 provide:
>
> - Licence Number
> - Licence Status
> - effective start date
> - Effective end date if not live (revoked, lapsed or expired date)
> - Detail 1 line per charge category (and or purpose) containing all fields from the charge version
> - Include additional field to show if an agreement is in effect
> - Agreement type in effect (eg 2PT)
> - Y/N Indicator to show if Licence is in Workflow
> - Workflow status (to set up, in review)

## Query

```sql
SELECT
  l.licence_ref,
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
  END) AS effective_end_date,
  (agreements.agreement_codes) AS licence_agreements,
  (cvw.status) AS workflow_status
FROM water.licences l
-- Some licences have special agreements linked to them. `financial_agreement_types` is the lookup table
-- and `licence_agreements` is the join table. A licence can have multiple agreements but the request was
-- to see them in listed as a single value. So, we use the PostgreSQL STRING_AGG() function to concatenate
-- the codes from multiple licence_agreements rows into one result.
-- Note: Some licences return what appears to be duplicates, for example AN/031/0014/056 will return 'S127|S127'.
-- This is because there will be 2 `licence_agreements` rows for the same licence and agreement type. Neither
-- will have an end date, but one will have superceded the other based on start_date. This is easy enough to
-- handle with code in the UI. But resolving it would add unnecessary complexity in SQL to what is intended to
--  be an ad-hoc query.
LEFT JOIN (
  SELECT
    la.licence_ref,
    STRING_AGG(fat.financial_agreement_code, '|') AS agreement_codes
  FROM water.licence_agreements la
  INNER JOIN water.financial_agreement_types fat ON fat.financial_agreement_type_id = la.financial_agreement_type_id
  WHERE (la.end_date IS NULL) OR la.end_date >= NOW()
  GROUP BY la.licence_ref
) agreements ON agreements.licence_ref = l.licence_ref
LEFT JOIN water.charge_version_workflows cvw ON cvw.licence_id = l.licence_id
WHERE l.licence_id NOT IN (
  SELECT cv.licence_id FROM water.charge_versions cv WHERE cv.start_date >= '2022-04-01'
)
```
