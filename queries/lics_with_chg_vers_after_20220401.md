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
  cv.charge_version_id,
  cv.start_date,
  cv.end_date,
  bill_runs.bill_run_number,
  ce.charge_element_id,
  bcc.reference,
  ce.description,
  ce."source",
  ce.loss,
  ce.is_restricted_source,
  ce.water_model,
  ce.volume,
  ce.eiuc_region,
  (ce.additional_charges->>'isSupplyPublicWater') AS add_supply_public_water,
  (ce.additional_charges->'supportedSource'->>'name') AS add_supported_source_name,
  (ce.adjustments->>'s126') AS adj_s126,
  (ce.adjustments->>'s127') AS adj_s127,
  (ce.adjustments->>'s130') AS adj_s130,
  (ce.adjustments->>'charge') AS adj_charge,
  (ce.adjustments->>'winter') AS adj_winter,
  (ce.adjustments->>'aggregate') AS adj_aggregate,
  cp.charge_purpose_id,
  cp.description,
  cp.abstraction_period_start_day,
  cp.abstraction_period_start_month,
  cp.abstraction_period_end_day,
  cp.abstraction_period_end_month,
  cp.authorised_annual_quantity,
  cp.billable_annual_quantity,
  cp.loss,
  cp.is_section_127_agreement_enabled
FROM water.licences l
-- Some licences have special agreements linked to them. `financial_agreement_types` is the lookup table
-- and `licence_agreements` is the join table. A licence can have multiple agreements but the request was
-- to see them in listed as a single value. So, we use the PostgreSQL STRING_AGG() function to concatenate
-- the codes from multiple licence_agreements rows into one result.
-- Note: Some licences return what appears to be duplicates, for example AN/031/0014/056 will return 'S127|S127'.
-- This is because there will be 2 `licence_agreements` rows for the same licence and agreement type. Neither
-- will have an end date, but one will have superceded the other based on start_date. This is easy enough to
-- handle with code in the UI. But resolving it would add unnecessary complexity in SQL to what is intended to
-- be an ad-hoc query.
LEFT JOIN (
  SELECT
    la.licence_ref,
    STRING_AGG(fat.financial_agreement_code, '|') AS agreement_codes
  FROM water.licence_agreements la
  INNER JOIN water.financial_agreement_types fat ON fat.financial_agreement_type_id = la.financial_agreement_type_id
  WHERE (la.end_date IS NULL) OR la.end_date >= NOW()
  GROUP BY la.licence_ref
) agreements ON agreements.licence_ref = l.licence_ref
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
INNER JOIN water.charge_versions cv ON cv.licence_id = l.licence_id
INNER JOIN water.charge_elements ce ON ce.charge_version_id = cv.charge_version_id
INNER JOIN water.billing_charge_categories bcc ON bcc.billing_charge_category_id = ce.billing_charge_category_id
INNER JOIN water.charge_purposes cp ON cp.charge_element_id = ce.charge_element_id
WHERE cv.start_date >= '2022-04-01'
```
