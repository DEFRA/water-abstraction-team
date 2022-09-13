# ALCS Supplementary batch process

To help understand the process, we have based it on a bill run being created with the following details

- Batch is created by a user on **2022-09-12** (is taken from `Date.now()`)
- It is a supplementary
- It is for the South West region

## water-abstraction-ui

The [internal UI](https://github.com/DEFRA/water-abstraction-ui) will send the following request to the [water-abstraction-service](https://github.com/DEFRA/water-abstraction-service) to kick off the bill run process

```json
{
  "userEmail": "alan.cruikshanks@defra.gov.uk",
  "regionId": "5e9b2b1a-fd03-4e18-ba1c-ae8292be21d9",
  "batchType": "supplementary",
  "financialYearEnding": 2023,
  "isSummer": false
}
```

User email is taken from whoever is logged in. Region and batch type are selected by the user in the UI. `isSummer` will default to false for supplementary bill runs. The current date is passed to `getBatchFinancialYearEnding()` to determine the current financial year at the time the bill run is created.

If not 2PT it calls `helpers.getFinancialYear()` which checks if the date is before **March 31**. If yes, the date is the current date plus 1 year. Else it's the current date. For example **2022-09-12** would return **2021**. If it is 2PT see [2PT return cycles](#2pt-return-cycles) for an explanation of what it does.

`_batching()` in `src/internal/modules/billing/controllers/create-bill-run.js` handles sending the request to the **water-abstraction-service**. It `awaits` the response and then redirects the user based on the `status` returned in the response (`['processing', 'sending', 'ready', 'sent', 'review']`). For a new bill run we expect that to be `processing`.

At this point the user is shown the spinner page. It refreshs every 5 seconds grabbing the 'event' record created for the bill run. Depending on the status in that record the spinner page will either continue to show the spinner or redirect to a result page.

At this point the rest of the work is done in the [water-abstraction-service](#water-abstraction-service)

### 2PT return cycles

If 2PT then `helpers.getFinancialYear()` calls `helpers.returns.date.createReturnCycles().reverse()`. In that `startDate` defaults to **2017-11-01** and `endDate` is `Date.now()`.

It then sets the cycles by first setting

```javascript
winter = '2017-04-01'
summer = '2017-11-01'
```

Next it calls `getNextCycle()` which ends up returning this for the first `cycle`.

```javascript
{
  startDate: '2017-11-01'
  EndDate: '2018-10-31',
  isSummar: true
  dueDate: '2018-11-28'
}
```

While `cycle` is on or before **today**

- we clone `cycle`
- add the clone to `cycles[]`
- add 1 day to `cloneCycle.startDate`
- call `getNextCycle(cloneCycle.startDate)`

Eventually, we are returned an array that starts with the following 3 entries

```javascript
[
  {
    startDate: '2017-11-01'
    EndDate: '2018-10-31',
    isSummar: true
    dueDate: '2018-11-28'
  },
  {
    startDate: '2018-04-01'
    EndDate: '2019-03-31',
    isSummar: false
    dueDate: '2019-04-28'
  },
  {
    startDate: '2018-11-01'
    EndDate: '2019-10-31',
    isSummar: true
    dueDate: '2019-11-28'
  }
]
```

We then check for the most recent cycle whose due date is before **today** and whose `isSummer` matches what we have selected. The end date from it is passed `helpers.getFinancialYear()` and what it returns is the financial year.

## water-abstraction-service

### Create batch endpoint

> `src/modules/billing/controllers/batches.js`

We hit the `postCreateBatch()` controller which immediately creates a `water.billing_batches` record using `create()` in `src/modules/billing/services/batch-service.js`.

Along with that we also create an `water.events` record which is what the UI queries for progress when displaying the spinner page to the user.

We add the [billing.create-bill-run job](#create-bill-run-job) to our BullMQ `QueueManager` and then respond to the UI with the event record's ID

#### Creating the billing batch

If the `batchType` is not 'annual', as in this case, it sets the scheme to **alcs** and then does some logic with **financialYearEnding** (referred to in `create()` as **toFinancialYearEnding**).

It checks it is not greater than the configured **alcsEndYear**, which is hard coded as 2022. If it is, **toFinancialYearEnding** will be set to 2022 instead.

Then, if the batch type is 'supplementary' **fromFinancialYearEnding** will be calculated as 2017 using

```javascript
fromFinancialYearEnding = config.billing.alcsEndYear - (config.billing.supplementaryYears + (config.billing.alcsEndYear - toFinancialYearEnding))
// fromFinancialYearEnding = 2022 - (5 + (2022 - 2022))
```

We then check there is not a duplicate billing batch using the following values

- region
- batch type
- to financial year ending (2022)
- season (based on `isSummer`)
- scheme

If that's all good we create the batch.

#### Note about FinancialYear

The `water.billing_batches` table has `from_financial_year` and `to_financial_year` fields. When the data is mapping to a `Batch` model instance these are translated into `FinancialYear` model instances and set on the `Batch` model as **startYear** and **endYear**.

The `FinancialYear` model is not database backed. It is a helper object intended to provide functionality around financial years. For example, instantiated with the year '2023' it's properties would return

- `startYear` 2022
- `endYear` 2023
- `start` 2022-04-01
- `end` 2023-03-31

So, when you have a batch instance you can call things like `currentBatch.startYear.start`

### Create Bill Run job

> `src/modules/billing/jobs/create-bill-run.js`

- Create CHA bill run
- Save CHA ID and Bill run number to batch

The batch type of the batch is used to determine the next job we add to QueueManager is. If supplementary, it's rebillingJob

### Rebilling Job

> `src/modules/billing/jobs/rebilling.js`

Finds invoices that are flaged for rebilling for the selected region. This eventually calls the raw SQL query `findByIsFlaggedForRebillingAndRegion` in `src/lib/connectors/repos/queries/billing-invoices.js`.

We then iterate through the results and `await` a call to `rebillInvoice` in `src/modules/billing/services/rebilling-service.js`.

That does the work of

- requesting the CHA rebill the invoice
- polling the CHA until the rebilling process is done

The results are returned. The service then updates the invoice with the changes.

### Populate Charge Versions Job

> `src/modules/billing/jobs/populate-batch-charge-versions.js`

After getting the batch it calls `createForBatch()` in `src/modules/billing/services/charge-version-service/index.js`.

First, it creates an array of financial years using [Lodash's range() method](https://lodash.com/docs/4.17.15#range). It critical thing to note is

> Creates an array of numbers progressing from `start` up to, **but not including**, `end`.

This explains the `+ 1` in the code below.

```javascript
const financialYears = range(batch.startYear.endYear, batch.endYear.endYear + 1)
// const financialYears = range(2016-2017.2017, 2021-2022.2022 + 1)
// const financialYears = [2017, 2018, 2019, 2020, 2021, 2022]
```

Then for each financial year it calls `processFinancialYear()` and returns the combined results as a flattened array.

#### Process Financial Year

First grabs a copy of

- grab all 2PT sent batches for the region and financial year
- grab all supplementary sent batches for the region and financial year

Then runs the query `findValidInRegionAndFinancialYearSupplementary` query in `src/lib/connectors/repos/queries/charge-versions.js` to return current charge versions for the matching region, whose licence is not currently in the charging workflow, for example, because they are being reviewed.

We then call `processChargeVersionFinancialYear()` for each charge version returned.

If the charge version is not chargeable and is supplementary we return the result of `createBatchChargeVersionYear()` in `src/modules/billing/services/charge-version-year.js`. This is an instance of a `BillingBatchChargeVersionYear` model based on a record in `water.billing_batch_charge_versions_years` it also creates.

Else, we use `getRequiredTransactionTypes()` to return an array of transaction types.

```javascript
{
  types: [
    {
      type : 'two_part_tariff',
      isSummer: false
    }
  ],
  chargeVersionHasAgreement: false
}
```
