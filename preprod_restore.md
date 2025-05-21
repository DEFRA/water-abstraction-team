# Restore PROD to PRE-PROD

There are times we need to restore the `production` database into our `pre-prodcution` environment, for example, UAT or investigating an issue.

Our web-ops team have provided a Jenkins job that restores the last `prod` backup using [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html).

What we have found is that if the apps are running, and the DB is not cleared beforehand issues can arise. So, we have a process that helps avoid this.

## Prep

Before running the job we need to prepare the environment.

### Stop all apps

You'll need to connect to AWS Console through the Defra AWS start page. Once in you should see `ddts-aws-preproduction` listed and when selected `wal_developers_sc_permissions`. Select this adopt that role when connecting to AWS console.

Within the console, ensure **Europe (Ireland)** is the region. Search for **EC2** (or select it from your 'Recently visited' list if there).

In the next page you'll see the **Resources** section, within which will be an **Instances (running)** link. Click it.

Search for `PREWAL` and you should find four instances are listed.

- `PREWALFESSRV001` Front end server 1
- `PREWALFESSRV002` Front end server 2
- `PREWALBESSRV001` Back end server 1
- `PREWALBESSRV001` Back end server 2

We only care about the back end servers. Tick `PREWALBESSRV001` and then on the right click the **Connect** button. You'll be taken to a new page. Select the **Session Manager** tab and then click the **Connect** button.

A new tab will open as a terminal connected to the instance. On the command line enter `pm2 stop all`. Then either click the **Terminate** button or type `exit` twice.

Repeat the same process for `PREWALBESSRV002`. You are done with the AWS console for now.

### Drop public views

> This assumes you have a connection to the pre-prod DB with write access. On developers with security clearance will have this.

Now we need to prep the DB next. The first step is to drop the views we create using [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) from the `public` schema. We do this first to avoid the errors you get when you try to delete them _after_ the source tables have been dropped.

In your DB tool of choice, connect to the `pre-prod` WRLS DB and open a new SQL script. The run the following.

```sql
DROP VIEW IF EXISTS addresses;
DROP VIEW IF EXISTS bill_licences;
DROP VIEW IF EXISTS bill_run_charge_version_years;
DROP VIEW IF EXISTS bill_run_volumes;
DROP VIEW IF EXISTS bill_runs;
DROP VIEW IF EXISTS billing_account_addresses;
DROP VIEW IF EXISTS billing_accounts;
DROP VIEW IF EXISTS bills;
DROP VIEW IF EXISTS change_reasons;
DROP VIEW IF EXISTS charge_categories;
DROP VIEW IF EXISTS charge_elements;
DROP VIEW IF EXISTS charge_references;
DROP VIEW IF EXISTS charge_version_notes;
DROP VIEW IF EXISTS charge_versions;
DROP VIEW IF EXISTS companies;
DROP VIEW IF EXISTS company_addresses;
DROP VIEW IF EXISTS company_contacts;
DROP VIEW IF EXISTS contacts;
DROP VIEW IF EXISTS events;
DROP VIEW IF EXISTS financial_agreements;
DROP VIEW IF EXISTS group_roles;
DROP VIEW IF EXISTS groups;
DROP VIEW IF EXISTS licence_agreements;
DROP VIEW IF EXISTS licence_document_headers;
DROP VIEW IF EXISTS licence_document_roles;
DROP VIEW IF EXISTS licence_documents;
DROP VIEW IF EXISTS licence_end_date_changes;
DROP VIEW IF EXISTS licence_entities;
DROP VIEW IF EXISTS licence_entity_roles;
DROP VIEW IF EXISTS licence_monitoring_stations;
DROP VIEW IF EXISTS licence_roles;
DROP VIEW IF EXISTS licence_supplementary_years;
DROP VIEW IF EXISTS licence_version_purpose_condition_types;
DROP VIEW IF EXISTS licence_version_purpose_conditions;
DROP VIEW IF EXISTS licence_version_purpose_points;
DROP VIEW IF EXISTS licence_version_purposes;
DROP VIEW IF EXISTS licence_versions;
DROP VIEW IF EXISTS licences;
DROP VIEW IF EXISTS mod_logs;
DROP VIEW IF EXISTS monitoring_stations;
DROP VIEW IF EXISTS notifications;
DROP VIEW IF EXISTS permit_licences;
DROP VIEW IF EXISTS points;
DROP VIEW IF EXISTS primary_purposes;
DROP VIEW IF EXISTS purposes;
DROP VIEW IF EXISTS regions;
DROP VIEW IF EXISTS return_cycles;
DROP VIEW IF EXISTS return_logs;
DROP VIEW IF EXISTS return_requirement_points;
DROP VIEW IF EXISTS return_requirement_purposes;
DROP VIEW IF EXISTS return_requirements;
DROP VIEW IF EXISTS return_submission_lines;
DROP VIEW IF EXISTS return_submissions;
DROP VIEW IF EXISTS return_versions;
DROP VIEW IF EXISTS review_charge_element_returns;
DROP VIEW IF EXISTS review_charge_elements;
DROP VIEW IF EXISTS review_charge_references;
DROP VIEW IF EXISTS review_charge_versions;
DROP VIEW IF EXISTS review_licences;
DROP VIEW IF EXISTS review_returns;
DROP VIEW IF EXISTS roles;
DROP VIEW IF EXISTS scheduled_notifications;
DROP VIEW IF EXISTS secondary_purposes;
DROP VIEW IF EXISTS sources;
DROP VIEW IF EXISTS transactions;
DROP VIEW IF EXISTS user_groups;
DROP VIEW IF EXISTS user_roles;
DROP VIEW IF EXISTS users;
DROP VIEW IF EXISTS workflows;
```

### Drop public tables

Next, there are some tables in the `public` schema used by the service. We want to drop these, but keep the schema.

Run the following SQL script.

```sql
DROP TABLE IF EXISTS public.knex_migrations;
DROP TABLE IF EXISTS public.knex_migrations_lock;
DROP TABLE IF EXISTS public."NALD_RET_LINES";
DROP TABLE IF EXISTS public.sessions;
```

### Drop legacy schemas

Now we're ready to drop the schemas that contain the existing data.

Run the following SQL script.

```sql
DROP SCHEMA IF EXISTS "crm" CASCADE;
DROP SCHEMA IF EXISTS "crm_v2" CASCADE;
DROP SCHEMA IF EXISTS "idm" CASCADE;
DROP SCHEMA IF EXISTS "import" CASCADE;
DROP SCHEMA IF EXISTS "migration" CASCADE;
DROP SCHEMA IF EXISTS "permit" CASCADE;
DROP SCHEMA IF EXISTS "returns" CASCADE;
DROP SCHEMA IF EXISTS "water" CASCADE;
DROP SCHEMA IF EXISTS "water_import" CASCADE;
```

## Restore

With the preparation complete, we can proceed with running the Jenkins job `WAL_PRE_99_DB_RESTORE`. This can take between 20 to 30 mins to complete.

Once done refresh your connection to the `pre-prod` database and check you can see the schemas, their tables, and our public views and tables restored.

## Restart

Repeat the same process you followed in [Stop all apps](#stop-all-apps) only this time run the command `pm2 restart --update-env all`.
