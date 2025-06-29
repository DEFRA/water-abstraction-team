# Licences with a primary user

- **Business**
- **2025-03-20**
- [WATER-4969](https://eaflood.atlassian.net/browse/WATER-4969)

> We are looking to do a comms drop to registered users, possibly with a questionnaire or just as a request to get involved in User Research for the Water Availability Discovery.
>
> There is also the need to be able to structure these by area, and industry so it feels like a bespoke report is required rather than re-using the [James report](https://eaflood.atlassian.net/browse/WATER-4047) (my initial plan).
>
>Therefore could we run a report against Production data and pull out:
>
> - email address of all “Primary Users”
> - Account creation date
> - Last logged in Date
> - Secondary Use Description where there are multiple we could group on the most common or if there is 2 just pick one.
> - EA Area
> - email address of secondary users linked to licence.
> - Licences registered to them

> This can replace the regular report we run for James, and ticks off most of the improvements they have requested as well. Could this be run in before:  3/4/25.

This is built on an earlier version we built (added for reference below). The extra information comes at a cost. The report takes a lot longer to run, and the results are no longer as 'neat'.

Thanks to our work on rebuilding the returns notifications, we’ve gained a better understanding of how ‘users’ link to a licence. For example, a primary user can be linked to multiple licences as the primary user but could also be linked to others as a secondary user.

This means a report where you mix users and licences is always going to feature both appearing to be duplicated.

Added to that is the request for secondary purpose description. We’ve used just the current version of each licence, but even still, multiple purposes can be linked to a licence version, which means a licence can have multiple secondary purposes. Like secondary users, that extra criteria means even more results will be returned. To limit this, we’ve grouped them.

## Query

```sql
SELECT
  e.entity_nm,
  er."role",
  least(u.date_created, e.created_at) AS created_on,
  u.last_login,
  licences.licence_ref,
  licences.region_name,
  licences.secondary_uses
FROM (
  SELECT
    l.licence_ref,
    r.display_name AS region_name,
    (
      SELECT array_agg(uses.description) FROM (
        SELECT DISTINCT ps.description FROM water.licence_versions lv
        INNER JOIN water.licence_version_purposes lvp ON lvp.licence_version_id = lv.licence_version_id
        INNER JOIN water.purposes_secondary ps ON ps.purpose_secondary_id = lvp.purpose_secondary_id
        WHERE lv.status = 'current' AND lv.licence_id = l.licence_id
      ) uses
    ) AS secondary_uses
  FROM
    water.licences l
  INNER JOIN water.regions r ON
    r.region_id = l.region_id
) licences
INNER JOIN crm.document_header dh ON
  dh.system_external_id = licences.licence_ref
INNER JOIN crm.entity_roles er ON
  dh.company_entity_id = er.company_entity_id
INNER JOIN crm.entity e ON
  e.entity_id = er.entity_id
INNER JOIN permit.licence pl ON
  pl.licence_id = dh.system_internal_id::INTEGER
INNER JOIN idm.users u ON
  u.external_id = e.entity_id
WHERE
  er."role" IN ('primary_user', 'user_returns', 'agent')
ORDER BY e.entity_nm, licences.licence_ref ASC;
```

## Original query

```sql
SELECT
  l.licence_id,
  l.licence_ref,
  e.entity_nm,
  er."role",
  (pl.licence_id) AS internal_id
FROM
  water.licences l
INNER JOIN crm.document_header dh ON
  dh.system_external_id = l.licence_ref
INNER JOIN crm.entity_roles er ON
  dh.company_entity_id = er.company_entity_id
INNER JOIN crm.entity e ON
  e.entity_id = er.entity_id
INNER JOIN permit.licence pl ON
  pl.licence_id = dh.system_internal_id::INTEGER
WHERE
  er."role" = 'primary_user'
```
