# Normal RfC example

The following is an example of a completed myIT **normal** RfC. You should be able to use it as the basis for new ones, copying most fields directly. The description will _always_ need to be specific to the change you are making.

Below the sub-headings refer to fields. Quoted content represents an example of what to enter.

## Top section

Most are drop-downs. Anything not mentioned will either have a default or update based on what you enter.

### Department

> Defra

### Category

> Software

### Environment

> Production

### Configuration item

> CM_Charging Module

### Sponsor

> Andy Turner

### BAU or Project

> BAU

### Short description

> WRLS - Update deployment jobs and log config

### Description

> Updates to the WRLS service are done using Jenkins, an automation server. The current 'jobs' depend on a deployment script with a number of issues.
>
> We've replaced the the script and the jobs that use it with with a modern Jenkins pipeline. Now there is just one Jenkins job for each of the 8 apps that make up WRLS. Apps can be deployed individually, reducing the risk of future deployments. Configuration is managed completely separately from the pipeline. The whole process follows the same pattern as other services like WCR, FRAE, WEX and PAFS.
>
> This RfC is to cover running the new pipeline for each of the 8 apps that make up the service. No changes will be made to the service itself; the pipeline will be configured to deploy the exact same version currently in production. We also need to correct the AWS Cloudwatch log configuration. We currently cannot see logs for every service that makes up WRLS.
>
> We don't anticipate any interruption to the service but a SIN is attached just in case

## Planning

The next section of the form has 6 tabs. The only ones we care about are 'Planning' and 'Schedule'.

### Business justification

> The current 'jobs' depend on a deployment script with a number of issues
>
> - It relies on legacy shell based jobs instead of those based on pipelines
> - It's a single bash script many hundreds of lines long which makes it difficult to maintain
> - Configuration is sourced from hard coded values in the script and those passed at time of deployment
> - It requires all micro-services that make up WRLS to be deployed irrespective of whether any changes have been made
> - Some work is done in Jenkins jobs, and some by the script. This has led to more than 30 jobs needing to be maintained and a deployment that can take more than 30 mins to complete
>
> The delivery and web-ops team have agreed that the deployment process needs to be updated to ensure the service can be maintained and updated with less risk going forward.
>
> Finally, we're correcting the log configuration to ensure output from the services is correctly forwarded to AWS CloudWatch. Without it the delivery team are unable to investigate and diagnose all issues reported.

### Implementation plan

> All non-production environments (development, test & pre-production) have been using the new pipeline and jobs for more than 2 months. They have been extensively tested and used in those environments.
>
> The jobs will be copied to the production environment by web-ops. The delivery team will provide the configuration files for each of the apps based on what is needed for production.
>
> On the day web-ops will run each of the 8 deployment jobs in turn. The delivery team will monitor the results and output and continue to check the service for any issues.
>
> Once all are completed the old Jenkins jobs will be removed from the production environment.
>
> Finally, the environment's Ansible scripts will be updated with the new log paths for the current services. This will then allow Cloudwatch to receive the logs and make them available to the delivery team in the AWS Console.

### Downtime

> Yes

### Downtime start

> 27/09/2022 08:30:00

### Downtime finish

> 27/09/2022 10:30:00

### Risk and impact analysis

> We are only updating the deployment jobs used to update the services that make up WRLS, and not the services themselves. They will just be restarted as part of the deployment, which is something we typically do every 2 weeks anyway as part of our regular standard changes.
>
> Failure to make the change means
>
> - future updates and the deployment process itself will become harder to maintain due to its increasing complexity
> - future RfC's will continue to include unnecessary risk from forcing all services to be updated and restarted, even when no changes have been made
> - the security issue of having production configuration items hard coded into the deployment script will remain
> - we'll continue to struggle to identify and correct issues with WRLS that occur in a service whose logs are not available in AWS CloudWatch

### Backout plan

> In the event a deployment job fails and the cause cannot be immediately identified, we'll stop running subsequent ones
>
> If the deployment causes a service to fail to restart we'll run the existing deployment process which will reset the state of the services and ensure they are all running as required.
>
> Any failure with changes to the Ansible scripts to correct the log paths will be rolled back, along with the changes made to the environment CloudWatch config.

### Test plan

> All non-production environments (development, test & pre-production) have been using the new pipeline and jobs for more than 2 months. They have been extensively tested and used in those environments.
>
> On the day the service will be smoke tested after each deployment until all 8 are completed.

## Schedule

The form will default to the first available date and time. So, for example, if you opened it on `18 November at 17:12pm` it would default to `05 Dec at 09:15:00`. This is because it automatically adds a set number of hours (we think 337) to the current date and time when the form is started.

We aim to do deployments in the morning. This is to give us more time to rectify any issues. We also avoid Friday. Even if the change is small and low risk no one likes to tempt fate before the weekend!

So, typically we would select the next day (`06 December at approx 09:00` in our example) having checked the calendars of the web-ops team as well. As long as

- there are no other RfC's that AM/PM
- the change is something they've done before

You should be fine to go ahead and schedule it. If unsure contact web-ops first to agree a date and time before submitting.

### Planned start date

> 27/09/2022 08:30:00

### Planned end date

> 27/09/2021 10:30:00

## Risk assessment

This is a link in the form. Often it does not appear until you have completed the other sections and clicked the `Save for later` button. Once you have completed this (see fields below) you can then click `Validate`. This is what actually submits the RfC to Change Management.

### Does the change impact Application, Infrastructure or both?

> Applications

### Is this change impacting a Datacentre?

> No

### How many systems are impacted?

_Which we interpret as the application itself._

> 1-3

### How many services are impacted?

_Which we interpret as the number of client services using our system._

> 1-3

### At what level will the service be affected

> None

### Is new infrastructure hardware or application software being introduced by this change?

> No

### Are there multiple parties involved in the implementation of this change?

> 1 person

### Is these a single coordinator for the change?

> Yes

### Are there any other critical changes dependent on this implementation?

> N/A

### Change frequency

> Change is actioned on a regular basis

### Does this change have a high VIP visibility?

> No

### How many users are affected?

> 1 to 10

### Select service classification

> N/A
