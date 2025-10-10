# Billing accounts and their addresses

- **Business**
- **2025-10-09**
- [WATER-5326](https://eaflood.atlassian.net/browse/WATER-5326)

> Billing & data need a report to inform SSCL of any billing accounts that have foreign addresses.
>
> Previously this was pulled from NALD and Boxi, but billing accounts are now managed in WRLS.
>
> Report requires: Select all Billing Account numbers and provide Address.

## Current version

Billing & data asked for a refresh of the extract in WATER-5313. What they really wanted was just the 'current' address
for each billing account.

So, we amended the query to select only these from `crm_v2.invoice_account_addresses`. The extra start and end date
fields were just to help them confirm we'd got the 'right' address records.

### Query

```sql
SELECT
  ia.invoice_account_number,
  a.address_1,
  a.address_2,
  a.address_3,
  a.address_4,
  a.town,
  a.county,
  a.postcode,
  a.country,
  iaa.start_date,
  iaa.end_date,
  ia.invoice_account_id,
  iaa.address_id
FROM
  crm_v2.invoice_accounts ia
INNER JOIN crm_v2.invoice_account_addresses iaa ON
  iaa.invoice_account_id = ia.invoice_account_id
INNER JOIN crm_v2.addresses a ON
  a.address_id = iaa.address_id
WHERE
  iaa.end_date IS NULL
  OR iaa.end_date > CURRENT_DATE
ORDER BY
  ia.invoice_account_number ASC;
```

## Version 1

- **Business**
- **2023-07-6**
- [WATER-4054](https://eaflood.atlassian.net/browse/WATER-4054)

This previous version simply returns the billing accounts and _all_ the addresses that have been assigned to them. You
can change the address for a billing account in WRLS and when you do, this creates a new
`crm_v2.invoice_account_addresses` record.

Essentially, whichever of these has no end date determines the 'current' address for the billing account.

### Query

```sql
SELECT
  ia.invoice_account_number,
  a.address_1,
  a.address_2,
  a.address_3,
  a.address_4,
  a.town,
  a.county,
  a.postcode,
  a.country,
  ia.invoice_account_id,
  iaa.address_id
FROM
  crm_v2.invoice_accounts ia
INNER JOIN crm_v2.invoice_account_addresses iaa ON
  iaa.invoice_account_id = ia.invoice_account_id
INNER JOIN crm_v2.addresses a ON
  a.address_id = iaa.address_id
```
