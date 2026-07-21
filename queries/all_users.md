# All users

- **Team**
- **2026-07-21**
- [WATER-5747](https://eaflood.atlassian.net/browse/WATER-5747)

A bug was reported because someone was blocked creating an internal user because it turns out they already have an external account (see [WATER-5739](https://eaflood.atlassian.net/browse/WATER-5739)).

There are scores of users with both internal and external accounts, and the legacy create user journey would have allowed this. It's just something we overlooked when we migrated the journey.

We've fixed the bug, but it has led to questions being asked about the state of the user accounts. This was requested to inform that discussion.

## Query

```sql
SELECT
  u.user_name,
  (CASE
    WHEN u.application = 'water_admin' THEN 'internal'
    WHEN u.application = 'water_vml' THEN 'external'
    ELSE 'unknown'
  END) AS user_type,
  u.last_login,
  u.enabled,
  u.date_created
FROM
  idm.users u
ORDER BY
  u.user_name ASC,
  u.application ASC;
```
