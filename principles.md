# Principles

> This repo was created in 2022 when the new tech team took over Water Abstraction. Any standards or principles stated here are what we _aspire_ the project to meet!

As a technology team in Defra we are called on to think about and use a number of principles from a number of sources.

This page gives some focus to those things that are key to us.

> A caveat; some of these principles are for everyone involved in a delivery team. As such those of us on the implementation side may have less influence or control about their use

## Defra principles

> These apply to software development. As such it is the responsibility of the developers on the team to ensure they are followed

Defra has [set out principles](https://github.com/DEFRA/software-development-standards/tree/master/principles) it expects all involved in software development to follow. They apply to both internal and external facing services, and anyone new to the team needs to have read them.

The key principles are

- Don't re-invent the wheel
- Do the minimum necessary
- Start small
- Be open
- Minimise work in progress
- Be reasonable
- Be helpful

Check the [principles](https://github.com/DEFRA/software-development-standards/tree/master/principles) directly for further details.

## Government Design Principles

The [Government Digital Service (GDS)](https://www.gov.uk/government/organisations/government-digital-service) have for some years now provided both guidance and assurance for digital teams working in government. Some consider [their principles](https://www.gov.uk/guidance/government-design-principles) and the [Service Standard](https://www.gov.uk/service-manual/service-standard) to only apply to externally facing digital services. Our experience is when used they makes things better no matter who your users are.

The principles are

- Start with user needs
- Do less
- Design with data
- Do the hard work to make it simple
- Iterate. Then iterate again
- This is for everyone
- Understand context
- Build digital services, not websites
- Be consistent, not uniform
- Make things open: it makes things better

## Twelve-Factor app

[Twelve-Factor app](https://12factor.net/) (more often written as 12Factor) is written as a methodology to helps teams build services suitable for running on modern cloud platforms that scale. The 12 factors can be read as principles for how we should build our services

1. **Codebase** - One codebase tracked in revision control, many deploys
2. **Dependencies** - Explicitly declare and isolate dependencies
3. **Config** - Store config in the environment
4. **Backing services** - Treat backing services as attached resources
5. **Build, release, run** - Strictly separate build and run stages
6. **Processes** - Execute the app as one or more stateless processes
7. **Port binding** - Export services via port binding
8. **Concurrency** - Scale out via the process model
9. **Disposability** - Maximize robustness with fast startup and graceful shutdown
10. **Dev/prod parity** - Keep development, staging, and production as similar as possible
11. **Logs** - Treat logs as event streams
12. **Admin processes** - Run admin/management tasks as one-off processes

Currently, the Water Abstraction Service (all the various apps) are deployed directly to [AWS EC2](https://aws.amazon.com/ec2/) instances (bare metal). We have limited control over exactly how exactly our AWS environments are structured. This is because web-ops endevour to have consistency across the many Defra services it supports

This is our excuse as to why the service might not be 100% aligned to 12Factor 😁 . But our goal is that it and any designs or changes need to be made with these in mind.
