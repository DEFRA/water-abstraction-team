# Sign off

This covers the sign off process for all repos in the Water Abstraction Service.

This kicks in when the team feels thay have a 'release candidate'. Essentially a version of the code they'd like to release to production.

> A release candidate can be one or more repos being shipped to production.

The following process will need to be done individually for each repo in a release candidate.

- [Check for outstanding dependency PRs](#check-for-outstanding-dependency-prs)
- [Check for missing labels](#check-for-missing-labels)
- [Agree version](#agree-version)
- [Bump version](#bump-version)
- [Push up the commit and tag](#push-up-the-commit-and-tag)
- [Update pre-production Jenkins job](#update-pre-production-jenkins-job)
- [Test sign-off](#test-sign-off)
  - [Approval to release](#approval-to-release)
  - [If issues are found](#if-issues-are-found)

## Check for outstanding dependency PRs

Don't worry about any draft feature or fix PRs. But any automated dependency PRs should be checked, approved and merged. These help ensure the app remains up to date and secure.

## Check for missing labels

Review the merged PRs for missing labels eg. `enhancement`, `bug` etc. You can quickly see any PRs merged since the last release by navigating to the repo in your browser, clicking the latest release on the right of the page, then clicking the link near the top that shows the number of commits to main since the release.

## Agree version

We use [semantic versioning](https://semver.org/) to differentiate between patch, minor and major releases. We track releases using [GitHub releases](https://docs.github.com/en/github/administering-a-repository/about-releases). Check the repo to confirm what the last one was.

> Note that the individual repos making up a release candidate can potentially all have different version numbers.

The development team will then review the changes made to decide whether a major, minor, or patch version bump is needed.

> The individual repos making up a release candidate can potentially be updated in different ways -- the UI may only receive a patch version but another part could be a minor update, for example.

## Bump version

> IMPORTANT! Ensure you have checked out the `main` branch for the repo and performed a `git latest && git pull` to get the latest code first.

We use `npm version` to bump the version as this performs several tasks for us with just one command.

> You'll notice we don't create a PR for any of this. Bumping the version is the only time we make an exception to the rule 'all changes on a branch'. We do this to avoid polluting our CHANGELOG with lots of entries.

To update the version, run it with one of the following commands:

```bash
npm version major # Bumps the major version ie. 2.25.1 -> 3.0.0
npm version minor # Bumps the minor version ie. 2.25.1 -> 2.26.0
npm version patch # Bumps the patch version ie. 2.25.1 -> 2.25.2
```

This performs the following steps:

- **Updates the version**: The version number in `package.json` and `package-lock.json` is updated.
- **Updates the CHANGELOG**: We use [auto-changelog](https://github.com/cookpete/auto-changelog) to generate our CHANGELOGs. Our `version` script in `package.json` runs this to update `CHANGELOG.md` and adds it to a commit.
- **Creates a commit**: The changes to `package.json`, `package-lock.json` and `CHANGELOG.md` are added to a commit where the commit message is the new version number, eg. `2.25.2`.
- **Creates a tag**: We use [git annotated tags](https://git-scm.com/book/en/v2/Git-Basics-Tagging) to track our releases and control what Jenkins actually deploys. `npm version` creates this tag for us, where the tag name is the new version number preceded by `v`, eg. `v2.25.2` and the tag message is just the version number, eg. `2.25.2`.

## Push up the commit and tag

Once the version has been bumped, we push the newly-created commit and tag up to the repo:

```bash
git push
git push --tags
```

**Do not** create the release in GitHub at this time. We record the release in GitHub _after_ the app is shipped to production.

## Update pre-production Jenkins job

> If multiple repos are part of the release candidate, wait until all repos have been through the version bump process before updating the Jenkins jobs.

In [Jenkins](https://wal-jenkins.aws-int.defra.cloud/) head to the [Preproduction](https://wal-jenkins.aws-int.defra.cloud/view/Preproduction/) tab and find the appropriate deployment job for the repo we're updating. Click _Configure_ and then update the `DEPLOY_BRANCH` param in the _General->Properties Content_ field with the name of the version tag then save it. For example:

```bash
DEPLOY_BRANCH=v2.25.2
```

Now click the _Build Now_ button and wait for it to succeed.


## Test sign-off

This stage is managed by QA & Test with support from development if needed. With the release candidate deployed to the pre-production environment it is the responsibility of the test analyst to 'sign it off'.

It involves running the full suite of regression tests plus any additional manual testing felt necessary to confirm the expected functionality is included and still working. The release can then be given its 'test signoff'.

For reference our automated acceptance tests for WRLS can be found in the [Water Abstraction UI repo](https://github.com/DEFRA/water-abstraction-ui).

### Approval to release

Once all testing phases are complete we just need confirmation from the team's QA that we are ok to then schedule the release.

> Docs on scheduling are forthcoming!

### If issues are found

We abort the sign-off process if issues are found that will require code changes.

Those changes would be managed within the team as normal: logged, prioritised and planned into a sprint. Once implemented, we start the whole sign-off process again once the team feels we are ready for release. This includes creating a new tag (version) for any repos being updated. We **do not** reuse tags which have previously been generated.
