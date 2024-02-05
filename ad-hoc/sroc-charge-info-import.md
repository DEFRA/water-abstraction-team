# SROC charge info import

- **TEAM**
- **2024-02-05**
- [WATER-4356](https://eaflood.atlassian.net/browse/WATER-4356)

When you build the local environment from scratch once the import processes are finished you will have a complete PRESROC database setup.

But there won't be any SROC related charge information. We need this to be able to work with all the billing functionality we've built for SROC.

Previously we would have to manually create records. This would confirm something would work but didn't provide enough volume to get a true sense of timings and performance.

To solve the problem we came up with the **SROC charge info import**.

## Usage

> We don't expect folks to be doing this regularly. It's more likely one person will do it, then forward their DB backup. Then as is often the case daily 'hacking' might result in a DB become invalid or broken resulting in the need to rebuild from scratch again.
>
> This solution is hidden away here for a reason. It was a 'hack' that we do not wish to invest too much time in. It is only to be used by the development team and on an infrequent basis. If you encounter an error do not be surprised! We're sure you'll figure out a solution 😁

Create a new branch on [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system). Do not worry about an empty commit. The branch won't be pushed for merging. This is just to isolate the changes and avoid them creeping into your existing work.

Use the VSCode [command palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) to run **💻 Open (System)**. Then inside the container run `cd repos/water-abstraction-system` followed by `npm i --save-dev csv-parse`. We depend on [CSV Parser](https://csv.js.org/parse/) to parse the contents of the CSV files into JSON objects we can use in our [Knex.js INSERT statements](https://knexjs.org/guide/query-builder.html#insert).

Then copy `sroc-charge-info-import.js` to the root of the project. Create a folder named `tmp/` also at the root.

The next step is to [extract the data into CSV files](#extracting-the-data-to-files). The SQL to select the data is below. How you export it is dependent on your preferred tool. We used [DBeaver](https://dbeaver.io/) for the first run. We opened a new SQL query, ran the SQL for a table, then used its **Export data** feature to create the CSV file. When you've done them all copy the files to `tmp/`.

The final step is to run the script. Back inside the container at the root of the project run `node sroc-charge-info-import.js`. The process took approximately a minute to complete on an Apple M1 Mac with approximately 20K charge versions to import but your timing might vary. Hopefully, you will see no errors and the `All done!` message.

### If errors happen

Do what you need to in order to identify the source of the error. Perhaps the data now includes a scenario not previously covered by the script. But before importing again we highly recommend deleting whatever was imported before the error was thrown. Use the timestamp that the script will output before any data is imported along with [the delete import data SQL](#deleting-imported-data) we've provided to clean your DB before trying again.

## Extracting the data to files

### Contacts

- Export to `contacts.csv`

```sql
SELECT
  DISTINCT c.*
FROM crm_v2.contacts c
INNER JOIN crm_v2.invoice_account_addresses iaa ON iaa.contact_id = c.contact_id
INNER JOIN crm_v2.invoice_accounts ia ON ia.invoice_account_id = iaa.invoice_account_id
INNER JOIN water.charge_versions cv ON cv.invoice_account_id = ia.invoice_account_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Addresses

- Export to `addresses.csv`

```sql
SELECT
  DISTINCT a.*
FROM crm_v2.addresses a
INNER JOIN crm_v2.invoice_account_addresses iaa ON iaa.address_id = a.address_id
INNER JOIN crm_v2.invoice_accounts ia ON ia.invoice_account_id = iaa.invoice_account_id
INNER JOIN water.charge_versions cv ON cv.invoice_account_id = ia.invoice_account_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Invoice account companies

This is based on companies linked to invoice accounts which are linked to SROC charge versions.

- Export to `invoice_account_companies.csv`

```sql
SELECT
  DISTINCT c.*
FROM crm_v2.companies c
INNER JOIN crm_v2.invoice_accounts ia ON ia.company_id = c.company_id
INNER JOIN water.charge_versions cv ON cv.invoice_account_id = ia.invoice_account_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Invoice account agent companies

This is based on companies linked to invoice account addresses (`agent_company`) which are linked to SROC charge versions.

- Export to `invoice_account_agent_companies.csv`

```sql
SELECT
  DISTINCT c.*
FROM crm_v2.companies c
INNER JOIN crm_v2.invoice_account_addresses iaa ON iaa.agent_company_id = c.company_id
INNER JOIN water.charge_versions cv ON cv.invoice_account_id = iaa.invoice_account_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Charge version companies

This is based on companies directly linked to charge versions.

- Export to `charge_version_companies.csv`

```sql
SELECT
  DISTINCT c.*
FROM crm_v2.companies c
INNER JOIN water.charge_versions cv ON cv.company_id = c.company_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Invoice accounts

- Export to `invoice_accounts.csv`

```sql
SELECT
  DISTINCT
  ia.invoice_account_id,
  ia.company_id,
  ia.invoice_account_number,
  ia.start_date,
  ia.end_date,
  ia.date_created,
  ia.date_updated,
  c.external_id AS company_external_id,
  c.current_hash AS company_current_hash,
  c.company_number
FROM crm_v2.invoice_accounts ia
INNER JOIN crm_v2.companies c ON c.company_id = ia.company_id
INNER JOIN water.charge_versions cv ON cv.invoice_account_id = ia.invoice_account_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Invoice Account Addresses

- Export to `invoice_account_addresses.csv`

```sql
SELECT
  DISTINCT
  iaa.*,
  a.external_id AS address_external_id,
  a.current_hash AS address_current_hash,
  ia.invoice_account_number,
  a.uprn AS address_uprn,
  c.external_id AS company_external_id,
  c.current_hash AS company_current_hash,
  c.company_number,
  ct.external_id AS contact_external_id,
  ct.current_hash AS contact_current_hash
FROM crm_v2.invoice_account_addresses iaa
INNER JOIN crm_v2.addresses a ON a.address_id = iaa.address_id
LEFT JOIN crm_v2.companies c ON c.company_id = iaa.agent_company_id
LEFT JOIN crm_v2.contacts ct ON ct.contact_id = iaa.contact_id
INNER JOIN crm_v2.invoice_accounts ia ON ia.invoice_account_id = iaa.invoice_account_id
INNER JOIN water.charge_versions cv ON cv.invoice_account_id = ia.invoice_account_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Charge versions

- Export to `charge_versions.csv`

```sql
SELECT
  cv.charge_version_id,
  cv.licence_ref,
  cv.scheme,
  cv.external_id,
  cv.version_number,
  cv.start_date,
  cv.status,
  cv.apportionment,
  cv.error,
  cv.end_date,
  cv.billed_upto_date,
  cv.region_code,
  cv.date_created,
  cv.date_updated,
  cv."source",
  cv.is_test,
  cv.company_id,
  cv.invoice_account_id,
  cv.change_reason_id,
  cv.created_by,
  cv.approved_by,
  cv.licence_id,
  c.external_id AS company_external_id,
  ia.invoice_account_number AS invoice_account_number,
  cr.description AS change_reason
FROM water.charge_versions cv
INNER JOIN water.change_reasons cr ON cr.change_reason_id = cv.change_reason_id
INNER JOIN crm_v2.invoice_accounts ia ON ia.invoice_account_id = cv.invoice_account_id
LEFT JOIN crm_v2.companies c ON c.company_id = cv.company_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Charge elements

- Export to `charge_elements.csv`

```sql
SELECT
 ce.*,
 bcc.reference AS charge_reference
FROM water.charge_elements ce
INNER JOIN water.billing_charge_categories bcc ON bcc.billing_charge_category_id = ce.billing_charge_category_id
INNER JOIN water.charge_versions cv ON cv.charge_version_id = ce.charge_version_id
WHERE cv.scheme = 'sroc' AND cv.is_test = FALSE;
```

### Charge purposes

- Export to `charge_purposes.csv`

```sql
SELECT
  cp.*,
  pu.legacy_id AS main_legacy_id,
  pp.legacy_id AS primary_legacy_id,
  ps.legacy_id AS secondary_legacy_id
FROM
  water.charge_purposes cp
INNER JOIN water.charge_elements ce ON ce.charge_element_id = cp.charge_element_id
INNER JOIN water.charge_versions cv ON cv.charge_version_id = ce.charge_version_id
INNER JOIN water.purposes_uses pu ON pu.purpose_use_id = cp.purpose_use_id
LEFT JOIN water.purposes_primary pp ON pp.purpose_primary_id = cp.purpose_primary_id
LEFT JOIN water.purposes_secondary ps ON ps.purpose_secondary_id = cp.purpose_secondary_id
WHERE cv.scheme = 'sroc' AND cp.is_test = FALSE;
```

## Deleting imported data

Replace `TIMESTAMP` with the timestamp output by the importer.

```sql
DELETE FROM crm_v2.invoice_account_addresses WHERE date_created = 'TIMESTAMP';
DELETE FROM crm_v2.contacts WHERE date_created = 'TIMESTAMP';
DELETE FROM crm_v2.addresses WHERE date_created = 'TIMESTAMP';
DELETE FROM crm_v2.companies WHERE date_created = 'TIMESTAMP';
DELETE FROM crm_v2.invoice_accounts WHERE date_created = 'TIMESTAMP';
DELETE FROM water.charge_versions WHERE date_created = 'TIMESTAMP';
DELETE FROM water.charge_elements WHERE date_created = 'TIMESTAMP';
DELETE FROM water.charge_purposes WHERE date_created = 'TIMESTAMP';
```
