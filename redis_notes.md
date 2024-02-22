# Redis notes

> [..] in-memory data store used by millions of developers as a database, cache, streaming engine, and message broker.

Each environment, whether local or in AWS, has one [Redis](https://redis.io/) instance.

> The AWS environments do have 2 but they are configured for redundancy so in real terms all apps see the same instance

It is primarily used for storing [BullMQ jobs](https://docs.bullmq.io/guide/jobs) though some repos also use it for caching responses.

However, they use different databases within the same instance. This is done by specifying a [DB Number](https://redis.io/commands/select/) in the Redis connection config.

The repos that use Redis and which DB they are using is listed below for reference

| App         | Live | Test |
|-------------|------|------|
| import      | 0    | -    |
| service     | 2    | 4    |
| external UI | 0    | 5    |
| internal UI | 1    | 6    |
