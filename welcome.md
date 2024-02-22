# Welcome

This guide assumes it's your first day with the team and that it is possibly one of the first things you'll read!

We think you're joining a great team who will do everything they can to support you and get you up to speed. So, we cover the basics here and things we think it is worth knowing whilst trying to keep it short. We don't want you running away! 😁

## Contents

- [Why are we here?](#why-are-we-here)
- [Where are we now?](#where-are-we-now)
- [What is the service?](#what-is-the-service)
- [The tech](#the-tech)
- [It's my first day](#its-my-first-day)

## Why are we here?

If you want to abstract (extract or remove) a significant amount of water ([megalitres](https://www.seqwater.com.au/sites/default/files/2019-09/Seqwater%20-%20What%20is%20a%20megalitre.pdf) is our standard unit of measure) from the environment you need a licence. [Environment Agency](https://www.gov.uk/government/organisations/environment-agency) is the organisation responsible for granting and managing licences. A licence grants its current holder the right to abstract a certain amount of water, from a particular point, for a specific activity.

> This is a very, _very_ simplified definition! The team's subject matter exports will provide a much better definition.

The first iteration of the service (2018) provided users with an ability to view a 'simplified' version of their licence. Submitting returns (records of how much water exactly was abstracted) and sending alerts came next. Then working out the charge for the water abstracted.

## Where are we now?

In 2022 the way the charge is calculated changed. The current rules are referred to as SROC ([Strategic Review of Charges](https://www.gov.uk/government/news/strategic-review-of-charges-consultation-launched)) and the previous rules as PRESROC. The service fully supports the PRESROC rules and we are only now coming to the end of implementing support for the SROC version.

The next big thing is about how submitting returns is managed and a long list of others for the the future.

## What is the service?

Like the [Ship of Theseus](https://en.wikipedia.org/wiki/Ship_of_Theseus) the **Water team** has changed considerably over the years. The team who built and designed the original service are completely different from those of us who maintain it now.

In terms of users and traffic it is very low. Concurrent users don't get above double digits. There are also no significant peaks of usage (certain times do see an increase but nothing significant).

Functionality for external users is limited. The bulk of the functionality is to support internal users.

In 'technical' terms there are no complex features or requirements. We're not required to perform wizardry with geographic data or incorporate our own AI for example.

The complexity comes in trying to apply complex charging rules to data that throughout most of its life was unstructured and document based (the earliest licences date from the 1960s).

## The tech

Everything we build is done using [Node.js](https://nodejs.org/en) (we have just completed upgrading the service from Node 14 to Node 20). Currently, the modules are [CommonJS](https://en.wikipedia.org/wiki/CommonJS) though we intend to move to ESM in the future.

The primary database is [PostgreSQL](https://www.postgresql.org/). [Redis](https://redis.io/) is used to support the message queues the service depends on.

The UI is built from the [GOV.UK Frontend](https://www.npmjs.com/package/govuk-frontend) and the components found in the [Design system](https://design-system.service.gov.uk/). These depend on the [Nunjucks templating engine](https://mozilla.github.io/nunjucks/).

The key thing to know is that the [Hapi framework](https://hapi.dev/) rather than [Express](https://expressjs.com/) is used to build the service.

This means we also use [Lab](https://hapi.dev/module/lab/) and [Code](https://hapi.dev/module/code/) for unit testing. Acceptance testing is done using [Cypress](https://www.cypress.io/).

The service is hosted in [AWS on EC2 instances](https://aws.amazon.com/ec2/). We deploy to them using a [Jenkins instance](https://www.jenkins.io/) and [pipelines](https://www.jenkins.io/doc/book/pipeline/).

The instances use [PM2](https://pm2.keymetrics.io/) to manage the 'apps' (see [Architecture - then](#architecture---then)).

The final thing to know is we use [Objection.js](https://vincit.github.io/objection.js/) as our [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) which is built on a SQL query builder called [Knex](http://knexjs.org/).

### Architecture - then

They opted for a microservice architecture, comprised of 9 applications (the word 'service' crops up all over the place meaning different things. So, we refer to the 'running' services as applications or apps). Those 9 apps were based on 8 primary repositories with a handful of supporting package repos.

The primary database is [PostgreSQL](https://www.postgresql.org/). The team took advantage of [schemas](https://www.postgresql.org/docs/current/ddl-schemas.html) so though only 1 DB is created, each app manages it's own data within a matching schema (sort of!).

The apps were primarily domain based (CRM, IDM, Returns, etc). So, if the `returns` app needs to check a user, it will request the info from the `idm` app.

Where apps have processes that involve many steps or transactions it was decided to use message queues to manage them. So, often a multi-step process will be broken in various 'jobs'. When the first 'job' is complete it will add the next step in the process as a 'job'. Workers monitor the queues for these jobs and process them as they see them.

### Architecture - Now

Everything that was found when the current team took over is now defined as 'legacy'. We still have to maintain the legacy code and infrastructure. But the plan is to move all functionality to a single app, repo and schema and then retire everything that is 'legacy'.

So, all new work takes place in [water-abstraction-system](https://github/DEFRA/water-abstraction-system) (`water-abstraction-service` was already taken!). That covers completely new work, or where we have to make significant changes to something in the legacy code. When this happens we'll rewrite it in our new repo.

A major challenge is the legacy data. Not only is it split across schemas, naming conventions have not always been followed and what has been used is inconsistent. Also, table names will differ from entity names in the code, which in turn will differ to the names used in the UI. At the time of writing this guide, we're in the process of using [Updatable Views](https://www.postgresql.org/docs/current/sql-createview.html) to resolve these issues and give the impression everything is in a single schema.

_When_ we achieve our goal of a single app (!) the final step will be to host the service using [AWS ECS](https://aws.amazon.com/ecs/) (Docker being [Defra's standard](https://github.com/DEFRA/software-development-standards/blob/master/standards/deployment_standards.md#we-use-docker-containers-for-delivery-of-all-bespoke-software-being-deployed-to-aws-and-azure) for app deployment).

### Repos

A listing of the various legacy and current repos we are responsible for.

> The current team has been focused on specific areas according to the needs of the service. This means there are repos we have had little opportunity to work with, and in some cases none at all!

#### Legacy repos

- [water-abstraction-import](https://github.com/DEFRA/water-abstraction-import) - The creation and management of water licences themselves is done in another system. The import app is responsible for handling the import of data from that system to support ours. It also provides an API to an another service (outside the team) for extracting returns data
- [water-abstraction-permit-repository](https://github.com/DEFRA/water-abstraction-permit-repository) - The original plan was that all 'permits', not just water licences would be stored in a single place accessible via an API. That never happened and it is only used by WRLS. Older functionality in the service still depends on this service for licence information.
- [water-abstraction-returns](https://github.com/DEFRA/water-abstraction-returns) - Handles most of the returns data. Is essentially a CRUD interface to the returns tables
- [water-abstraction-service](https://github.com/DEFRA/water-abstraction-service) - The backbone of the legacy service. Most functionality is here. The `water-abstraction-ui` uses this as it's primary backend. At some point the previous team opted to manage all new data using this service rather than create more microservices, for example, charging data is found in its schema. The majority of our maintenance work is done in this repo. The current team made a change which means the code is used to drive 2 apps
- [water-abstraction-tactical-crm](https://github.com/DEFRA/water-abstraction-tactical-crm) - Was a tactical solution whilst the team waited for a strategic 'single view of the customer' to be delivered. This never happened. Because of this the previous team made an incomplete attempt to migrate to a less generic customer table schema. So, this one apps interacts with 2 schemas! However, it again is just a CRUD interface to the customer data based tables
- [water-abstraction-tactical-idm](https://github.com/DEFRA/water-abstraction-tactical-idm) - Was a tactical solution whilst the team waited for a strategic 'single view of the customer' (as a user) to be delivered. This never happened. Now it is just a CRUD interface to the user data based tables
- [water-abstraction-ui](https://github.com/DEFRA/water-abstraction-ui) - Frontend for the service. The repo contains the code for both the external and internal apps. Using **PM2** each are run as a separate app.

#### Legacy packages

- [hapi-pg-rest-api](https://github.com/DEFRA/hapi-pg-rest-api) - Built to automatically generate a REST API for a specified table. This is used sporadically across the various repos. We find older apps and endpoints use it but at some point the previous team chose to abandon it
- [node-hapi-airbrake-js](https://github.com/DEFRA/node-hapi-airbrake-js) - A Hapi plugin wrapper for [airbrake-js](https://www.npmjs.com/package/airbrake-js) which is used to automatically capture errors and report them to a central service. Was forked from something another Defra team made, neither of which have been maintained (and **airbrake-js** is deprecated)
- [water-abstraction-helpers](https://github.com/DEFRA/water-abstraction-helpers) - Shared code used across the legacy repos

#### Current repos

- [water-abstraction-acceptance-tests](https://github.com/DEFRA/water-abstraction-acceptance-tests) - Houses our Cypress acceptance tests. These were inherited from the previous team but were maintained inside the `water-abstraction-ui` repo. This made it hard to update dependencies and run them against our environments. Plus they used Cypress v8 and did not have test isolation so all had to be restructured. We used the opportunity to move them to their own repo
- [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) - Home of all future work and where one day we hope all legacy functionality will be migrated to. Acts as both a frontend and an API. New background tasks, for example, are triggered by calls from the legacy UI. But also as time goes on either the UI redirects to, are has links to pages in `water-abstraction-system`. We hope you like it, because it is where you'll be spending most of your time 😅❤️
- [water-abstraction-team](https://github.com/DEFRA/water-abstraction-team) - Home of this guide, and others like our [Coding conventions](/coding_conventions.md) and [Ways of working](ways_of_working.md). As developers we are most comfortable maintaining our documentation using git and GitHub. We already work with both plus markdown for documentation. Doing it in this way means as a team we can still peer review contributions made and use the commit history to see how things have changed over time. This is also the place we maintain our central list of issues. These are specific to our work maintaining the service, for example, a problem with our local environment or an idea for a new team guide. Actual bugs/issues should be recorded in the backlog in [Jira](https://eaflood.atlassian.net/jira/software/c/projects/WATER/boards/96)

#### Other repos

We have a few other repos which are hosted on an internal [GitLab](https://about.gitlab.com/). You'll need to complete the service request mentioned in [It's my first day](#its-my-first-day) before you can access them.

- **wal-address-facade-1-1** - Contains our address lookup API. (It's a long story why it is here 😩)
- **wal-dev-environment** - Everything you need to build a working WRLS environment on your machine. This is the environment the current team build, run and use when making changes to the service
- **wal-jenkins** - The Jenkins pipelines that handle our deployment

## It's my first day

First of all, well done, you've found this page and made it this far! You probably have a standard Defra laptop (referred to as on-net or 'the brick') but are still waiting on your Mac (your off-net) machine.

The on-net is a locked down machine where you can access the intranet, your email, and MS Teams which you'll need for calls with the wider delivery team. But because of the restrictions on them, we can't use them for development.

You'll also be supplied with a Mac which has no restrictions, but which must never be connected to the main Defra network (hence off-net). Problem is, this normally takes a few days to arrive after your first day and you'll need this before you can get a local environment up and running.

So, we're afraid your first day or two is likely to be reading stuff or listening to people. Feel free to use this time to also dig into any of the technologies you are not familiar with.

### Do this first

The team tech lead needs to submit a [CCOE Azure/AWS Non-Production Service Request](https://defragroup.service-now.com/esc?id=sc_cat_item&table=sc_cat_item&sys_id=cedac95b1b224510adf0eb53b24bcb63) on the **myIT** portal to ensure you have access to

- our Jenkins instance
- our GitLab instance
- our environments via a VPN account they'll create for you
- the AWS console for non-production logs

This request will go to our fabulous friends on the AWS web-ops team who will get all this sorted for you.

Feel free to ask whether they have remembered to do this!

## I have my Mac

Fantastic! We can now get the ball rolling on setting up your local environment. If it's not been cleaned down nicely feel free to factory reset it. Then get yourself setup and ensure you are running the latest version of [macOS](https://en.wikipedia.org/wiki/MacOS).

We then ask that you enable [FileVault](https://support.apple.com/en-gb/guide/mac-help/mh11785/mac) and get yourself a Virus tool. We have no licences for this so you'll need to track down a free version. Current team favourite is [Avast](https://www.avast.com/en-gb/index#mac).

Then you'll need the following tools installed as a minimum

- [git](https://git-scm.com/) well duh!
- [OpenVPN](https://openvpn.net/client/) the VPN needs to be running to connect to our Jenkins and GitLab instances, and our AWS environments
- [Docker desktop](https://www.docker.com/products/docker-desktop/) the local development environment is built using Docker
- [Jitsi Meet](https://meet.jit.si/) an open source video conferencing tool we use. You won't be able to use MS Teams on the Mac and we have no money for commercial tools. So, instead the tech team use **Jitsi** as our video conferencing tool as it is not only free, but places no limits on meeting times
- [Slack](https://slack.com/intl/en-gb) again, because we can't use MS Teams on the Mac we use Slack as our messaging tool. We're not the only ones, so once you have it installed sign into <defra-digital.slack.com> using your Defra email address and then let us know so we can get you added to the channels we use
- [VSCode](https://code.visualstudio.com/) you are not required to use this as your IDE. But the current team are all VSCode users so the commands to build and maintain the local environment are baked into VSCode as custom tasks. Install it so we can help you get your local environment up and running. Then decide if you want to take what we have done and apply it to your editor of choice
