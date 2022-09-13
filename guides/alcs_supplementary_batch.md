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
  "financialYearEnding": 2022,
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
