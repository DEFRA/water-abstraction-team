# Coding conventions

The following is a list of conventions we follow when working in the [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) repo.

We make best efforts to follow them when working in the legacy repos. There are often times it makes more sense to follow the conventions that already exist.

- [Add the .js extension](#add-the-js-extension)
- [File names](#file-names)
- [Functions](#functions)
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

Unit test files should be the same as the thing being tested with `.test` added to the end, for example `thing.service.test.js`. The `test/` folder structure should mirror the `app/` folder.

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

When we do need to use arrow functions, parameters are always wrapped in brackets even if there is only one. Also, use _block body_ over _concise body_.

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
