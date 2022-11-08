# Releasing

Though we have [Continuous Integration](https://www.atlassian.com/continuous-delivery/continuous-integration) we do not have [Continuous Deployment](https://www.atlassian.com/continuous-delivery/continuous-deployment). Defra's formal process uses [ITIL](https://wiki.en.it-processmaps.com/index.php/History_of_ITIL) and as such all changes to a production environment, _no matter how small_, must be submitted first as a [Request for Change](https://wiki.en.it-processmaps.com/index.php/Checklist_Request_for_Change_RFC).

The release processes is based on packaging up a 'release' ready to be submitted for approval to deploy via the RfC process.

The team splits the process into 3

- **[Sign off](/releasing/sign_off.md)** - having identified which repos will be included in the 'release', we version ([tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging)) them, deploy those versions to the `pre-prod` environment and then run our regression tests. Meantime, we are generating a [CHANGELOG](https://keepachangelog.com/en/1.0.0/) and updating any relevant documentation for each one.
- **[Schedule](/releasing/schedule.md)** - submit the RfC and arrange for the signed off 'release' to be deployed to `production`.
- **[Release](/releasing/schedule.md)** - support web-ops on the day of the release and handle any issues that arise from it
