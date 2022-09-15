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

Else, we use `getRequiredTransactionTypes()` to return an array of transaction types based on the batch type.

If the charge version passed in is not to be included supplementary billing then we return early with

```javascript
{
  types: [],
  chargeVersionHasAgreement: false
}
```

Else we kick off our list of types by calling `getAnnualTransactionTypes()` that returns a fixed object

```javascript
{
  types: [
    {
      type : 'annual',
      isSummer: false
    }
  ],
  chargeVersionHasAgreement: false
}
```

We then get a fully inflated instance of a charge version, with all related entities and pass that to `chargeVersionHasTwoPartAgreement()`. We use the charge version (non-inflated) start and end dates to set a range. We then use JavaScript's `some()` to look through the licence agreements of the inflated charge version looking to see if one of them

- has a dateDeleted === null
- the licence agreement date range overlaps the date range we have set
- the licence agreement code === 'S127'

This results in `chargeVersionHasTwoPartAgreement()` returning true or false.

If true we then call `getTwoPartTariffSeasonsForChargeVersion()` in `src/modules/billing/services/charge-version-service/two-part-tariff-seasons.js`. It first checks whether the non-inflated charge version has a 2pt agreement. We've already done that check (twice!) no we move to the next block.

There we are tryong to calculate NALD and WRLS seasons. We start with an empty `seasons[]`.

If charge version start date <= 2021 we push into `seasons[]` the result of `getNALDTwoPartTariffSeasons()`.

That gets all the billing volumes for the charge version that

- match the financial year
- are approved
- errored on is null

We then further filter the results for those whose source (taken from linking the billing volume to a batch) matches 'NALD'.

We then generate an array of true and false based on what seasons the billing volumes contains. We map all the results to just return the value of `isSummer`. We then use lodash's `uniq()` to get that down to either

- `[true, false]`
- `[true]`
- `[false]`

We then call `createTwoPartTariffBatches()` passing in whether our array contains 'true' and whether it contains 'false'.

All that returns is an object like, for example, this

```javascript
{
  summer: true,
  winterAllYear: false
}
```

Now back in `getTwoPartTariffSeasonsForChargeVersion()` this result gets pushed into `seasons[]`.

Then we call `getWRLSTwoPartTariffSeasons()` also in `src/modules/billing/services/charge-version-service/two-part-tariff-seasons.js`.

Brain melt. Tidy up and document when less angry.

We have a set of ReturnRequirementVersions for the licence linked to the charge version.

We filter these to get only those where the RRV data range overlaps the charge period we set at the top (creating a range from charge version start and end date) and where they are not draft

We then check each of the RRV calling `hasTwoPartTariffPurposeReturnsInSeason()` passing in 'summer'. This filters all its return requirements for those where `isSummer` is true. This filtered list is then checked using `some()` to see if any have 'isTwoPartTariffPurposeUse'. This is a method on the `ReturnRequirement` model which checks the linked return requirement purposes and the `PurposeUse` they are linked to to see if it is a 2PT purpose.

We do the same again passing in `winter`.

The results of these are then passed in the same way to `createTwoPartTariffBatches()` which again results in a result like

```javascript
{
  summer: true,
  winterAllYear: false
}
```

We then check if `existingTPTBatches` was passed in to `getWRLSTwoPartTariffSeasons()`. If it was we call `createTwoPartTariffBatchesForSupplementary()` which returns an object like

```javascript
{
  summer: true,
  winterAllYear: false
}
```

This time summer is based on whether

- our summer/winter result contains a `summer: true`
- && `existingTPTBatches` contains any where the billing batch `isSummer` is true

Winter also checked in the same way

- our summer/winter result contains a `winterAllYear: true`
- && `existingTPTBatches` contains any where the billing batch `isSummer` is false

We then do the same kind of check again on our `seasons[]` so that the result of `getWRLSTwoPartTariffSeasons()` is

```javascript
{
  summer: true,
  winterAllYear: false
}
```

Which is set as `twoPartTariffSeasons`.

Next we then iterate `existingTPTBatches` and where the batch type is 2PT we push into `historicTransactionTypes[]` whether the batch is 'summer' or 'winter' by checking the batch's `isSummer` flag.

Then

- if `twoPartTariffSeasons.summer` === true and `historicTransactionTypes` === includes 'summer' push `{ type: 'two_part_tariff', isSummer: true }` into `transactionTypesWithTwoPartAgreementFlag.types`
- if `twoPartTariffSeasons.winterAllYear` === true and `historicTransactionTypes` === includes 'winter' push `{ type: 'two_part_tariff', isSummer: false }` into `transactionTypesWithTwoPartAgreementFlag.types`

And set `transactionTypesWithTwoPartAgreementFlag.chargeVersionHasAgreement` to true.

This then gets returned.

Then for each type in types we create a `water.billing_batch_charge_version_years` record using `createBatchChargeVersionYear()` in `src/modules/billing/services/charge-version-year.js`.

const processFinancialYear = async (batch, financialYear) => {
The charge version years generated from this called is returned to `processFinancialYear()`.

Because we end up with an array of arrays, for example `[[], [], []]` we then flatten the result to get an array of `BillingBatchChargeVersionYears` and return it to `createForBatch()`.

`processFinancialYear()` is being called for each financial year we initially calculated (`const financialYears = [2017, 2018, 2019, 2020, 2021, 2022]`) so we end up with an array of charge version year arrays.

We again flatten it and this is what `createForBatch()` returns even though we don't use it.

The handler in **Populate Charge Versions Job** finally completes. The `onComplete()` method checks the batch type and determines the next job we queue up based on it.

### Two Part Tariff Matching Job

> src/modules/billing/jobs/two-part-tariff-matching.js

After getting the batch and checking its status is `processing`. it calls `createForBatch()` in `src/modules/billing/services/charge-version-service/index.js`.

This then calls `processBatch()` in `src/modules/billing/services/two-part-tariff.js`. It creates an array of 'processors', 2pt and supplementary and we call the one which matches our batch type, in this case 'supplementary.

That results in `processSupplementaryBatch()` being called. It's first task is to get the `water.billing_batch_charge_version_years` linked ot our billing batch whose transaction type is 'two-part-tariff'.

These are then passed to `processChargeVersionYears()`. This is another bluebird map series where for each charge version year we call `processChargeVersionYear()`.

In `processChargeVersionYear()` we call `matchVolumes()` in `src/modules/billing/services/volume-matching-service/index.js` passing in values taken from the charge version year we passed in.

That calls `getData()` in `src/modules/billing/services/volume-matching-service/data-service.js()`. The intent is to get all the data needed to perform TPT matching.

First is getting an inflated instance of the `ChargeVersion`.

Then we call `getChargePeriod()` in `src/modules/billing/services/volume-matching-service/data-service.js`. This creates a `DateRange` based on a start and end date.

These are calculated using `getChargePeriodStartDate()` and `getChargePeriodEndDate()`. Focusing on start dates and without going into each of the sub methods, it takes the start date from the licence, charge version and financial year (this one calculated). It then determines which of these is the latest date and uses that as the `startDate`. `getChargePeriodEndDate()` does it for end dates, only what it returns is the earliest of the 3. This gives us the small date range within all 3 types of date range.

Next in the data service is getting the return groups using `getReturnGroups()` in `src/modules/billing/services/volume-matching-service/return-group-service.js`.

This then calls `getReturnsForLicenceInFinancialYear()` in `src/lib/services/returns/index.js`. First thing this does is call `fetchReturns()` which takes the licence number and the `FinancialYear` instance (2022-2023).

This then calls `createReturnCycles()` which we have covered in [2PT return cycles](#2pt-return-cycles). The one difference here is we provide a start date. In our scenario this would be 2023 - 2. So, 2021 and the cycles returned would be based on using that as the start date to generate them from.

We then filter the cycles to based on whether the cycle financial year matches our `FinancialYear` instance (2022-2023) end year. The gotcha is that we use a separate function for determining the cycle's financial year. Rather than seeing if the month is before April, we check if the cycle is summer. If it is, we add one to the year else return as is.

For each cycle we call `getReturnsForLicenceInCycle()` in `src/lib/services/returns/api-connector.js`. This creates a filter to search for returns by

```javascript
const filter = {
  licence_ref: licenceNumber,
  status: {
    $ne: 'void'
  },
  start_date: { $gte: cycle.startDate },
  end_date: { $lte: cycle.endDate },
  'metadata->>isSummer': cycle.isSummer ? 'true' : 'false'
}
```

Note, it is looking in and returning data from `returns.returns` via water-abstraction-returns API.

The combined results are returned to `getReturnsForLicenceInFinancialYear()` in `src/lib/services/returns/index.js`.

We then call `mapReturnsToModels()` in `src/lib/services/returns/returns-mapping-service.js`. It creates an 'external ID' based on the NALD region code and formatID in the meta data of the return.

A uniq array of `externalIDs` is generated from these values and for each one we call `getReturnRequirementByExternalId()` in `src/lib/services/return-requirements.js`. This searches for a `water.return_requirement` with a matching externalID.

The array of `ReturnRequirement` model instances are returned to `mapReturnsToModels()`. It then uses `mapReturnDataToModel()` to combine the data in `returns.returns` and that in `water.return_requirements` to create an instance of `Return` model.

The array of `Return` instances are passed back to `getReturnsForLicenceInFinancialYear()` in `src/lib/services/returns/index.js`. It then decorates each one using `decorateWithCurrentVersion()`.

In `decorateWithCurrentVersion()` if the return's status is not completed then we just return the `Return` unchanged. Else we get the current version (which is `returns.versions`) for our Return. This is done by getting all the `returns.versions` with the same return ID, sorting descending by version number, and then returning the first. If that results in nothing we again just return the Return unchanged.

If the version is not a 'nil return' then we get the lines for the matching `returns.lines` for the return version. This is then passed to `returnsServiceToModel()` in `src/lib/mappers/return-version.js` which maps the data onto a `ReturnVersion` model instance. This instance is added to a new `returnVersions[]` property on the Return instance.

#### createTPTChargeElementGroup

Creates a charge element group by first creating a ChargeElementContainer for each charge element linked to the charge version. The ChargeElementContainer is instantiated with the charge element and the previously calculated charge period.

##### CEC date range

As part of this we 'refresh' the CEC instance which includes setting the dateRange using `getChargeElementRange()`. It checks whether the charge element has a time limited period. If it doesn't we just return the previously calculated charge period. If it does have one we return the intersection of the time limited period and the charge period. If there is no intersection we retun null (empty date range).

It then uses this information to instantiate a summer and winter BillingVolume. The ChargeElementContainer has a series of other helper methods for extracting calculated information, for example abstraction days, using all this information.

The array of ChargeElementContainers is passed to the ChargeElementGroup constructor and we return the ChargeElementGroup instance.

It then chains a call to `createForChargePeriod()`. This filters the list of CEC's in the CEG and creates a new instance of CEG based on CEC's with a date range i.e the charge elements date range overlaps the charge period we calculated.The new instance is returned.

It then chains a call to `createForTwoPartTariff()`. This filters the list of CEC's in the CEG and creates a new instance of CEG based on CEC's which are 2PT i.e. the charge element has section 127 agreement enabled and is linked to a purpose use that is 2PT. The new instance is returned.

We then call `setFinancialYear()` on the CEG instance. This goes through each CEC and sets its financial year. This involves setting the `financialYear` property of the 2 billing volume instances (summer and winter) that were created when the CEC was instantiated.

`setFinancialYear()` returns itself so the end result of this chaining is a CEG containing CEC's that have date ranges that overlap the charge period and are 2PT, and all CEC's have their billing volume financial year periods set to the current financial year we are calculating.

> Back in matchVolumes()!

Call `match()` in `src/modules/billing/services/volume-matching-service/matching-service.js`. Set the `returnSeason` on the CEG.

Then if the returnGroup has an error code that is not '50' ('late returns') we call `setTwoPartTariffStatus()` on the CEG. This then calls `setTwoPartTariffStatus()` on each CEC it contains. This calls `setTwoPartTariffStatus()` on the billing volume with the matching return season (summer or winter). This sets the 2pt status to the CEG error code.

  Then if `assignBillableStatuses` includes the error code passed in we set the calculated volume to null and the volume to

  - if the billable volume's `isSummer` flag matches the `isSummer` flag passed in we set volume to billableVolume (billableVolume is passed in and taken from the charge element ans `isSummer` from the CEC)
  - 0 if not

  The CEC isSummer is calculated from the charge element's abstraction period. This calls `getAbstractionPeriod()` in the wabs-helpers. It determines whether the charge element's abstraction period falls within the summer period.

  We set `twoPartTariffError` on the billing volume if the error code is included in the `errorFlagStatuses`.

  We then call `toBillingVolumes()` on the CEG. It creates an array by ietrating through its CEC's and extracting their billing volumes. We filter based on those that match our `isSummer` flag. On the filtered billing volumes we call `setVolumeFromCalculatedVolume()`, then return them.

  `setVolumeFromCalculatedVolume()` checks the first that the billing volume is not approved. Then if the `twoPartTariffStatus` is not in `assignedBillableStatuses` we

  - check the calcvulated Volume is an instance of Decimal (a dependency we brought in creates this type)
  - if so convert it again to a Decimal with 6 places and then convert `toNumber()` and set volume to it
  - else just set volume to calculated volume

  If it is in `assignedBillableStatuses` then set `calculatedVolume` to `volume`.

Then if the returnGroup has an error code that is '50' ('late returns') we call `setTwoPartTariffStatus()` on the CEG.

We then call `matchReturnGroup()`. First, get from the `returnGroup` every return with current version set to 'true'. Then iterate over the results and create a list of charge elements for the return. We do this by calling `createForReturn()` on the CEG. This filters it's CEC's by calling `isReturnPurposeUseMatch()` which looks through the returns purpose uses for any where `isPurposeUseMatch()` returns true. This involves comparing the purpose use ID of the charge element against the purpose use of the return.

With our new list of CEC's create a new CEG and return it.

Then, for the return's current version call `getReturnLinesForBilling()`. This will filter it's return lines by those that

- have a value in volume
- the abstraction period date overlpas the return line's date range
- the return line's date range overlaps the charge period

Then iterate these filtered lines and call `createForReturnLine()` on CEG for each one.

This iterates its CEC list and for each calls `isReturnLineMatch()`. This checks whether the return line's date range overlaps the charge element's abstraction period date range. And the CEC's date range overlaps the return line's date range.

Only those CEC's which match are returned. We then create a new CEG instance based on the filtered list and return it.

`getScore()` in the CEC calculates the score. The score is based on the more abstraction days you have the higher the score. However, priority is given those that score lower, and we immediately deduct 1000 from any CEC's that are summer, or a supported source. This effectively bumps the CEC to the top based on how we sort them.

We then check if the return line using `isReturnLineStraddlingChargePeriodError()`.  If it is daily or the chargeperiod we are using aligns with the full financial year we return false. If the return line is within the charge period we return false. Else we return true.

If true was returned we set the TwoPartTariffStatus on the CEG to `ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD`.

We then group the sorted CEC's (based on their score) by the purpose use ID's of the purpose use linked to the charge element.

We finish by creating a new array of CEG's populated with the grouped CEC's plus the `returnSeason` and return this result to `matchReturnGroup()`.

`matchReturnGroup()` then calls `allocateReturnLine()` which summates the volume of every CEG. Then we iterate through the CEG's and divide the total volume by the volume of each CEG which gives us a `purposeRatio`.

The `returnline.volume` is then divided by 1000 to give us mega litres. `qty` is then calculated as `purposeRatio` * `returnlineVolumeInML` and this gets allocated to the CEG by calling its `allocate()` method.

`allocate()` uses `reduce()` on its CEC's to allocate part of the `qty` to each CEC. The allocation is decided based on calling
> TODO: Document the DateRange class
> Uses moment-range under all this and its overlaps method. Take for example
> DateRange('2016-03-10', '2016-03-29)
