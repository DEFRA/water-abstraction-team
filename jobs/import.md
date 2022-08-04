# Water Abstraction Import

> <https://github.com/DEFRA/water-abstraction-import>

## Licence import

- **Type** cron
- **Schedule**
  - `non-production` 16:00 on Monday, Tuesday, Wednesday, Thursday, and Friday
  - `production` 04:00 on Monday, Tuesday, Wednesday, Thursday, and Friday

## Charging import

- **Type** cron
- **Schedule**
  - `non-production` 14:00 on Monday, Tuesday, Wednesday, Thursday, and Friday
  - `production` 01:00 on Monday, Tuesday, Wednesday, Thursday, and Friday

## Monitoring

> The config was introduced in [Feat/water 3032 import jobs status](https://github.com/DEFRA/water-abstraction-import/pull/276) but neither the code in the PR nor the existing code ever seems to refer to it. So, there is a good chance this job never runs!

- **Type** cron
- **Schedule** every minute
