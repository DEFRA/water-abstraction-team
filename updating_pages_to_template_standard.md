# Updating pages to "template" standard

We have opinionated standards on how we write our code, but not for how we write views. This means that different views do similar things in very different ways.

We have agreed as a team to bring our pages up to a "template" standard, with the views in the return versions setup journey being the first pages we did this for. Following completion of that work, we have documented the changes so that the work can be replicated for other journeys as and when we get to them.

## Errors

Where we see things like this:

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

{# Also incorrect: #}
{{ govukInput({
  id: "other-user",
  name: "otherUser",
  classes: "govuk-!-width-one-third + (' govuk-input--error' if error.emailAddressInputFormError),
  errorMessage: error.emailAddressInputFormError,
  ...
}) }}

{# Correct: #}
{{ govukInput({
  id: "other-user",
  name: "otherUser",
  classes: "govuk-!-width-one-third",
  errorMessage: error.emailAddressInputFormError,
  ...
}) }}
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

In the example above, we see that `href` goes from a hardcoded url `"/system/return-versions/setup/" + sessionId + "/start-date"` to `reasonLink`, which we define in the presenter and pass to the template. This also applies to:

## Backlinks

We define `backlink` in the presenter and pass to the template:

```html
{# Incorrect: #}
{{ govukBackLink({ text: 'Back', href: '/system/bill-runs/setup/' + sessionId + '/region' }) }}

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
