# Quarterly returns with superseded submissions

- **Business**
- **2026-08-04**
- [WATER-5764](https://eaflood.atlassian.net/browse/WATER-5764)

> One for you. I want to look at returns that have been superceded (so a second return has been submitted), would it be possible to get from Alan/others a cut of all superceded records from 01/04/2025 onwards for quarterly returns licences?

## Main query

```sql
SELECT
  r.id,
  r.return_id,
  r.licence_ref,
  r.start_date,
  r.end_date,
  r.due_date,
  r.received_date,
  v.version_number,
  v."current",
  v.nil_return,
  (SELECT
    SUM(l.quantity)
    FROM "returns".lines l
    WHERE l.version_id = v.version_id
  ) AS total_quantity
FROM
  "returns"."returns" r
INNER JOIN
  "returns".versions v
  ON v.return_log_id = r.id
WHERE
  r.status = 'completed'
  AND r.start_date >= '2025-04-01'
  AND r.quarterly = TRUE
  AND v.version_number > 1
ORDER BY
  r.licence_ref ASC,
  r.return_id ASC,
  v.version_number ASC;
```
