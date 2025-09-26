# Updating pages to "template" standard

We have opinionated standards on how we write our code, but not for how we write views. This means that different views do similar things in very different ways.

We have agreed as a team to bring our pages up to a "template" standard, with the views in the return versions setup journey being the first pages we did this for. Following completion of that work, we have documented the changes so that the work can be replicated for other journeys as and when we get to them.

## Page content block

Content should be defined in a `pageContent` block, eg:

```html
{% block pageContent %}
  <form method="post">
    <input type="hidden" name="wrlsCrumb" value="{{ wrlsCrumb }}" />
    <div class="govuk-grid-row">
      <div class="govuk-grid-column-two-thirds">
        {{ govukInput({
          ...
        }) }}
        {{ govukButton({ text: "Continue", preventDoubleClick: true }) }}
      </div>
    </div>
  </form>
{% endblock %}
```

When using a `pageContent` block:

- The [page heading](#page-heading) will automatically be defined as `pageHeadingHtml`;
- An [error summary](#error-summary) component is provided;
- A [notification](#notifications) component is provided;
- A [warning](#warnings) component is provided.

## Page heading

> Remember to remove any `pageHeading` import from the top of the file when amending an existing page.

This should be defined in the presenter as `pageTitle` with optional caption `pageTitleCaption`, eg:

```js
return {
  pageTitle: 'Select how often readings or volumes are collected',
  pageTitleCaption: `Licence ${licence.licenceRef}`,
  // ...
}
```

This will be made available as `pageHeadingHtml` for use in the page. For example:

```html
{% block pageContent %}
  {{ pageHeadingHtml }}

  {# ... #}
{% endblock %}
```

If the page is largely comprised of a single component (eg. a page with just check boxes to select) we can use it in `fieldset`:

```html
{{ govukCheckboxes({
  name: "agreementsExceptions",
  fieldset: {
    legend: {
      html: pageHeadingHtml
    }
  },
  {# ... #}
}) }}
```


## Error summary

> Remember to remove any `govukErrorSummary` import from the top of the file when amending an existing page.

Provided we are defining the `pageContent` block in our template, an error summary will automatically be displayed at the top of the page when an array `errorList` is present. The `formatValidationResult` helper will take the returned validation result and format it as appropriate, so in most cases we can simply assign this to `error` and the error summary will be populated accordingly:

```js
const { formatValidationResult } = require('../../presenters/base.presenter.js')

// ...

async function go(payload) {
  const validationResult = _validate(payload)

  // ...

  return {
    activeNavBar: 'manage',
    error: validationResult,
    ...pageData
  }
}

function _validate(payload) {
  const validationResult = Validator.go(payload)

  return formatValidationResult(validationResult)
}
```

When updating unit tests, you may find some stubbing that needs to be amended from something like this:

```js
Sinon.stub(SubmitStartReadingService, 'go').resolves({
  error: { text: 'Enter a start meter reading' },
  //...
})
```

to something like this:

```js
// `units` is the name of the component in the template
Sinon.stub(SubmitUnitsService, 'go').resolves({
  error: {
	errorList: [{ href: '#units', text: 'Select which units were used' }],
	units: { text: 'Select which units were used' }
  },
  // ...
})
```

The component may need to be amended to ensure that it displays the error message, and that clicking the error in the summary box directs the user to the component. For example, change this:

```html
{{ govukInput({
  id: "some-input",
  errorMessage: {
	text: error.someInput.message
  } if error.someInput,
  ...
}) }}
```

to this:

```html
{{ govukInput({
  id: "someInput",
  errorMessage: {
	text: error.someInput.text
  } if error.someInput,
  ...
}) }}
```

ie. the error message is now held in `text` not `message`, and the id is changed to camel case.


## Notifications

> Remember to remove any `govukNotificationBanner` import from the top of the file when amending an existing page.

Provided we are defining the `pageContent` block in our template, a notification will automatically be displayed at the top of the page when `notification` is present. This may mean moving the defined notification text from the page template into the presenter. For example, we no longer do this:

```html
{% if underQuery %}
  {{ govukNotificationBanner({
    text: 'This return has been marked under query'
  }) }}
{%endif%}
```

We instead have no `govukNotificationBanner` component in the template and instead put something like this in the presenter:

```js
return {
  notification: underQuery ? { text: 'This return has been marked under query' } : null,
  // ...
}
```


## Warnings

> Remember to remove any `govukWarningText` import from the top of the file when amending an existing page.

Provided we are defining the `pageContent` block in our template, a warning will automatically be displayed at the top of the page when `warning` is present. This may mean moving the defined notificaiton text from the page template into the presenter. For example, we no longer do this:

```html
{{ govukWarningText({
  text: "You will not be able to send a water abstraction alert for the licence at this restriction type and threshold.",
  iconFallbackText: "Warning"
}) }}

```

We instead have no `govukWarningText` component in the template and instead put something like this in the presenter:

```js
return {
  warning: {
    text: "You will not be able to send a water abstraction alert for the licence at this restriction type and threshold.",
    iconFallbackText: "Warning"
  },
  // ...
}
```


## Errors in components

> This needs to be revised in light of the error summary guidance above.

Where we see things like this where an error class and message is being set in a separate block:

```html
{% if error.text.startResult %}
  {% set startResultErrorClass = " govuk-input--error" %}
  {% set startResultErrorMessage = { text: error.text.startResult } %}
{% else %}
  {% set startResultErrorClass = "" %}
  {% set startResultErrorMessage = null %}
{% endif %}

{# ... #}

{{ govukDateInput({
  id: "abstraction-period-start",
  namePrefix: "abstraction-period-start",
  errorMessage: { text: error.text.startResult } if error.text.startResult,
  items: [
    {
        classes: "govuk-input--width-2" + startResultErrorClass,
        {# ... #}
    },
    {# ... #}
  ]
}) }}
```

We can simply do this:

```html
{{ govukDateInput({
  id: "abstraction-period-start",
  namePrefix: "abstraction-period-start",
  errorMessage: startResultErrorMessage,
  items: [
    {
      classes: "govuk-input--width-2" + (' govuk-input--error' if error.text.startResult),
      {# ... #}
    },
    {# ... #}
  ]
}) }}
```

In other words, we ditch the first block entirely that sets the error class and message, and instead add them conditionally to whatever uses them.

Note that components will automatically add the error class if an error messge is specified; in this case we don't need to conditionally add it at all. `govukInput` is one such example:

```html
{# Incorrect: #}
{{ govukInput({
  id: "other-user",
  name: "otherUser",
  classes: "govuk-!-width-one-third {{ 'govuk-input--error' if error.emailAddressInputFormError }}",
  errorMessage: error.emailAddressInputFormError,
  ...
}) }}
```

```html
{# Also incorrect: #}
{{ govukInput({
  id: "other-user",
  name: "otherUser",
  classes: "govuk-!-width-one-third + (' govuk-input--error' if error.emailAddressInputFormError),
  errorMessage: error.emailAddressInputFormError,
  ...
}) }}
```

```html
{# Correct: #}
{{ govukInput({
  id: "other-user",
  name: "otherUser",
  classes: "govuk-!-width-one-third",
  errorMessage: error.emailAddressInputFormError,
  ...
}) }}
```


## Back links

> Remember to remove any `govukBackLink` import from the top of the file when amending an existing page.

These should be defined in the presenter as an object `backLink` with `href` and `text`, eg:

```js
return {
  backLink: { href: '/system/previous-page', text: 'Back' },
  // ...
}
```

These will automatically be displayed on the page provided the `breadcrumbs` block isn't being overwritten. In other words, ensure `backLink` is set in the presenter and remove anything like this from the page:

```html
{% block breadcrumbs %}
  {{ govukBackLink({ text: 'Back', href: backLink }) }}
{% endblock %}
```


## Unnecessary comments

We are ditching section comments entirely, eg:

```html
{# Main heading #}

{# Back link #}
```

Other comments should be evaluated on a case-by-case basis.

For example, here the comment is unnecessary as it's clear we are pushing an item into an array:

```html
{% set regionItems = [] %}
{% for region in regions %}
  {% set regionItem = { text: region.displayName, value: region.id, checked: region.id === selectedRegion } %}

  {# Push our item into the region items array #}
  {% set regionItems = (regionItems.push(regionItem), regionItems) %}
{% endfor %}
```

However here, the comment is helpful to explain _why_ we're doing what we're doing:

```html
{% for row in summaryTableData.rows %}
  {# Set an easier to use index #}
  {% set rowIndex = loop.index0 %}

  {# ... #}
{% endfor %}
```

## `div`s

As a general point, we don't usually need to wrap things in `<div>` tags. Individual components don't need anything wrapping them, and text should be wrapped in `<p>` tags.

If a `<div>` is being used to apply a class to an individual component then we may be able to add that class directly to the component, eg:

```html
{# Incorrect: #}
<div class="govuk-!-margin-bottom-9">
  {{ govukSummaryList({
    classes: 'govuk-summary-list--no-border',
    // ...
  }) }}
</div>

{# Correct: #}
{{ govukSummaryList({
  classes: 'govuk-summary-list--no-border govuk-!-margin-bottom-9',
  // ...
}) }}
```

This may not always be the case -- for example, if a summary list has a border (ie. the `govuk-summary-list--no-border` class isn't applied) then adding a margin will put the space _inside_ the table, ie. between content and border.

In theory we should be able to use a padding class like `govuk-!-padding-bottom-9` to apply extra space "outside" of the element; however this doesn't seem to work, and no extra spacing is applied at all. This may be a bug or it may be a misunderstanding of how it should work; either way, if we want spacing in this scenario then we either need to keep the wrapping `<div>`:

```html
<div class="govuk-!-margin-bottom-9">
  {{ govukSummaryList({
    // ...
  }) }}
</div>
```

Or if possible, add a suitable class to the following component:

```html
{{ govukSummaryList({
  // ...
}) }}

<p class="govuk-!-margin-top-9">
 // ...
</p>
```
## `govuk-body` class

We remove the `govuk-body` class wherever we see it. So for example. if we have `<p class="govuk-body">...</p>` anywhere then we retain the `<p>` tags but remove the class.

If we have `<div class="govuk-body">` then we would remove the `<div>` entirely in line with the previous principle.

## Imports section

The imports section at the top of the page should be laid out with the `extends` directive first, then a blank line, then any external imports (eg. components), then any internal imports (eg. our own macros). For example:

```html
{% extends 'layout.njk' %}

{% from "govuk/components/back-link/macro.njk" import govukBackLink %}
{% from "govuk/components/button/macro.njk" import govukButton %}

{% from "macros/page-heading.njk" import pageHeading %}
```

## Page headings

Our `pageHeading` macro should be used for all pages:

```html
{# Incorrect: #}
<h1 class="govuk-heading-l">{{ pageTitle }}</h1>

{# Correct: #}
{{ pageHeading(pageTitle) }}
```

A caption can optionally be passed; note that captions are defined entirely within the presenter, ie. any text previously in the template (`Bill run` in the below example) is instead defined in the presenter.

```html
{# Incorrect: #}
<span class="govuk-caption-l">Bill run {{ billRunNumber }}</span>
<h1 class="govuk-heading-l">{{ pageTitle }}</h1>

{# Correct: #}
{{ pageHeading(pageTitle, caption) }}
```

```js
// Incorrect presenter:
function go() {
  // ...
  return {
    billRunNumber,
    pageTitle: 'Page title'
  }
}

// Correct presenter:
function go() {
  // ...
  return {
    caption: `Bill run ${billRunNumber}`,
    pageTitle: 'Page title'
  }
}
```

If we want specific styling to match existing design, this can also be passed in:

```html
{{ pageHeading(pageTitle, caption, 'govuk-heading-xl govuk-!-margin-bottom-3') }}
```

If the page is largely comprised of a single component (eg. a page displaying radio buttons) we set the page heading:

```html
{% set pageHeading %}
  {{ pageHeading(pageTitle, caption) }}
{% endset %}
```

We can then use it in a `fieldset`.

## `fieldset`

When the page is largely comprised of a single component, ensure we have a `fieldset` in it, eg:

```html
{{ govukCheckboxes({
  name: "agreementsExceptions",
  fieldset: {
    legend: {
      html: pageHeading
    }
  },
  {# ... #}
}) }}
```

We also clean up any existing `fieldset.legend`.

## Single line vs multiple lines

Where possible, we should contract things onto a single line if that would be within the 120-char line limit. For example:

```html
{# Incorrect: #}
{{ govukButton({
  text: "Continue",
  preventDoubleClick: true
}) }}

{# Correct: #}
{{ govukButton({ text: "Continue", preventDoubleClick: true }) }}
```

This applies to HTML as well:

```html
{# Incorrect: #}
<p>
  Some text.
</p>

{# Correct: #}
<p>Some text.</p>
```

An exception to the rule is when using directives like `{# if #}`, `{# set #}`, `{# block #}` etc. Here we always put the directive on its own line. For example:

```html
{# Incorrect: #}
{% set pageHeading %}{{ pageHeading(returnReference, pageTitle) }}{% endset %}

{# Correct: #}
{% set pageHeading %}
  {{ pageHeading(returnReference, pageTitle) }}
{% endset %}
```

If a component is spread over multiple lines then we don't need to compress individual elements that can fit on one line. For example:

```html
{# Incorrect: #}
{{ govukRadios({
  name: "periodDateUsedOptions",
  fieldset: { legend: { html: pageHeading } },
  {# ... #}
}) }}

{{ govukRadios({
  name: "periodDateUsedOptions",
  fieldset: {
    legend: {
      html: pageHeading
    }
  },
  {# ... #}
}) }}

## Component brackets

Components should have the initial `{{` brackets on the same line as the component name. For example:

```html
{# Incorrect: #}
{{
  govukSummaryList({
    {# ... #}
  })
}}

{# Correct: #}
{{ govukSummaryList({
  {# ... #}
}) }}
```

## `govuk-summary-list`

If we have a summary list, we don't need the `govuk-summary-list` class, eg:

```html
{# Incorrect: #}
{{ govukSummaryList({
  classes: 'govuk-!-margin-bottom-2',
  rows: [
    {
      classes: 'govuk-summary-list govuk-summary-list__row--no-border',
      key: {
        text: "Reason"
      },
      value: {
        text: reason
      }
    },
    {# ... #}
  ]
}) }}

{# Correct: #}
{{ govukSummaryList({
  classes: 'govuk-!-margin-bottom-2',
  rows: [
    {
      classes: 'govuk-summary-list__row--no-border', {# Removed class #}
      key: {
        text: "Reason"
      },
      value: {
        text: reason
      }
    },
    {# ... #}
  ]
}) }}
```

## `text` with `attributes` vs `html`

If we're using `html` somewhere but only to apply an attribute, use `text` instead. For example:

```html
{# Incorrect: #}
{{ govukSummaryList({
  {# ... #}
  items: [
    {
      html: '<span data-test="change-reason">' + 'Change' + '</span>',
      href: "/system/return-versions/setup/" + sessionId + "/start-date",
      visuallyHiddenText: "the reason for the return requirement"
    }
  ]
}) }}

{# Correct: #}
{{ govukSummaryList({
  {# ... #}
  items: [
    {
        attributes: { 'data-test': 'change-reason' },
        text: 'Change',
        href: reasonLink, {# See below for why this was also changed #}
        visuallyHiddenText: "the reason for the return requirement"
    }
  ]
}) }}
```

## Pass links to template from presenter instead of hardcoding

In the example above, we see that `href` goes from a hardcoded url `"/system/return-versions/setup/" + sessionId + "/start-date"` to `reasonLink`, which we define in the presenter and pass to the template. This applies to static urls as well, so a link like `"/change"` would also be passed in from the presenter.

Passing in links also applies to:

## Backlinks

We define `backlink` in the presenter and pass to the template:

```html
{# Incorrect: #}
{{ govukBackLink({ text: 'Back', href: '/system/bill-runs/setup/' + sessionId + '/region' }) }}

{# Correct: #}
{{ govukBackLink({ text: 'Back', href: backlink }) }}
```

Again, this applies to static links as well:

```html
{# Incorrect: #}
{{ govukBackLink({ text: 'Back', href: '/manage }) }}

{# Correct: #}
{{ govukBackLink({ text: 'Back', href: backlink }) }}
```

## Hint text

If we have a standalone hint on a page with a single main component, see if we can add it to the component. For example:

```html
{# Incorrect: #}
<div class="govuk-hint"> Select all that apply </div>

{{ govukCheckboxes({
  name: "purposes",
  items: checkBoxItems,
  {# ... #}
}) }}

{# Correct: #}
{{ govukCheckboxes({
  name: "purposes",
  hint: {
    text: "Select all that apply"
  },
  items: checkBoxItems,
  {# ... #}
}) }}
```

## `govuk-label` classes

If we have some `label` text then we don't also need to add a `govuk-label` class. For example:

```html
{# Incorrect: #}
{{ govukInput({
  label: {
    text: "Enter the volume",
    classes: "govuk-label"
  },
  {# ... #}
}) }}

{# Correct: #}
{{ govukInput({
  label: {
    text: "Enter the volume"
  },
  {# ... #}
}) }}
```

(Note some other changes there but the key thing is the removal of `classes: "govuk-label--l"`)

## Ensure header elements only wrap text

Header elements such as `<h2>` should only wrap text; they shouldn't wrap block-level elements such as `<p>`. For example:

```html
{# Incorrect: #}
<h2 class="govuk-heading-l">{{tableTitle}}
  <p>Some text</p>
</h2>

{# Correct: #}
<h2 class="govuk-heading-l">{{tableTitle}}</h2>
<p>Some text</p>
```
