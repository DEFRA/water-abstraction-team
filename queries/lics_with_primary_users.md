# Licences with a primary user

- **Business**
- **2023-06-27**
- [WATER-4047](https://eaflood.atlassian.net/browse/WATER-4047)

> [We need to] monitor the impact the new roles are having on Registration etc in each area[. N]ow we have no/limited location data but [we believe we] can use the licence numbers to merge with NALD data in Power BI and pull together the benchmarks.
>
> However to do this we need to provide [them] with a list of Licences that are registered in the Service, so essentially the ask is could we create a quick report of Registered licences, the email address of the Primary User, and if possible the NGR (National Grid Reference) code of the licence.  The NGR code isn’t completely necessary, as they should be able to get it from NALD unless it’s really easy to do.
>
> Therefore could we do a quick data dump of Registered Licence Numbers and their associated email address?

This is the second time we have been asked to provide this data extract ([originally Jan 2023](https://eaflood.atlassian.net/browse/WATER-3872)). At that time we we analysed that extracting the NGR would be a massive task because of how it's been recorded in the system. That is still the case.

## Query

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
