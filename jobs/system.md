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

### Time limited

- **request** `POST /jobs/time-limited`
- **schedule** TBC

Puts SROC licences into 'workflow' that have a related `purpose` that is due to expire in less than 50 days. See [WATER-3486](https://eaflood.atlassian.net/browse/WATER-3486) for more details if needed.
