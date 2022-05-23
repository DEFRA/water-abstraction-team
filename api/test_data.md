# Test Data

At some point the previous team added a mechanism for generating test data. It's an endpoint you hit in the [water-abstraction-service](https://github.com/DEFRA/water-abstraction-service) which when given a recognised value will add data relevant to that scenario.

In most cases you'll fire a request to `/tear-down` which deletes all 'test' data from the various DB's. It knows what to strip based on a `is_test` flag which is set to true when the records get seeded

> Important! It's a common mistake to assume _all_ data gets deleted. Many a new dev has created something in the internal UI to then think it will get deleted by a `/tear-down` - it won't!

## Tear down

```bash
curl -X POST http://localhost:8001/water/1.0/acceptance-tests/tear-down \
--header "Accept: application/json" \
--header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6InRlc3QiLCJpYXQiOjE1MDMzMTg0NDV9.eWghqjYlPrb8ZjWacYzTCTh1PBtr2BeSv-_ZIwrtmwE"
```

```text
Tear down complete
```

## Sets

[sets.json](https://github.com/DEFRA/water-abstraction-service/blob/develop/integration-tests/billing/fixtures/sets.json) in the `water-abstraction-service` repo lists the recognised 'sets' of data the generator will seed the DB with.

> At this time we don't really have a good understanding of what type of scenario a 'set' is providing data for. We aim to update this guide with explanations when we do.

The current list of recognised sets is

- `notify-mock-notification`
- `barebones`
- `charge-version-workflow`
- `billing-data`
- `supplementary-billing`
- `annual-billing`
- `annual-billing-2`
- `five-year-two-part-tariff-bill-runs`
- `two-part-tariff-billing-data`
- `bulk-return`

The following is an example of how to call the endpoint. You would need to replace `[set-name]` with a value from the list above

```bash
curl -X POST http://localhost:8001/water/1.0/acceptance-tests/set-up-from-yaml/[set-name] \
--header "Accept: application/json" \
--header "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6InRlc3QiLCJpYXQiOjE1MDMzMTg0NDV9.eWghqjYlPrb8ZjWacYzTCTh1PBtr2BeSv-_ZIwrtmwE"
```

> No data is returned in the response

## Getting started

For anyone new to the project who just wants to create some users and have something to see when they login we recommend using the `barebones` set.

You can then login using

- Email `acceptance-test.internal.super@defra.gov.uk`
- Password `P@55word`

A search for licence `AT/CURR/DAILY/01` should return a result.
