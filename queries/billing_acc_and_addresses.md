# Billing accounts and their addresses

- **Business**
- **2023-07-6**
- [WATER-4054](https://eaflood.atlassian.net/browse/WATER-4054)

> Billing and data need a report to inform SSCL of any billing accounts that have foreign addresses.
>
> Previously this was pulled from NALD and Boxi, but the addresses in NALD are now over 1year out of date, so the data will need to come from the service.
>
> Report requires: Select all Billing Account numbers and provide Address.

## Query

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
