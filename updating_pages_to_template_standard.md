# Updating pages to "template" standard

We have opinionated standards on how we write our code, but not for how we write views. This means that different views do similar things in very different ways.

We have agreed as a team to bring our pages up to a "template" standard, with the views in the return versions setup journey being the first pages we did this for. Following completion of that work, we have documented the changes so that the work can be replicated for other journeys as and when we get to them.

### Errors

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
            classes: "govuk-input--width-2 {{ 'govuk-input--error' if error.text.startResult }}",
            {# ... #}
        },
        {# ... #}
    ]
}) }}
```

In other words, we ditch the first block entirely that sets the error class and message, and instead set them conditionally within whatever uses them.

### Section comments

We seem to be ditching entirely section comments, eg:

```html
{# Main heading #}

{# Back link #}
```

etc.

### `div`s

As a general point, we usually don't need to wrap things in `<div>` tags. Wrap text in `<p>` tags; individual components don't need anything wrapping them. If a `<div>` is being used to apply a class to an individual component then we may be able to add that class directly to the component, eg:

```html
{# Incorrect: #}
<div class="govuk-!-margin-bottom-9">
	{{ govukSummaryList({
		classes: 'govuk-summary-list--no-border',
		// ...
	}}
</div>

{# Correct: #}
{{ govukSummaryList({
	classes: 'govuk-summary-list--no-border govuk-!-margin-bottom-9',
	// ...
}}
```

This may not always be the case -- for example, if a summary list has a border (ie. the `govuk-summary-list--no-border` class isn't applied) then adding a margin will put the space _inside_ the table, ie. between content and border.

In theory we should be able to use a padding class like `govuk-!-padding-bottom-9` to apply extra space "outside" of the element; however this doesn't seem to work, and no extra spacing is applied at all. This may be a bug or it may be a misunderstanding of how it should work; either way, if we want spacing in this scenario then we either need to keep the wrapping `<div>`:

```html
<div class="govuk-!-margin-bottom-9">
	{{ govukSummaryList({
		// ...
	}}
</div>
```

Or if possible, add a suitable class to the following component:

```html
{{ govukSummaryList({
	// ...
}}

<p class="govuk-!-margin-top-9">
 // ...
</p>
```
### `govuk-body` class

We remove the `govuk-body` class wherever we see it. So for example. if we have `<p class="govuk-body">...</p>` anywhere then we retain the `<p>` tags but remove the class.

If we have `<div class="govuk-body">` then we would remove the `<div>` entirely in line with the previous principle.

### Page headings

If every page shares a common heading, we can extract it to a suitable file in `views/macros`. As we update more and more pages, we will likely accumulate common page headings which we can re-use across journeys (for example, there is already `views/macros/licence-reference-page-heading.njk` which shows the page title with the licence ref smaller above it; this is common in our service). When we do import a page heading, ensure we have a separating line between it and the govuk component imports, ie:

```html
{% extends 'layout.njk' %}
{% from "govuk/components/back-link/macro.njk" import govukBackLink %}
{% from "govuk/components/button/macro.njk" import govukButton %}

{% from "macros/licence-reference-page-heading.njk" import pageHeading %}
```

We insert the page heading like so:

```html
{{ pageHeading(licenceRef, pageTitle) }}

{# or if we want to set specific styling to match existing design: #}
{{ pageHeading(licenceRef, pageTitle, 'govuk-heading-xl govuk-!-margin-bottom-3') }}

```

If the page is largely comprised of a single component (eg. a page displaying radio buttons) we set the page heading:

```html
{% set pageHeading %}
    {{ pageHeading(licenceRef, pageTitle) }}
{% endset %}
```

We can then use it in a `fieldset`:

#### `fieldset`

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

### `govukButton` ✅ BUT we want to update docs to say "write on one line unless it goes over 120 char line width, and TBC what we do if we multiple buttons in a file, some of which are >120 chars and some of which aren't (including some that differ right next to each other)"

We consistently write it on one line, eg:

```html
{# Incorrect: #}
{{ govukButton({
    text: "Continue",
    preventDoubleClick: true
}) }}

{# Correct: #}
{{ govukButton({ text: "Continue", preventDoubleClick: true }) }}
```

The exception is if it goes over the 120 character line width, in which case leave it broken over multiple lines.

> TODO: Confirm what we want to do if we have two buttons next to each other, one on one line and the other on multiple lines:
>
> ```
> {{ govukButton({ text: "Continue", preventDoubleClick: true }) }}
>
> {{ govukButton({
>     text: '...',
>     href: '...',
>     classes: '...'
> }) }}
> ```
> Do we strictly follow the rule, or do we break them both up for visual consistency? ie:
> ```
> {{ govukButton({
>     text: "Continue",
>     preventDoubleClick: true
> }) }}
>
> {{ govukButton({
>     text: '...',
>     href: '...',
>     classes: '...'
> }) }}
> ```


### `govuk-summary-list`

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

### `text` with `attributes` vs `html`

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

### Pass links to template from presenter instead of hardcoding

In the example above, we see that `href` goes from a hardcoded url `"/system/return-versions/setup/" + sessionId + "/start-date"` to `reasonLink`, which we define in the presenter and pass to the template. This also applies to:

### Backlinks

We define `backlink` in the presenter and pass to the template:

```html
{# Incorrect: #}
{{
    govukBackLink({
        text: 'Back',
        href: '/system/bill-runs/setup/' + sessionId + '/region'
    })
}}

{# Correct: #}
{{
    govukBackLink({
        text: 'Back',
        href: backlink
    })
}}
```

### Hint text

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

### `govuk-label` classes

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

### Ensure header elements only wrap text

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
