# Charge version last billed bill runs

- **Business**
- **2023-10-09**
- [WATER-4136](https://eaflood.atlassian.net/browse/WATER-4136)

> The B&D team wants a 'billed up to' date against a charge version to help them manage billing. It was something they had in NALD but has been lost in WRLS.

> We think there might be a way to see when a charge version was last billed using the existing data, specifically that the `water.billing_transactions` stores a reference to the `water.charge_elements` it was based on.

## Main query

This is the main query which looks at all charge versions in the service and attempts to identify when it was last included in each of the 3 bill run types.

```sql
SELECT
  results.region,
  results.licence_ref,
  results.charge_version_id,
  results.charge_version_scheme,
  results.charge_version_status,
  results.charge_version_start_date,
  results.charge_version_end_date,
  results.last_annual_billing_batch_id,
  annual_bb.date_created,
  annual_bb.bill_run_number,
  annual_bb.to_financial_year_ending,
  annual_bb.scheme,
  results.last_supplementary_billing_batch_id,
  supple_bb.date_created,
  supple_bb.bill_run_number,
  supple_bb.to_financial_year_ending,
  supple_bb.scheme,
  results.last_twopart_billing_batch_id,
  twoprt_bb.date_created,
  twoprt_bb.bill_run_number,
  twoprt_bb.to_financial_year_ending,
  twoprt_bb.scheme
FROM (
  SELECT
    (r.display_name) AS region,
    cv.licence_ref,
    cv.charge_version_id,
    (cv.scheme) AS charge_version_scheme,
    (cv.status) AS charge_version_status,
    (cv.start_date) AS charge_version_start_date,
    (cv.end_date) AS charge_version_end_date,
    -- From our 3 sub-queries extract the bill run ID for each bill run type. If a charge version has not been included
    -- in a particular type of bill run this will be null.
    (annual.billing_batch_id) AS last_annual_billing_batch_id,
    (supplementary.billing_batch_id) AS last_supplementary_billing_batch_id,
    (twopart.billing_batch_id) AS last_twopart_billing_batch_id
  FROM water.charge_versions cv
  INNER JOIN water.regions r ON r.nald_region_id = cv.region_code
  LEFT JOIN (
    SELECT
      -- Using DISTINCT we would have gotten a de-duped row set of every combination of charge_version and billing
      -- batch (bill run). But we only want the last annual bill run for each charge version. We get this by using
      -- DISTINCT ON which keeps only the first row of each row set. To make this work we have to ensure the row set
      -- is ordered such that the first row is the one we want to retain.
      DISTINCT ON (cv.charge_version_id) cv.charge_version_id, bb.billing_batch_id
    FROM water.billing_transactions bt
    INNER JOIN water.billing_invoice_licences bil ON bil.billing_invoice_licence_id = bt.billing_invoice_licence_id
    INNER JOIN water.billing_invoices bi ON bi.billing_invoice_id = bil.billing_invoice_id
    INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bi.billing_batch_id
    INNER JOIN water.charge_elements ce ON ce.charge_element_id = bt.charge_element_id
    INNER JOIN water.charge_versions cv ON cv.charge_version_id = ce.charge_version_id
    WHERE bb.batch_type = 'annual' AND bb.status = 'sent'
    GROUP BY cv.charge_version_id, bb.billing_batch_id
    ORDER BY cv.charge_version_id, bb.to_financial_year_ending DESC, bb.date_created DESC
  ) annual ON annual.charge_version_id = cv.charge_version_id
  LEFT JOIN (
    SELECT
      -- DISTINCT ON works the same way as covered above except here we are only looking at supplementary
      DISTINCT ON (cv.charge_version_id) cv.charge_version_id, bb.billing_batch_id
    FROM water.billing_transactions bt
    INNER JOIN water.billing_invoice_licences bil ON bil.billing_invoice_licence_id = bt.billing_invoice_licence_id
    INNER JOIN water.billing_invoices bi ON bi.billing_invoice_id = bil.billing_invoice_id
    INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bi.billing_batch_id
    INNER JOIN water.charge_elements ce ON ce.charge_element_id = bt.charge_element_id
    INNER JOIN water.charge_versions cv ON cv.charge_version_id = ce.charge_version_id
    WHERE bb.batch_type = 'supplementary' AND bb.status = 'sent'
    GROUP BY cv.charge_version_id, bb.billing_batch_id
    ORDER BY cv.charge_version_id, bb.to_financial_year_ending DESC, bb.date_created DESC
  ) supplementary ON supplementary.charge_version_id = cv.charge_version_id
  LEFT JOIN (
    SELECT
      -- DISTINCT ON works the same way as covered above except here we are only looking at two-part tariff
      DISTINCT ON (cv.charge_version_id) cv.charge_version_id, bb.billing_batch_id
    FROM water.billing_transactions bt
    INNER JOIN water.billing_invoice_licences bil ON bil.billing_invoice_licence_id = bt.billing_invoice_licence_id
    INNER JOIN water.billing_invoices bi ON bi.billing_invoice_id = bil.billing_invoice_id
    INNER JOIN water.billing_batches bb ON bb.billing_batch_id = bi.billing_batch_id
    INNER JOIN water.charge_elements ce ON ce.charge_element_id = bt.charge_element_id
    INNER JOIN water.charge_versions cv ON cv.charge_version_id = ce.charge_version_id
    WHERE bb.batch_type = 'two_part_tariff' AND bb.status = 'sent'
    GROUP BY cv.charge_version_id, bb.billing_batch_id
    ORDER BY cv.charge_version_id, bb.to_financial_year_ending DESC, bb.date_created DESC
  ) twopart ON twopart.charge_version_id = cv.charge_version_id
) results
-- We join to billing batches 3 times in order to extract details for each type of bill run. We use a left join because
-- a bill run of each type may not exist for the charge version
LEFT JOIN water.billing_batches annual_bb ON annual_bb.billing_batch_id = results.last_annual_billing_batch_id
LEFT JOIN water.billing_batches supple_bb ON supple_bb.billing_batch_id = results.last_supplementary_billing_batch_id
LEFT JOIN water.billing_batches twoprt_bb ON twoprt_bb.billing_batch_id = results.last_twopart_billing_batch_id
ORDER BY region, licence_ref, charge_version_start_date DESC
```

## Verification queries

We created these to help confirm the results we were seeing in the main data query.

### All bill runs for a charge version

This query when given a charge version ID will return all the bill runs it has been linked to ordered by scheme, type and financial year (descending).

Each row in the main query may feature 1 or more bill run (billing batch) IDs. You can use this query to confirm they are 'latest' for each type for a given charge version.

```sql
SELECT
  bb.billing_batch_id,
  bb.batch_type,
  bb.bill_run_number,
  bb.scheme,
  bb.from_financial_year_ending,
  bb.to_financial_year_ending,
  bb.date_created
FROM water.billing_batches bb WHERE bb.status = 'sent' AND bb.billing_batch_id IN (
  SELECT bi.billing_batch_id FROM water.billing_invoices bi WHERE bi.billing_invoice_id IN (
    SELECT bil.billing_invoice_id FROM water.billing_invoice_licences bil WHERE bil.billing_invoice_licence_id IN (
      SELECT bt.billing_invoice_licence_id FROM water.billing_transactions bt WHERE bt.charge_element_id IN (
        SELECT ce.charge_element_id FROM water.charge_elements ce WHERE ce.charge_version_id = 'b923fa80-5a01-4f95-9a54-dc9913f49e46'
      )
    )
  )
)
ORDER BY bb.scheme, bb.batch_type, bb.to_financial_year_ending DESC
```

### All bill runs for a licence

This query when given a licence reference will return all the bill runs it has been linked to ordered by financial year (descending).

Each row in the main query includes the licence reference for the charge version. You can at least verify that the bill runs returned are not for another licence by checking they appear in the results of this query.

```sql
SELECT DISTINCT l.licence_ref, r.display_name, bb.billing_batch_id, bb.bill_run_number, bb.scheme, bb.batch_type, bb.date_created, bb.from_financial_year_ending, bb.to_financial_year_ending FROM water.billing_batches bb
INNER JOIN water.regions r ON r.region_id = bb.region_id
INNER JOIN water.billing_invoices bi ON bi.billing_batch_id = bb.billing_batch_id
INNER JOIN water.billing_invoice_licences bil ON bil.billing_invoice_id = bi.billing_invoice_id
INNER JOIN water.billing_transactions bt ON bt.billing_invoice_licence_id = bt.billing_invoice_licence_id
INNER JOIN water.licences l ON l.licence_id = bil.licence_id
WHERE l.licence_ref = '4/29/01/*G/0003' AND bb.status = 'sent'
ORDER BY bb.to_financial_year_ending DESC
```
