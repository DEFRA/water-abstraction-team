# Schedule

This covers the schedule process for a 'release'. As per [sign-off](/releasing/sign_off.md), a release can involve one or more repos in the Water Abstraction Service.

- [Agree date and time for release](#agree-date-and-time-for-release)
- [Submit RfC](#submit-rfc)
- [Prepare a release note](#prepare-a-release-note)
- [Create calendar appointment](#create-calendar-appointment)
- [Comms](#comms)

## Agree date and time for release

For a **standard** or **normal** change release which does not require any downtime, makes no major changes to functionality, and just requires web-ops to click a button you can determine the date and time with little to no collaboration. Things to note

- avoid Fridays (web-ops and Change Management don't like them!)
- go for an AM release (this gives more time should something go wrong)
- pre-check the calendar for the web-ops and QA leads

This should also take into account the type of change being requested.

- **Standard** - theoretically, straight away. But normally within 3 days depending on web-ops schedule
  - This only applies to 'changes' that have been previously submitted and approved by change management. We have one for WRLS that covers basic releases to `production` (ones that just involve them clicking the deploy buttons 😁)
- **Normal** - release in 10 working days time or later
  - Approvals are sought by email by the Change management team before approving the RfC
- **Expedited** - release in 4-10 working days
  - The next Change Approval Board (CAB) will discuss the RfC. Someone from the team _may_ need to attend to answer any questions before they grant approval
- **Emergency** - release within 3 working days
  - An emergency CAB will convene to discuss the RfC. Someone from the team _will_ need to attend to answer any questions before they grant approval. These are _really_ discouraged by Change management and you _will_ be challenged on why it is needed.

If you need to co-ordinate the date and time for the release you will need to collaborate with these stakeholders.

- the delivery manager as they will liaise with the business leads
- the QA lead as they will need to be on hand to test the service after release
- web-ops as they perform all releases and updates to production environments

Unfortunately, until you actually submit the RfC it can be difficult to confirm exactly when the release will be. It has validation in place to ensure the change time frame is met. This is especially so with expedited and emergency changes as you will be endeavouring to find the earliest date and time possible!

## Submit RfC

Any service that is 'live' in Defra requires submitting a [Request for Change (RfC)](https://wiki.en.it-processmaps.com/index.php/Checklist_Request_for_Change_RFC) before changing anything in production.

This applies to _all_ changes. Even something as small as changing the value of an environment variable requires an RfC!

The RfC needs to be approved by DDTS Change Management before you can proceed with the release unless it's a pre-approved **standard** change.

Submit the RfC in [myIT](https://defra.service-now.com) (also known as **Service Now**). You'll need to be on the corporate network to access **myIT**. For those without a corporate laptop access from your phone is the only option 😞.

> _This will be added soon_
>
> Check out [our RfC guide](/rfc/README.md) for help with doing this.

## Prepare a release note

To ensure everyone involved in shipping the release is clear on what actions are needed, prepare a [release note](https://gitlab-dev.aws-int.defra.cloud/open/release-notes).

There are plenty of existing ones to base it on covering a number of different types of 'release'. As an example, a simple one would be

```markdown
# 20 October 2022

- RFC CHG0059773
- No downtime required
- Scheduled 8:30am to 10:30am

## About this release

Patch releases for most apps to cover dependency updates. Bumps for water-abstraction-service and water-abstraction-ui to cover support for SROC annual billing.

## Release process

This covers the steps involved for this release.

### Prior to release

- **web-ops** - Update property `DEPLOY_BRANCH=v3.0.0` in production `PRD_01_DEPLOY_SERVICE` job in Jenkins
- **web-ops** - Update property `DEPLOY_BRANCH=v2.25.1` in production `PRD_02_DEPLOY_TACTICAL_CRM` job in Jenkins
- **web-ops** - Update property `DEPLOY_BRANCH=v2.25.1` in production `PRD_03_DEPLOY_TACTICAL_IDM` job in Jenkins
- **web-ops** - Update property `DEPLOY_BRANCH=v2.25.1` in production `PRD_04_DEPLOY_PERMIT_REPOSITORY` job in Jenkins
- **web-ops** - Update property `DEPLOY_BRANCH=v2.25.1` in production `PRD_05_DEPLOY_RETURNS` job in Jenkins
- **web-ops** - Update property `DEPLOY_BRANCH=v2.25.1` in production `PRD_06_DEPLOY_IMPORT` job in Jenkins
- **web-ops** - Update property `DEPLOY_BRANCH=v2.26.0` in production `PRD_08_DEPLOY_UI` job in Jenkins

### Release day

- **web-ops** - Production `PRD_01_DEPLOY_SERVICE` job ran in Jenkins
- **web-ops** - Production `PRD_02_DEPLOY_TACTICAL_CRM` job ran in Jenkins
- **web-ops** - Production `PRD_03_DEPLOY_TACTICAL_IDM` job ran in Jenkins
- **web-ops** - Production `PRD_04_DEPLOY_PERMIT_REPOSITORY` job ran in Jenkins
- **web-ops** - Production `PRD_05_DEPLOY_RETURNS` job ran in Jenkins
- **web-ops** - Production `PRD_06_DEPLOY_IMPORT` job ran in Jenkins
- **web-ops** - Production `PRD_08_DEPLOY_UI` job ran in Jenkins

- **delivery team** - Smoke test that service is up and operating as expected
```

## Create calendar appointment

Once a date and time has been confirmed create a calendar appointment and add the shared web-ops account **SM-Defra-ddts-aws-webops** and the team's QA as `required`. Add the rest of the dev team as `optional`. Use the following template for the title and content

```text
title: WRLS RFC CHG0059773

[Copy of release note content]

[Link to release note]
```

This will serve as both a confirmation and reminder to all of the agreed date and time.

## Comms

Letting the users and key stakeholders know when the release will happen and what's in it is handled by the team's Delivery Manager and Product Owner.

We let them and the delivery team know the RfC is raised and scheduled by putting a post in the team's [Teams channel (MSFT-Defra )](https://teams.microsoft.com/l/team/19%3acSnPCAkeDlujg1vdWAzicBz8xLDXSZgD3hhTSK7QFr81%40thread.tacv2/conversations?groupId=051160dd-3d14-4f28-8354-725992c0cf4c&tenantId=770a2450-0227-4c62-90c7-4e38537f1102)

```markdown
@General The next release of the service has been scheduled for **Thursday October 20** at approximately 8:30pm under RfC **CHG0059773**
```
