# Queries

From time-to-time we are asked to create and run ad-hoc queries to extract data from the service. There are also those we create for ourselves or those we discover in the existing service.

We think there is some value in being able to reference these queries when creating new ones in the future. So, we have this section to store them.

## Caveat

There is no intention to maintain these queries once they have been created. As changes are made to the service it is likely these ad-hoc queries will error or generate misleading results.

They are here purely as a record and for future reference.

## How to

For each query create a [Markdown](https://www.markdownguide.org/) document with this template.

`````markdown
# Title

- **SOURCE** [business|team|legacy]
- **DATE CREATED (approx)**

Summary of what the query is doing and why it was created.

## Query

```sql
SELECT * FROM water.licences
```

## Detail [optional]

Elaborate on any gnarly sections in the query or issues in the data that needed to be overcome.
`````

Name the file based on the title but use your own common sense. It is fine to have a verbose title and a shortened version of it for the filename. For example, **Licences with charge versions created after 2022-04-01** might become `lics_with_chg_vers_after_20220401.md`.
