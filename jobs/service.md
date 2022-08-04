# Water Abstraction Service

> <https://github.com/DEFRA/water-abstraction-service>

## Digitise to LVP Sync

- **Type** cron
- **Schedule** 18:00 every day

## Digitise To Licence Gauging Stations

- **Type** cron
- **Schedule** 18:00 every day

## Gauging Stations Sync

- **Type** BullMQ
- **Schedule** Every 6 hours from time app restarts

## Charge Categories Sync

- **Type** BullMQ
- **Schedule** Every 6 hours from time app restarts

## Supported Sources Sync

- **Type** BullMQ
- **Schedule** Every 6 hours from time app restarts
