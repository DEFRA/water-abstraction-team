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
  -- The request was for Licence Type (full or transfer). However, we can't find any data that
  -- refers to a type of that has one of these values
  ('UNKNOWN') AS licence_type,
  l.start_date,
  bill_runs.bill_run_number,
  cp.is_section_127_agreement_enabled,
  cv.*
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
-- A licence will have multiple charge versions. As changes are made a new charge version is created. However
-- experience has shown us that the `status` field in the table cannot be trusted so we cannot just grab
-- the one with a status of 'current'. So, we are left with grabbing whichever has the latest version number
-- and using that to identify which charge version is 'current'
INNER JOIN (
  SELECT MAX(cv.version_number) AS latest_version, cv.licence_ref FROM water.charge_versions cv GROUP BY cv.licence_ref
) latest_charge_version ON latest_charge_version.licence_ref = l.licence_ref
INNER JOIN water.charge_versions cv ON (cv.licence_ref = latest_charge_version.licence_ref AND cv.version_number = latest_charge_version.latest_version)
INNER JOIN water.charge_elements ce ON ce.charge_version_id = cv.charge_version_id
INNER JOIN water.charge_purposes cp ON cp.charge_element_id = ce.charge_element_id
WHERE cv.date_created >= '2022-04-01'
```
