# Ways of working

All new team members are encouraged to read [Software development standards](https://github.com/DEFRA/software-development-standards) and [DST-Guides](https://github.com/DEFRA/dst-guides) first. Essentially any processes or ways of working outlined in these we follow. What we have here is addendum to that.

## Pull requests

Our pull requests follow the standard set out in [DST Guides](https://github.com/DEFRA/dst-guides/blob/master/process/pull_request.md). The TL;DR is

- all changes are made on a branch
- all changes are peer reviewed
- respect your reviewer; keep PR's small and try to have a meaningful commit history
- you only need approval from one team member to merge
- commits are squashed down to one before merging; so make it meaningful

Some other things that are not covered that are particular to our team are

### Assignment

When you create the PR assign yourself to it. We treat the person assigned as the main contributor, rather than who happens to be working on it at that time. That way we know who to direct any questions or comments to.

### Draft PR's

We've always considered PR's to be 'work in progress' [WIP] until you request a review. Now GitHub has built in support for [marking a PR as draft](https://github.blog/2019-02-14-introducing-draft-pull-requests/) when you create it.

This will prevent the PR from being merged until you click the 'ready for review' button, and the GitHub UI makes the `draft` status nice and clear in its UI.

So open all new PR's as draft, and avoid adding '[WIP]' to the title or description.

#### Convert to draft

If a PR results in changes needing to be made, use the option in the GitHub UI to 'convert to draft'. Then once the changes have been made and it is ready to be reviewed again, click the 'ready for review' button.

Repeat until PR is approved!

### Label everything

Label all PR's. The labels are used when generating our CHANGELOGs so it's essential every PR gets one.

Currently the labels we use are

|Name         |Description                                                     |
|-------------|----------------------------------------------------------------|
|bug          |Something isn't working                                         |
|dependencies |Pull requests that update a dependency file                     |
|documentation|Improvements or additions to documentation                      |
|enhancement  |New feature or request                                          |
|housekeeping |Refactoring, tidying up or other work which supports the project|
|security     |Pull requests that address a security vulnerability.            |

If you are unsure what to use just ask another team member.
