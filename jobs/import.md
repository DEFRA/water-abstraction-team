# Water Abstraction Import

> <https://github.com/DEFRA/water-abstraction-import>

This uses the [pg-boss](https://github.com/timgit/pg-boss) message-queue to manage its background jobs.

## Scheduling

[node-cron](https://github.com/node-cron/node-cron) is used to trigger jobs according to schedules defined in `config.js`.

This is done within the `plugin.js` associated with each job, for example, the NALD import has

```javascript
// src/modules/nald-import/plugin.js
  cron.schedule(config.import.nald.schedule, async () => {
    await server.messageQueue.publish(S3DownloadJob.createMessage())
  })
```

**node-cron** is used to schedule adding the first 'job' in a background process to a queue. If there are subsequent 'jobs' they will be chained using each job's `onComplete()` handler.

All the schedules are defined using [cron](https://en.wikipedia.org/wiki/Cron) syntax.

## Jobs

### Bill runs import

- **request** `POST /import/1.0/bill-runs`
- **Schedule** N/A

A one-off job to migrate billing information from NALD to WRLS. It updates the following tables

- `water.billing_batches` from `import."NALD_BILL_RUNS"`
- `water.billing_invoices` from `import."NALD_BILL_HEADERS"` joins to `crm_v2.invoice_accounts` and billing batches to do this
- `water.billing_invoice_licences` from `import."NALD_BILL_HEADERS"` joins to other NALD and WRLS tables to do this
- `water.billing_transactions` from `import."NALD_BILL_TRANS"`
- `water.billing_volumes` from now populated WRLS tables and `import."NALD_TPT_RETURNS"`
- `water.billing_batch_charge_version_years` from now populated WRLS tables

The queries used assume charge versions and charge elements have been populated. So, you should not trigger this until you have triggered [Charge versions](#charge-versions)

### Charging import (versions)

- **request** `POST /import/1.0/charging`
- **Schedule** N/A

Creates new PRESROC `water.charge_versions` records or updates existing ones based on `import.NALD_CHG_VERSIONS`

The job was written as a one-off to create the charge version records WRLS billing needed when it first went live. It was written at a time there was only the PRESROC scheme.

Now we have SROC and this process (creating the `water_import.charge_versions_metadata` source data and then updating `water.charge_versions` using it) has no knowledge of it. Nor does NALD for that matter. A completely different one-off mechanism (the charge version upload in water-abstraction-service) was built to handle creating the SROC charge versions needed to support SROC billing.

When you rebuild a local environment you still need to manually trigger this redundant import job to create your base PRESROC charge versions. But it only deals with PRESROC. Any licences with a start date after 2022-04-01 will need you to manually create their charge versions.

### Charging import (data)

- **request** N/A
- **scheduled** 01:00 Monday to Friday

Updates the following tables

- `water.financial_agreement_types` from `import."NALD_FIN_AGRMNT_TYPES"`
- `water.purposes_primary` from `import."NALD_PURP_PRIMS"`
- `water.purposes_secondary` from `import."NALD_PURP_SECS"`
- `water.purposes_uses` from `import."NALD_PURP_USES"`
- `water.purposes` from `import."NALD_PURPOSES"` (valid combinations table) and joins to the 3 other purpose tables to get IDs
- `water.return_versions` from `import."NALD_RET_VERSIONS"` (see note below)
- `water.return_requirements` from `import."NALD_RET_FORMATS"`
- `water.return_requirement_purposes` from `import."NALD_RET_FMT_PURPOSES"`

Return versions depends on `water.licences` being populated, and this has a knock on effect to requirements and requirement purposes. This means until the NALD import has completed these 3 tables will fail to populate on a first run.

### Tracker

- **request** N/A
- **schedule** 10:00 Monday to Friday

It queries `water_import.job` for any failed 'jobs'. If there are any it generates an email sent via [Notify](https://www.notifications.service.gov.uk/) to the Product Owner and Delivery Manager. There always seems to be a few failed jobs so the PO and DM look for any jobs that aren't normally listed or a spike in the numbers. If they find any they will typically ask the team to investigate further.

### Licence import

- **request** `POST /import/licences`
- **schedule** 04:00 Monday to Friday

Like the NALD import this is made up of a series of 'jobs'.

#### Delete removed documents

Mark as deleted any `crm_v2.documents` records where the `document_ref` is not in `import."NALD_ABS_LICENCES"` and the document type is `abstraction_licence`.

#### Import purpose condition types

Populates the `water.licence_version_purpose_condition_types` table from `import."NALD_LIC_COND_TYPES"`.

#### Queue companies job

This just creates an 'import company' job and adds it to the queue for every company record in `import."NALD_PARTIES"`. As part of this it also creates a record for each company in `water_import.import_companies`.

#### Import companies job

You can think of this as one job for all companies imported from NALD. In reality it's a job per company but they all do the same thing. For each company it extracts a range of data from the imported NALD tables. Through a series of mapping and transform modules it ends up populating the `crm_v2.companies`, `crm_v2.addresses`, `crm_v2.contacts` plus `crm_v2.invoice_accounts`, `crm_v2.invoice_account_addresses`, `crm_v2.company_contacts`,  and `crm_v2.company_addresses` tables.

#### Queue licences job

This just creates an 'import licence' job and adds it to the queue for every licence record in `import."NALD_ABS_LICENCES"`.

#### Import licence job

You can think of this as one job for all licences imported from NALD. In reality it's a job per licence but they all do the same thing. For each licence it extracts a range of data from the imported NALD tables. Through a series of mapping and transform modules it ends up populating the `water.licences` and `crm_v2.documents`. If `isLicenceAgreementImportEnabled` is enabled in the config it will also populate `water.licence_agreements` (this is enabled in the `dev` environment).

It will also compare the expired, lapsed and revoked dates of a copy of the licence prior to import with what it does import. If any are not the same then it will flag the licence for supplementary billing.

Finally, it populates `water.licence_versions`.

### NALD import

- **request** `POST /import/1.0/nald/licences`
- **scheduled** 01:00 every day

This is the primary import mechanism. It is made up of a series of 'jobs'.

#### S3 download

FME extracts most of the NALD data and generates an encrypted zip file which is placed in AWS S3. This job compares the etag with what it has recorded in the DB (see `water.application_state`, and yes this is an example of a service using another services schema directly!) If they are different it

- downloads the file
- extracts the CSV files from the zip
- drops the current `import_temp` schema and creates a new one
- imports the CSV files as tables into the `import_temp` schema
- drops `import` schema then renames `import_temp` schema as `import`
- cleans up the local files (the zip and the extracted files)

#### Delete removed documents

The next job in the process is to mark as deleted any `crm.document_header` records where the `system_external_id` is not in `import."NALD_ABS_LICENCES"`. We suspect that either records are hard deleted in NALD else FME only extracts current licences.

#### Queue licences job

This just creates an 'import licence' job and adds it to the queue for every licence record in `import."NALD_ABS_LICENCES"`.

#### Import licence job

You can think of this as one job for all licences imported from NALD. In reality it's a job per licence but they all do the same thing.

It uses the NALD data to populate and update `permit.licence` and `crm.document_header`. It populates the `returns.return_cycles` and `returns.returns` tables.

> There is an option in the config; `overwriteReturns`. It is hard coded as `false` but it appears that if it is `true` it forces the import to not only recreate the return and return cycles data but it will also import existing submissions data (`returns.versions` and `returns.lines`).
