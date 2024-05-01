# Water Abstraction System

> <https://github.com/DEFRA/water-abstraction-system>

There is no message-queue in this app. Jobs are just standard processes triggered by sending a [HTTP POST](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST) to specific endpoints.

All jobs follow the same pattern

- a HTTP POST request is sent to `/jobs/my-job`
- the controller will trigger the service module which orchestrates the job but ***will not*** [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) it
- the controller responds with no body and a [204](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/204)
- the process continues to run in the background, logging as needed whilst avoiding unnecessary noise

## Scheduling

Scheduling is intended to be managed by external tooling that has the ability to also send a HTTP request. At the moment we use [Jenkins projects](https://www.jenkins.io/doc/book/using/working-with-projects/) which can be triggered using [cron](https://en.wikipedia.org/wiki/Cron) syntax.

The intent in the future (far future!) is to move the service to [Amazon ECS](https://aws.amazon.com/ecs/). Triggering jobs in this way gives us the flexibility to use ECS to launch containers dedicated to just running a job, and then self-terminating when done.

## Jobs

These are the currently implemented jobs.

### Export

- **request** `POST /jobs/export`
- **schedule** N/A

Export the entire DB to CSV and upload to [AWS S3](https://aws.amazon.com/s3/).

This is a fallback option should the overnight refresh of our DB to a read-only PostgreSQL instance fail. The export goes through each of the schemas, exports each table found to CSV, and then creates a [compressed tarball](https://computing.help.inf.ed.ac.uk/FAQ/whats-tarball-or-how-do-i-unpack-or-create-tgz-or-targz-file).

These schema `.tgz` files are then uploaded to AWS S3 where they can de downloaded. This was built to support the reporting needs of the service. It is not currently scheduled in `production`.

### Licence updates

- **request** `POST /jobs/licence-updates`
- **schedule** 08:15 every day

> Replaced a job in the legacy [water-abstraction-service](https://github.com/DEFRA/water-abstraction-service) which we had to replace when we found that BullMQ isn't reliably triggering scheduled jobs.

For context, putting a licence into workflow is a current practice to prevent them being billed until the Billing & Data team have had a chance to confirm all is well.

The job puts licences into 'workflow' that have a `licence_version` that was created in the last 2 months (from date the job is run). If the licence is already in 'workflow' or part of a PRESROC bill run it skips adding it. Hence, the 2 month window. This covers licences that, for example, were in a bill run that has now been 'sent', so can be added to workflow for checking.

Essentially, the current logic is premised that there is a 1-to-1 relationship between `licence_version` and `charge_version_workflows` where `deleted_date` is not null! This is what stops a licence continually being added back into workflow.

See [WATER-4437](https://eaflood.atlassian.net/browse/WATER-4437) for more details if needed.

### Time limited

- **request** `POST /jobs/time-limited`
- **schedule** 20:15 every day

Puts SROC licences into 'workflow' that have a related `purpose` that is due to expire in less than 50 days. See [WATER-3486](https://eaflood.atlassian.net/browse/WATER-3486) for more details if needed.
