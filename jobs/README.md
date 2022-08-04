# Background jobs

Various background jobs exist within the service which are run by various apps. This is a guide to what jobs are running where, and when. As we learn more we'll also start recording what they are doing.

- [water-abstraction-import](/jobs/import.md)
- [water-abstraction-service](/jobs/service.md)

## Trigger types

We've so far found 2 ways that the background jobs are scheduled and triggered.

### Cron

Specifically, [node-cron](https://github.com/node-cron/node-cron) is used in some apps to schedule background jobs. You'll find the package listed as a dependency and often some form of [cron syntax](https://crontab.guru/) in `config.js`.

```javascript
// water-abstraction-import/config.js
import: {
    licences: {
      schedule: isProduction ? '0 4 * * 1,2,3,4,5' : '0 16 * * 1,2,3,4,5',
    },
    charging: {
      schedule: isProduction ? '0 1 * * 1,2,3,4,5' : '0 14 * * 1,2,3,4,5'
    },
    monitoring: {
      schedule: '* * * * *'
    }
  },
```

### BullMQ

These are harder to find because lots of the apps use BullMQ but don't necessarily schedule background jobs using it. The 'tell' is to look for jobs that contains `repeat:` config.

```javascript
// water-asbtraction-service/src/modules/batch-notifications/lib/jobs/check-status.js
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
```

The config it's referring to is normally a time in milliseconds to repeat the job.

```javascript
// water-abstraction-service/config.js
import: {
    gaugingStationsSyncFrequencyInMS: 21600000,
    chargeCategoriesSyncFrequencyInMS: 21600000,
    supportedSourcesSyncFrequencyInMS: 21600000,
  },
```
