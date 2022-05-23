# API examples

Currently, the Water Abstraction Service (WABS) is made up of 2 web apps and 7 API apps. Unfortunately, those API's are only sporadically documented.

It is common for each dev to have their own collection of [curl](https://curl.se) examples or [Postman collections](https://www.postman.com/collection). So, we have created this as a way of centralising the knowledge going forward.

## Contents

- [Tactical IDM](/api/tactical_idm.md)
- [Test Data](/api/test_data.md)

## Note on the format

Ideally, API's should be documented using the [OpenAPI specification](https://swagger.io/specification/). But it is our intent to merge most, if not all the API's into the main app going forward. We don't wish to invest _too_ much effort into something we intend to drop.

A shared [Postman workspace] would be another option. However, the free tier is limited and we have no money for a paid plan 😢. Postman collections tend to generate massive JSON files and only really come into their own when combined with [Postman environments](https://learning.postman.com/docs/sending-requests/managing-environments/).

So, for now we've opted for just showing examples using **curl** though this may change in the future.
