# KPI report

- **TEAM**
- **2026-09-29**
- [WATER-5583](https://eaflood.atlassian.net/browse/WATER-5583)

We are working towards having the ability to calculate our cost per transaction month by month. To do this we need the total number of transactions per KPI for a date range. The definition of ‘what is a transaction’ is up for us to define and is a service specific thing. Here is our definition:

- A transaction is about task completion. A transaction must be measurable. A transaction can be for an internal or external task completion.

- A transaction is a real user outcome, not a system event. 

- A transaction is not a page view.

- A transaction is not task started, abandoned and not completed.

- Transaction (task) sizes (effort of difficulty) do not need to be similar.

## Usage

Update the `from_date` and `to_date` in the `params` CTE to the date range you require. For example, if you wanted to get the KPI figures for October 2025 you would set the `from_date` to '2025-10-01', and the `to_date` to '2025-11-01'.

Then run the SQL as a script and export the results.

```sql
WITH params AS (
  SELECT
    DATE '2022-01-01' AS from_date,   -- inclusive
    DATE '2027-01-01' AS to_date      -- exclusive
),

kpis AS (
  SELECT
    'Contacts updated' AS kpi,
    count(*) AS number_of_transactions
  FROM public.company_contacts cc
  INNER JOIN public.licence_roles lr ON cc.licence_role_id = lr.id
  CROSS JOIN params p
  WHERE lr.name = 'additionalContact'
    AND cc.updated_by IS NOT NULL
    AND cc.updated_at >= p.from_date
    AND cc.updated_at < p.to_date

  UNION ALL

  SELECT
    'Contacts created' AS kpi,
    count(*) AS number_of_transactions
  FROM public.company_contacts cc
  INNER JOIN public.licence_roles lr ON cc.licence_role_id = lr.id
  CROSS JOIN params p
  WHERE lr.name = 'additionalContact'
    AND cc.created_at >= p.from_date
    AND cc.created_at < p.to_date

  UNION ALL

  SELECT
    'Create an account - External' AS kpi,
    count(*) AS number_of_transactions
  FROM public.users u
  CROSS JOIN params p
  WHERE u.application = 'water_vml' -- selects only external accounts
    AND u.created_at >= p.from_date
    AND u.created_at < p.to_date

  UNION ALL

  SELECT
    'Create an account - Internal' AS kpi,
    count(*) AS number_of_transactions
  FROM public.users u
  CROSS JOIN params p
  WHERE (u.reset_guid IS NULL OR u.last_login IS NOT NULL) -- excludes accounts invited but never activated
    AND u.application = 'water_admin' -- selects only internal accounts
    AND u.created_at >= p.from_date
    AND u.created_at < p.to_date

  UNION ALL

  SELECT
    'Edit an account - Internal' AS kpi,
    count(*) AS number_of_transactions
  FROM public.events e
  CROSS JOIN params p
  WHERE e.type = 'update-user-roles'
    AND e.subtype = 'internal'
    AND e.created_at >= p.from_date
    AND e.created_at < p.to_date

  UNION ALL

  SELECT
    'Grant delegated access' AS kpi,
    count(*) AS number_of_transactions
  FROM public.notifications n
  CROSS JOIN params p
  WHERE n.message_ref IN ('share_new_user', 'share_existing_user')
    AND n.created_at >= p.from_date
    AND n.created_at < p.to_date

  UNION ALL

  -- A batch unregistration writes one row per licence, so distinct timestamps count the user action
  SELECT
    'Unregister licence - Internal' AS kpi,
    count(DISTINCT lu.created_at) AS number_of_transactions
  FROM public.licence_unregistrations lu
  CROSS JOIN params p
  WHERE lu.created_at >= p.from_date
    AND lu.created_at < p.to_date

  UNION ALL

  SELECT
    'Send water abstraction alerts' AS kpi,
    count(*) AS number_of_transactions
  FROM public.events e
  CROSS JOIN params p
  WHERE e.subtype = 'waterAbstractionAlerts'
    AND e.created_at >= p.from_date
    AND e.created_at < p.to_date

  UNION ALL

  SELECT
    'Password reset requests - External' AS kpi,
    count(*) AS number_of_transactions
  FROM public.notifications n
  INNER JOIN public.users u ON n.recipient = u.username
  CROSS JOIN params p
  WHERE n.message_ref = 'password_reset_email'
    AND u.application = 'water_vml' -- selects only external users
    AND n.created_at >= p.from_date
    AND n.created_at < p.to_date

  UNION ALL

  SELECT
    'Password reset requests - Internal' AS kpi,
    count(*) AS number_of_transactions
  FROM public.notifications n
  INNER JOIN public.users u ON n.recipient = u.username
  CROSS JOIN params p
  WHERE n.message_ref = 'password_reset_email'
    AND u.application = 'water_admin' -- selects only internal users
    AND n.created_at >= p.from_date
    AND n.created_at < p.to_date

  UNION ALL

  SELECT
    'Licence name change - External' AS kpi,
    count(*) AS number_of_transactions
  FROM public.events e
  CROSS JOIN params p
  WHERE e.type = 'licence:name'
    AND e.created_at >= p.from_date
    AND e.created_at < p.to_date

  UNION ALL

  SELECT
    'Create return version' AS kpi,
    count(*) AS number_of_transactions
  FROM public.return_versions rv
  CROSS JOIN params p
  WHERE rv.created_at >= p.from_date
    AND rv.created_at < p.to_date

  UNION ALL

  SELECT
    'Submit return - External' AS kpi,
    count(*) AS number_of_transactions
  FROM public.return_submissions rs
  CROSS JOIN params p
  WHERE rs.user_type = 'external'
    AND rs.created_at >= p.from_date
    AND rs.created_at < p.to_date
    AND NOT EXISTS ( -- filters out bulk uploads that successfully created a return submission
      SELECT 1
      FROM public.events e
      CROSS JOIN LATERAL jsonb_array_elements(e.metadata -> 'returns') AS r
      WHERE e.type = 'returns-upload'
        AND e.status = 'submitted'
        AND r ->> 'submitted' = 'true'
        AND r ->> 'returnId' = rs.return_id
    )

  UNION ALL

  SELECT
    'Submit/Edit return - Internal' AS kpi,
    count(*) AS number_of_transactions
  FROM public.return_submissions rs
  CROSS JOIN params p
  WHERE rs.user_type = 'internal'
    AND rs.created_at >= p.from_date
    AND rs.created_at < p.to_date

  UNION ALL

  SELECT
    'Submit bulk return' AS kpi,
    count(*) AS number_of_transactions
  FROM public.events e
  CROSS JOIN params p
  WHERE e.type = 'returns-upload'
    AND e.created_at >= p.from_date
    AND e.created_at < p.to_date

  UNION ALL

  SELECT
    'Send return notice - adhoc' AS kpi,
    count(*) AS number_of_transactions
  FROM public.events e
  CROSS JOIN params p
  WHERE e.type = 'notification'
    AND e.created_at >= p.from_date
    AND e.created_at < p.to_date
    AND EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.event_id = e.id
        AND n.message_ref IN ('paper return', 'returns invitation ad-hoc', 'returns reminder ad-hoc')
    )

  UNION ALL

  SELECT
    'Send return notice per cycle' AS kpi,
    count(*) AS number_of_transactions
  FROM public.events e
  CROSS JOIN params p
  WHERE e.type = 'notification'
    AND e.created_at >= p.from_date
    AND e.created_at < p.to_date
    AND EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.event_id = e.id
        AND n.message_ref IN ('returns invitation', 'returns reminder')
    )

  UNION ALL

  SELECT
    'Send adhoc renewal reminder' AS kpi,
    count(*) AS number_of_transactions
  FROM public.notifications n
  CROSS JOIN params p
  WHERE n.message_ref = 'renewal invitation ad-hoc'
    AND n.created_at >= p.from_date
    AND n.created_at < p.to_date

  UNION ALL

  SELECT
    'Create charge version' AS kpi,
    count(*) AS number_of_transactions
  FROM public.charge_versions cv
  CROSS JOIN params p
  WHERE cv.source = 'wrls'
    AND cv.created_at >= p.from_date
    AND cv.created_at < p.to_date

  UNION ALL

  SELECT
    'Tag a licence' AS kpi,
    count(*) AS number_of_transactions
  FROM public.licence_monitoring_stations lms
  CROSS JOIN params p
  WHERE lms.created_at >= p.from_date
    AND lms.created_at < p.to_date

  UNION ALL

  SELECT
    'Remove a tag' AS kpi,
    count(*) AS number_of_transactions
  FROM public.licence_monitoring_stations lms
  CROSS JOIN params p
  WHERE lms.deleted_at >= p.from_date
    AND lms.deleted_at < p.to_date

  UNION ALL

  SELECT
    'Set up a new charging agreement' AS kpi,
    count(*) AS number_of_transactions
  FROM public.licence_agreements la
  CROSS JOIN params p
  WHERE la.source = 'wrls'
    AND la.created_at >= p.from_date
    AND la.created_at < p.to_date

  UNION ALL

  SELECT
    'Create bill run' AS kpi,
    count(*) AS number_of_transactions
  FROM public.bill_runs br
  CROSS JOIN params p
  WHERE br.created_at >= p.from_date
    AND br.created_at < p.to_date

  UNION ALL

  SELECT
    'Send bill run' AS kpi,
    count(*) AS number_of_transactions
  FROM public.bill_runs br
  CROSS JOIN params p
  WHERE br.status = 'sent'
    AND br.source = 'wrls'
    AND br.updated_at >= p.from_date
    AND br.updated_at < p.to_date

  UNION ALL

  SELECT
    'Change billing account address' AS kpi,
    count(*) AS number_of_transactions
  FROM public.billing_account_addresses baa
  CROSS JOIN params p
  WHERE baa.end_date IS NOT NULL
    AND baa.updated_at >= p.from_date
    AND baa.updated_at < p.to_date

  UNION ALL

  SELECT
    'Remove licences from workflow' AS kpi,
    count(*) AS number_of_transactions
  FROM public.workflows w
  CROSS JOIN params p
  WHERE w.status = 'to_setup'
    AND w.deleted_at >= p.from_date
    AND w.deleted_at < p.to_date
)

SELECT kpi, number_of_transactions
FROM kpis
ORDER BY kpi;
```
