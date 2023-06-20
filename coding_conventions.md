# Coding conventions

The following is a list of conventions we follow when working in the [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) repo.

We make best efforts to follow them when working in the legacy repos. There are often times it makes more sense to follow the conventions that already exist.

- [Add the .js extension](#add-the-js-extension)
- [File names](#file-names)
- [Modules](#modules)
- [Functions](#functions)
  - [Function naming conventions for services](#function-naming-conventions-for-services)
- [Top of .js files](#top-of-js-files)
  - [Top of test.js files](#top-of-testjs-files)

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

#### *️⃣ The exception

The one exception to _block_ body over _concise_ is when you are just performing a [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) check.

```javascript
const transactions = [
  { billableDays: 25, volume: 100 },
  { billableDays: 15, volume: 75, charge: 754 }
]

// Concise - It's clearer we only care if it's 'truthy'
transactions.some((transaction) => transaction.charge)

// Body - It looks like we care more about the value of charge
transactions.some((transaction) => {
  return transaction.charge
})
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
In node the standard way to document code is by using comments called [JSDoc]( https://jsdoc.app/) comments.
 This style of comments has its own conventions that we follow.

Comments begin with a slash-star-star (`/**`) and end with a star-slash (`*/`).

Begin the JSDoc comment with a description of the code element, providing a clear and concise explanation of its purpose, behaviour, or usage.

Tags: Use tags to provide additional information about the code element. Commonly used tags include `@param`, `@returns`, `@throws`, `@type`, `@example`, and `@see`.

Specify the types of parameters, return values, and variables using curly braces {}. We use built-in JavaScript types (string, number, boolean, etc.) For arrays we notate this using square brackets `[]`

For our JSDoc comments we don't end the sentence with a full stop and we don't use any dashes between the variable names and description sentence. We also put spaces in between our descriptions.

```javascript
// Good comment
/**
 * Description of the code element
 *
 * @param {String} name Description of the params
 *
 * @returns {String} Description of what is returned
 */

// Bad comment
/**
 * Description of the code element.
 * @param {String} name - Description of the params.
 * @returns {String} - Description of what is returned.
 */

```

Previously, we were not documenting promises in the JSDoc comments when the code we were documenting returned a promise. However we later discovered that this caused unexpected behaviour with SonarCloud and VSCode. SonarCloud flagged 'redundant awaits' even though they were actually necessary, and in VSCode, the await keyword was underlined We now understand that this occurred because we were not including documentation about promises in the JSDoc comments. SonarCloud and CSCode rely on JSDoc to understand the code's behaviour, and without proper documentation, they interpreted anything related to promises (such as the await keyword) as incorrect or redundant.

Going forward we will ensure that promises are correctly documented in JSDoc comments to address the issues we encountered. Here is how we can document promises in JSDoc comments.

```javascript
/**
 * Fetches user data asynchronously from an API
 *
 * @async
 * @function fetchUserData
 *
 * @param {String} userId The ID of the user
 *
 * @returns {Promise<User>} A promise that resolves to the user data
 */

async function fetchUserData(userId) {
  // Async function implementation
}

```
In the example above, 'User' represents the type of data that the promise resolves to. By documenting the promise and its resolved type, we provide clear information about the expected behaviour of the asynchronous operation.
