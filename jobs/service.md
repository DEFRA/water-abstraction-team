# Water Abstraction Service

> <https://github.com/DEFRA/water-abstraction-service>

This uses the [BullMQ](https://docs.bullmq.io/) message-queue to manage its background jobs.

## Scheduling

The first 'job' in a background process will be added to a queue with some scheduling config. It will either use [cron](https://en.wikipedia.org/wiki/Cron) syntax.

```javascript
// src/modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise.js
const createMessage = () => ([
  JOB_NAME,
  {},
  {
    jobId: `${JOB_NAME}.${moment().format('YYYYMMDD')}`,
    repeat: {
      cron: config.import.digitiseToLVPCSyncCronExp
    }
  }
])

// config.js
import: {
    digitiseToLVPCSyncCronExp: '0 18 * * *',
    digitiseToLicenceGaugingStationsCronExp: '0 18 * * *'
  },
```

Or it will set a fixed amount of milliseconds between repetitions.

```javascript
// src/modules/batch-notifications/lib/jobs/check-status.js
const createMessage = () => {
  logger.info(`Create Message ${JOB_NAME}`)
  return [
    JOB_NAME,
    {},
    {
      jobId: JOB_NAME,
      repeat: {
        every: config.jobs.batchNotifications.checkStatus
      }
    }
  ]
}

// config.js
import: {
    gaugingStationsSyncFrequencyInMS: 21600000,
    chargeCategoriesSyncFrequencyInMS: 21600000,
  },
```

A good place to start when looking at background jobs is those handled in `src/lib/queue-manager/start-up-jobs-service.js`.

## Jobs

The jobs appear to be grouped by what they are related to.

- Billing
  - [Charge Categories Sync](#charge-categories-sync)
  - [Check for updated invoice accounts](#check-for-updated-invoice-accounts)
  - [Customer file refresh](#customer-file-refresh)
- Charge versions
  - [Licence not in charge version workflow](#licence-not-in-charge-version-workflow)
- Gauging stations
  - [Digitise To Licence Gauging Stations](#digitise-to-licence-gauging-stations)
  - [Digitise to Licence Version Purpose (LVP) Sync](#digitise-to-licence-version-purpose-lvp-sync)
  - [Gauging Stations Sync](#gauging-stations-sync)
- Notifications (Stuff to and from [Notify](https://www.notifications.service.gov.uk/))
  - [Check status](#check-status)
  - [Refresh event](#refresh-event)
  - [Send message](#send-message)

### Charge Categories Sync

- **request** N/A
- **Schedule** Every 6 hours from time app restarts

> Syncs Charge Categories from CSV file stored on S3 bucket

There is a CSV file (`billing-metadata/charge-categories.csv`) held in the `wabs3-maintenance` bucket which contains a list of gauging stations.

Every 6 hours this job checks for changes and either inserts or updates the changes. It is also pointless!

There has never been a change in the file since it was first dropped. Also, because it sits in the `production`` bucket we couldn't upload a different one without a **Normal** RfC. This means we'd need to wait 10 business days for the changes to appear.

If the data had been managed using a seed file and/or migrations there would be no need for the job and all associated code. We'd also be able to release the changes under a **Standard** RfC, which means the changes could appear as quickly as the next day.

### Check for updated invoice accounts

- **request** N/A
- **Schedule** Every 12th hour of the day (00:00, and 12:00)

> This job grabs a list of the invoice accounts whose entities have a mismatch between last_hash and current_hash.
>
> It then emails the NALD service mailbox with the details

We have no other details on this job other than what you can determine in `src/modules/billing/jobs/check-for-updated-invoice-accounts.js`.

### Check status

- **request** N/A
- **Schedule** Every 15 seconds from time app restarts

We think this job looks for outstanding Notify status updates for messages yet to be updated with one.

### Customer file refresh

- **request** N/A
- **Schedule** Every 1 hour from time app restarts

This checks the [Charging Module](https://github.com/DEFRA/sroc-charging-module-api) to see what customer change files have been generated in the last 7 days.

For each result the job extracts which billing accounts were in the files and updates our copy of the record with the customer file reference.

This allows users to see when a billing account was last updated and in what file sent to SSCL the change was in.

### Digitise To Licence Gauging Stations

- **request** N/A
- **Schedule** 18:00 every day

> Syncs licence gauging station linkages from Digitise data with the into `water.licence_gauging_stations`

We have no other details on this job other than what you can determine in `src/modules/gauging-stations/jobs/sync-licence-gauging-stations-from-digitise.js`.

### Digitise to Licence Version Purpose (LVP) Sync

- **request** N/A
- **Schedule** 18:00 every day

> Syncs licence conditions from Digitise data with the into `water.licence_version_purpose_conditions`

We have no other details on this job other than what you can determine in `src/modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise.js`.

### Gauging Stations Sync

- **request** N/A
- **Schedule** Every 6 hours from time app restarts

> Syncs gauging stations from CSV on S3

There is a CSV file (`gauging-stations/gauging-stations.csv`) held in the `wabs3-maintenance` bucket which contains a list of gauging stations.

Every 6 hours this job checks for changes and either inserts or updates the changes. It is also pointless for exactly the same reasons as [Charge Categories Sync](#charge-categories-sync)!

### Licence not in charge version workflow

- **request** N/A
- **Schedule** Every 6th hour of the day (00:00, 06:00, 12:00, and 18:00)

We _think_ this job looks for licences that do not have a charge version. For those it finds it creates a `water.charge_version_workflow` record. We as yet have had no need to interact with this table so we don't know what then happens with the information.

### Refresh event

- **request** N/A
- **Schedule** Every 1 minute from time app restarts

This job is related to updating `water.event` records related to sending notifications to Notify.

We have no other details on this job other than what you can determine in `src/modules/batch-notifications/lib/jobs/refresh-event.js`.

### Send message

- **request** N/A
- **Schedule** Every 15 seconds from time app restarts

We think this job looks for outstanding notifications to be sent to Notify. It will then handle sending the notification to Notify for any that it finds.
