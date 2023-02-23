# Licences with charge versions created after 2022-04-01

- **Business**
- **2023-04-23**
- [WATER-3901](https://eaflood.atlassian.net/browse/WATER-3901)

> There are 3 reports in the service which are used to aid the business is calculating impact of changes to schemes and accruing any un-billed sums into the following Financial Year. Due to the timings of Supplementary Billing, we will need to accrue anything yet to be billed into the following year.
>
> There are 2 reports required, each can be provided as a data dump upon request from the Business, rather than needing full front end solutions.
>
> Report 1:
>
> For all licences (Live and Dead) with a confirmed charge version created on or after 1/4/2022 provide:
>
> - Licence Number
> - Licence Status
> - Licence Type (full or transfer)
> - Effective end date if not live (revoked, lapsed or expired date)
> - Detail 1 line per charge category (and or purpose) containing all fields from the the charge version
> - Include additional field to show if an agreement is in effect
> - Agreement type in effect (eg 2PT)
> - Include Y/N field to show if the Annual Bill has been run for the licence

## Query

```sql
SELECT
  l.licence_ref,
  (CASE
    WHEN l.expired_date IS NOT NULL THEN 'expired'
    WHEN l.lapsed_date IS NOT NULL THEN 'lapsed'
    WHEN l.revoked_date IS NOT NULL THEN 'revoked'
    ELSE 'current'
  END) AS licence_status,
  (CASE
    WHEN l.expired_date IS NOT NULL THEN l.expired_date
    WHEN l.lapsed_date IS NOT NULL THEN l.lapsed_date
    WHEN l.revoked_date IS NOT NULL THEN l.revoked_date
  END) AS effective_end_date,
  bill_runs.bill_run_number,
  agreements.agreement_codes,
  bcc.reference,
  ce.*
FROM water.licences l
-- They need to know if the charge version has been included in an annual bill run this financial year.
-- We create a derived table based on the billing data filtered by bill run type, status and financial year.
-- We then link our licences to it
LEFT JOIN (
  SELECT
    bil.licence_id,
    bb.bill_run_number,
    bb.batch_type,
    bb.to_financial_year_ending,
    bb.status
  FROM water.billing_invoice_licences bil
  INNER JOIN water.billing_invoices bi ON bi.billing_invoice_id = bil.billing_invoice_id
  INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bi.billing_batch_id
  WHERE bb.to_financial_year_ending = 2023 AND bb.status = 'sent' AND bb.batch_type = 'annual'
  GROUP BY bil.licence_id, bb.bill_run_number, bb.batch_type, bb.to_financial_year_ending, bb.status
) bill_runs ON bill_runs.licence_id = l.licence_id
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
-- A licence will have multiple charge versions. As changes are made a new charge version is created. However
-- experience has shown us that the `status` field in the table cannot be trusted so we cannot just grab
-- the one with a status of 'current'. So, we are left with grabbing whichever has the latest version number
-- and using that to identify which charge version is 'current'
INNER JOIN (
  SELECT MAX(cv.version_number) AS latest_version, cv.licence_ref FROM water.charge_versions cv GROUP BY cv.licence_ref
) latest_charge_version ON latest_charge_version.licence_ref = l.licence_ref
INNER JOIN water.charge_versions cv ON (cv.licence_ref = latest_charge_version.licence_ref AND cv.version_number = latest_charge_version.latest_version)
INNER JOIN water.charge_elements ce ON ce.charge_version_id = cv.charge_version_id
INNER JOIN water.billing_charge_categories bcc ON bcc.billing_charge_category_id = ce.billing_charge_category_id
INNER JOIN water.charge_purposes cp ON cp.charge_element_id = ce.charge_element_id
WHERE cv.date_created >= '2022-04-01'
```