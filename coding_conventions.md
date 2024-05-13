# Coding conventions

The following is a list of conventions we follow when working in the [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) repo.

We make best efforts to follow them when working in the legacy repos. There are often times it makes more sense to follow the conventions that already exist.

- [Add the .js extension](#add-the-js-extension)
- [File names](#file-names)
- [Modules](#modules)
- [Functions](#functions)
  - [Function naming conventions for services](#function-naming-conventions-for-services)
- [Line length](#line-length)
- [Top of .js files](#top-of-js-files)
  - [Top of test.js files](#top-of-testjs-files)
- [JSDoc Comments](#JSDoc-Comments)
  - [Promises](#promises)

## Add the .js extension

When linking to an internal module in our `require()` statements _always_ include the `*.js` extension.

```javascript
// Good
const RequestLib = require('../lib/request.lib.js')

// Bad
const RequestLib = require('../lib/request.lib')
```

We _know_ 😝 that you don't have to and that generally the convention is not to. But we still hold out hope that one day we'll [switch our main repo from CommonJS to ES6 modules](https://github.com/DEFRA/water-abstraction-system). The extension _is_ required when using `import` and the work of migrating is made easier if the existing `require()` statements already include it.

## File names

All file names should be [kebab-case](https://www.freecodecamp.org/news/snake-case-vs-camel-case-vs-pascal-case-vs-kebab-case-whats-the-difference/#kebab-case), for example `awesome-people.service.js`

Other naming conventions are

- controllers `thing.controller.js`
- general modules `thing.lib.js`
- models `thing.model.js`
- plugins `thing.plugin.js`
- presenters `thing.presenter.js`
- routes `thing.routes.js`
- services `thing.service.js`

To ensure cross-platform compatibility file names should always be written in lower case. This includes the use of acronyms in the file name. For example `convert-to-csv.service.js`.

Unit test files should be the same as the thing being tested with `.test` added to the end, for example `thing.service.test.js`. The `test/` folder structure should mirror the `app/` folder.


## Modules

Modules should be named using PascalCase. The only exception to this is when an acronym is used in the name, then this should be in capital letters.

```javascript
/**
 * Converts data to CSV format
 * @module ConvertToCSVService
 */

// DON'T do this
/**
 * Converts data to CSV format
 * @module ConvertToCsvService
 */
```

## Functions

We define our functions as

```javascript
function helloWorld () {
  return 'Hello, world!'
}

// DON'T do this
const helloWorld = () => {
  return 'Hello, world!'
}
```

### Arrow functions

When we do need to use [arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions), parameters are always wrapped in brackets even if there is only one. Also, use _block body_ over _concise body_ *️⃣.

```javascript
const materials = [
  'Hydrogen',
  'Helium',
  'Lithium',
  'Beryllium'
]

// Use Block body version
materials.forEach((material) => {
  console.log(`${material} - ${material.length}`)
})

// Do not use Concise body version
materials.forEach((material) => console.log(`${material} - ${material.length}`))
```

### Function naming conventions for services

The bulk of our system's business logic resides in "services", each of which typically performs a single task. This task may be an individual step of a process, or it may be marshalling the various steps of this multi-stage process. But either way, services tend to focus on doing one thing in particular.

To this end, our convention is that services have a single exported function, called `go()`. Services are allowed to have other functions; in fact we encourage it! But these must not be exported, and we use the common convention of starting their name with an underscore to indicate they are private.

An example of service function naming would be as follows:

```javascript
async function go (elementId) {
  const elementData = await _fetch(elementId)

  return _format(elementData)
}

async function _fetch(elementId) {
  const elementData = await ElementLookupService.go(elementId)

  return elementData
}

function _format(elementData) {
  return elementData.map((field) => {
    return field.toUpperCase()
  })
}

module.exports = {
  go
}
```

Anytime an acronym is used in the naming of a private function this should be written in capital letters, such as `_convertToCSV()`. This also means we should never start a function name with an acronym as functions shouldn't start with capital letters.

## Line length

With one exception, lines should be kept to 120 characters or less. For example, if you are have a method and your params, because they have lovely expressive names 😁, take you over the 120 limit then split them over multiple lines.

```javascript
// Bad!
async function performMagic (eyeOfLesserSpottedNewt, giantFruitBatDrool, pinchOfDragonWort, somethingThatHasReallyLongName) {
  // Do something
}

// Good!
async function performMagic (
  eyeOfLesserSpottedNewt,
  giantFruitBatDrool,
  pinchOfDragonWort,
  somethingThatHasReallyLongName
  ) {
  // Do something
}
```

The same goes when calling a method. The exception is when you have a string you can't break across multiple lines. This applies to `describe()` and `it()` in our test files; we'd rather a more verbose description than worry about the convention.

## Top of .js files

The top of all `*.js` files should follow this pattern

- `use strict` as first statement
- JSDoc module declaration (if a `module` or `class`)
- `require()` statements

The `require()` statements should be grouped by

- external packages
- internal modules
- config
- constants
- module scoped variables

Place a new line between each one and list entries alphabetically. Any destructured functions should also be listed alphabetically.

```javascript
'use strict'

/**
 * Service that tells people how awesome they are!
 * @module AwesomeService
 */

const NotifyClient = require('notifications-node-client').NotifyClient
const Pino = require('pino')

const { createBillRun, deleteBillRun, viewBillRun } = require ('../services/bill-run.service.js')
const PersonService = require('../services/person.service.js')
const RequestLib = require('../lib/request.lib.js')

const servicesConfig = require('../../config/services.config.js')

const DEFAULT_GREETING = 'Hello'
const DEFAULT_SUPERLATIVES = ['best', 'greatest', 'sweetest']

let message

// Start coding!
```

### Top of test.js files

We have a different convention for the top of our `*.test.js` files. The groupings are different and we make use of comments to identify them. Excluding the external test framework dependencies, groups are still listed alphabetically and separated by a new line. Destructured functions are also listed alphabetically with the exception of **Lab**. Those we extract in hierarchical order.

- `use strict` as first statement
- test frameworks
  - any module level values we need from them
- test helpers (either literal test helpers we've written or other app internal code needed to support the testing)
- anything that will be stubbed
- The 'thing' being tested

If a grouping is not needed then it should be excluded entirely (don't bother with the comment)

```javascript
'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

// Test helpers
const ChargeVersionHelper = require('../support/helpers/charge-version.helper.js')
const ChargeVersionModel = require('../../app/models/charge-version.model.js')
const { formatChargeVersion, parseChargeVersion } = require('../../app/services/parse-charge-version.service.js')

// Things we need to stub
const RequestLib = require('../../app/lib/request.lib.js')

// Thing under test
const ChargeModuleTokenService = require('../../app/services/charge-module-token.service.js')

// Start testing!
```
## JSDoc Comments

In node the standard way to document code is by using comments called [JSDoc]( https://jsdoc.app/) comments. This style of comments has its own conventions that we follow.

Comments begin with a slash-star-star (`/**`) and end with a star-slash (`*/`).

Begin the JSDoc comment with a one-line short description of the code element, providing a clear and concise explanation of its purpose, behaviour or intended usage.

Use the [@param](https://jsdoc.app/tags-param.html) and [@returns](https://jsdoc.app/tags-returns.html) tags to provide details on the arguments a method expects and what it returns.

For example:
- `@param {string} name - Name of the licensee` A simple primitive param
- `@param {number[]} readings - Meter readings for the last week` A param that is an array
- `@returns {Object} Details about the abstraction purpose` Documenting the return value

We don't end the method short description or the param and return descriptions with a full stop. If an expanded description is added treat it as a normal document and do finish the sentences with full stops.

The following is an example of a 'good' method document comment.
```javascript
/**
 * Fetch all SROC charge versions linked to licences flagged for supplementary billing
 *
 * This is used to get the charge versions that will be used to generate the bills for a given billing period. Excluding
 * those with a `draft` status, it selects all `charge_version` records that have a start date before the billing period
 * end date, and an end date that is either null or after the billing period's start date.
 *
 * They must also be linked to licences in the specified region flagged for SROC supplementary billing. The results
 * include linked models that will be needed in the billing process, for example, a charge version's `charge_elements`.
 *
 * @param {String} regionId - UUID of the region being billed that the licences must be linked to
 * @param {Object} billingPeriod - Object with a `startDate` and `endDate` property representing the period being billed
 *
 * @returns {Promise<Object[]>} An array of matching charge versions
 */
async function go (regionId, billingPeriod) {
```

### Promises

Where a function is [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) the fact a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) is returned should be documented in the `@return`.

Previously, we were not documenting when a function returned a promise. We then discovered this caused unexpected behaviour with SonarCloud and VSCode. Both flagged 'redundant awaits' even though they were necessary.
We now understand that this was because we were not including documenting when a function returned a promise. SonarCloud and VSCode rely on JSDoc to understand the code's behaviour and without proper documentation, they interpreted anything related to promises (such as the `await` keyword) as incorrect or redundant.

The 'good' example demonstrates how to document the Promise.

```javascript
/**
 * @returns {Promise<Object[]>} An array of matching charge versions
 */
async function go (regionId, billingPeriod) {
```
