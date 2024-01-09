# Jobs

Jobs is a 'fuzzy' term within the service. Typically when we think of jobs we think of background processes that are run on a scheduled basis. Often they are long running processes you have running overnight to avoid impacting the user experience.

In WRLS though, the term also applies to many tasks linked to interactions kicked off by a user, for example, sending an email reminder or creating a bill run. This is because of [message-queue](https://en.wikipedia.org/wiki/Message_queue) technologies the previous team implemented.

> Jobs is a _massive_ part of the WRLS legacy code base and was heavily relied upon by the previous delivery team. We're doing what we can to document what we find. That said, please do not take this as 100% verbatim or accurate. There are massive inconsistencies in approach, implementation, and even the technologies used. Do not be surprised to find something that contradicts what we say here!

## Queue types

There are two message-queue technologies implemented in the legacy service; [pg-boss](https://github.com/timgit/pg-boss) and [BullMQ](https://docs.bullmq.io/). Both use the concept of queues and workers, with 'jobs' being represented as the things added to queues to be done.

Also, in both cases it is common to see what we think of as a 'job' being split up into multiple jobs. For example, as a team we'll refer to the 'NALD import job'. But when implemented in **water-abstraction-import** this becomes

1. `nald-import.s3-download`
1. `nald-import.delete-removed-documents`
1. `nald-import.queue-licences`
1. `nald-import.import-licence`

Each step in the process is its own job. This is because in both queue systems jobs are supposed to be small, discreet actions. For example, **BullMQ** has a default setting of 30 seconds for a job to complete before it starts treating it as stalled. Because of this we see 2 approaches implemented by the previous team.

- long processes become many small 'jobs'
- config is amended to allow for bigger 'jobs' (we've seen config that changes the time allowed to be in hours!)

### pg-boss

This is a [PostgreSQL](https://www.postgresql.org/) backed queuing system. It is used in [water-abstraction-import](https://github.com/DEFRA/water-abstraction-import).

### BullMQ

This is a [Redis](https://redis.io/) backed queuing system. It is used in [water-abstraction-service](https://github.com/DEFRA/water-abstraction-service). Anecdotally we understand **water-abstraction-service** started out using pg-boss. But they believed part of their performance issues was **pg-boss** being PostgreSQL based slowed it down. So, they switched to **BullMQ** to try and speed things up.

## Background jobs

Trying to document all the 'jobs' within the service is beyond the scope of this document. So, we've focused on those that are intended to be run in the background according to some form of schedule.

Refer to the following guides for what background jobs are running in each app

- [water-abstraction-import](/jobs/import.md)
- [water-abstraction-service](/jobs/service.md)
- [water-abstraction-system](/jobs/system.md)
