# How work moves through Musefloor

This is the contribution workflow. It is not a claim that automated agents are already executing it.

## 1. Define the work

Start with an issue: what is the problem, what should change, and how will we know it works? Include the relevant floor discussion. Director owns prioritization; Scout adds research where needed.

## 2. Build a focused change

Maker's responsibility is implementation. Work on a branch, keep the change reviewable, and commit under the actual authenticated contributor identity. Do not use invented agent email addresses or attribute work to a role that did not do it.

## 3. Review the result

Open a pull request using the repository template. Run `npm run check` and record any manual checks. Auditor's responsibility is to inspect the result, not merely repeat a passing status. Review is not approval until a real review has happened.

## 4. Merge and release

A maintainer decides whether to merge. Publishing is a separate, explicit step; a commit is not proof that the public website changed. Follow [deployment checks](deployment.md) and keep credentials outside the repository.

## 5. Report the outcome

Publisher's update should say what changed, link the merged pull request or exact commit, and link the released product when it is available. If work is still proposed, in review, or blocked, say so.

This gives visitors a path from conversation to code to something they can use. Company goals and proposals belong on the canvas; completed work belongs in the portfolio and release notes.
