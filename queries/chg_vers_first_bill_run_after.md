# Charge version first bill run after

- **Business**
- **2023-10-09**
- [WATER-4136](https://eaflood.atlassian.net/browse/WATER-4136)

> The B&D team wants a 'billed up to' date against a charge version to help them manage billing. It was something they had in NALD but has been lost in WRLS.
>
> We think there might be a way to see what was the first bill run created after a charge version is created by comparing their `date_created` fields.

## Query

```sql
/**
 * For each charge version get details for the first annual and supplementary bill
 * run (billing_batch) created after the charge version with the same scheme and region.
 *
 * The way to understand the query is to follow how the data is built up starting at
 * the centre and then working out. Follow the numbered comments [1] to [5].
 *
 * It is as complex as it is because
 *
 * - we want to identify the bill run with the earliest date created which also matches
 *   the charge version. Functions like MIN() will just return the smallest value in a
 *   table
 * - we wanted to avoid just having first bill run and instead split out first possible
 *   annual from first possible supplementary
 * - we wanted every charge version to have a single entry in the results and display
 *   details for both annual and supplementary in the same entry
 */

-- [5] Bring the subquery data which returns details of the first annual and supplementary
-- bill run together with the charge version. We can then display a single line for each
-- charge version with the matched (nor not) bill run details.
SELECT
  r.display_name,
  cv.licence_ref,
  cv.charge_version_id,
  (cv.scheme) AS cv_scheme,
  (cv.status) AS cv_status,
  (cv."source") AS cv_source,
  (cv.start_date) AS cv_start_date,
  (cv.date_created) AS cv_date_created,
  (annual.billing_batch_id) AS al_billing_batch_id,
  (annual.bill_run_number) AS al_bill_run_no,
  (annual.br_scheme) AS al_scheme,
  (annual.batch_type) AS al_batch_type,
  (annual.to_financial_year_ending) AS al_to_financial_year_ending,
  (annual.br_date_created) AS al_date_created,
  (supplementary.billing_batch_id) AS sp_billing_batch_id,
  (supplementary.bill_run_number) AS sp_bill_run_no,
  (supplementary.br_scheme) AS sp_scheme,
  (supplementary.batch_type) AS sp_batch_type,
  (supplementary.to_financial_year_ending) AS sp_to_financial_year_ending,
  (supplementary.br_date_created) AS sp_date_created
FROM water.charge_versions cv
INNER JOIN water.regions r ON r.nald_region_id = cv.region_code
-- [4] Do a left join in case there are no annual bill runs created after the charge version
LEFT JOIN (
  -- [3] We cannot reference row_no in the WHERE clause of the query that generates it. So, we
  -- need this interstitial step in order to apply our WHERE annual_raw.row_no = 1. It is this
  -- which causes this subquery to return only the first annual bill run created after the charge
  -- version we JOIN to
  SELECT
    *
  FROM (
    -- [2] Join the billing batch data with charge version data
    SELECT
      cv.charge_version_id,
      br.billing_batch_id,
      br.bill_run_number,
      (br.scheme) AS br_scheme,
      br.batch_type,
      br.to_financial_year_ending,
      (br.date_created) AS br_date_created,
      -- ROW_NUMBER() OVER will give each row in a partition a sequential number. The partition
      -- is a way of grouping the rows in a table. We control the ordering (and therefore the
      -- numbering) with the ORDERBY
      (ROW_NUMBER() OVER (PARTITION BY cv.charge_version_id ORDER BY br.date_created ASC)) AS row_no
    FROM water.charge_versions cv
    INNER JOIN water.regions r ON r.nald_region_id = cv.region_code
    -- [1] Get all ANNUAL billing batch records with a status of 'sent' and with the same region and
    -- scheme as the charge version. Also, only return those with a created date greater than the
    -- charge versions
    LEFT JOIN (
      SELECT
        bb.billing_batch_id,
        bb.bill_run_number,
        bb.batch_type,
        bb.region_id,
        bb.scheme,
        bb.to_financial_year_ending,
        bb.date_created
      FROM water.billing_batches bb
      WHERE bb.status = 'sent' AND bb.batch_type = 'annual'
      ORDER BY bb.region_id, bb.scheme, bb.date_created ASC
    ) br ON br.region_id = r.region_id AND br.scheme = cv.scheme AND br.date_created > cv.date_created
  ) annual_raw
  WHERE annual_raw.row_no = 1
) annual ON annual.charge_version_id = cv.charge_version_id
-- [4] Do a left join in case there are no supplementary bill runs created after the charge version
LEFT JOIN (
  -- [3] We cannot reference row_no in the WHERE clause of the query that generates it. So, we
  -- need this interstitial step in order to apply our WHERE supp_raw.row_no = 1. It is this
  -- which causes this subquery to return only the first supplementary bill run created after the charge
  -- version we JOIN to
  SELECT
    *
  FROM (
    -- [2] Join the billing batch data with charge version data
    SELECT
      cv.charge_version_id,
      br.billing_batch_id,
      br.bill_run_number,
      (br.scheme) AS br_scheme,
      br.batch_type,
      br.to_financial_year_ending,
      (br.date_created) AS br_date_created,
      (ROW_NUMBER() OVER (PARTITION BY cv.charge_version_id ORDER BY br.date_created ASC)) AS row_no
    FROM water.charge_versions cv
    INNER JOIN water.regions r ON r.nald_region_id = cv.region_code
    -- [1] Get all SUPPLEMENTARY billing batch records with a status of 'sent' and with the same region and
    -- scheme as the charge version. Also, only return those with a created date greater than the
    -- charge versions
    LEFT JOIN (
      SELECT
        bb.billing_batch_id,
        bb.bill_run_number,
        bb.batch_type,
        bb.region_id,
        bb.scheme,
        bb.to_financial_year_ending,
        bb.date_created
      FROM water.billing_batches bb
      WHERE bb.status = 'sent' AND bb.batch_type = 'supplementary'
      ORDER BY bb.region_id, bb.scheme, bb.date_created ASC
    ) br ON br.region_id = r.region_id AND br.scheme = cv.scheme AND br.date_created > cv.date_created
  ) supp_raw
  WHERE supp_raw.row_no = 1
) supplementary ON supplementary.charge_version_id = cv.charge_version_id
ORDER BY r.display_name, cv.licence_ref, cv.charge_version_id, cv.start_date, cv.date_created
```
