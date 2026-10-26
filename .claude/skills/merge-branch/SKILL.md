---
name: merge-branch
description: Merge another branch (usually main) into the current branch and resolve the conflicts — only simple conflicts automatically, every doubtful or hard one together with the user — then report what conflicted and how it was resolved. Use this whenever the user asks to merge, sync, update or catch up a branch with main or another branch, or to resolve merge conflicts, including Polish phrasings like "domerguj main", "zmerguj", "zaciągnij main", "zaktualizuj brancha z mainem" or "rozwiąż konflikty", even when they don't say "skill".
---

# Merge a branch

The user wants merges done for them, but on their terms: you resolve only the conflicts whose right answer is obvious, you bring every doubtful or hard one to them, and you finish with a summary of what conflicted and how it was resolved. Write everything you say to the user, including the summary, in their language.

The conflicts git reports are rarely the dangerous part. The real damage comes from things that merge cleanly but break: incoming code that references something this branch renamed or removed, or incoming code that brings back something this branch deliberately removed. Steps 3 and 5 are about those.

## Ground rules

- Never push. Never rebase, `reset`, `merge --abort`, force anything or rewrite history without asking — `merge --abort` throws away resolutions already made.
- Never skip hooks (`--no-verify`) and never change git config; pass settings per command with `git -c ...`.
- Merging is the user's request to create the merge commit, so conclude it once verification passes (step 6). If they only asked you to resolve the conflicts of a merge already in progress, ask before concluding it.

## 1. Prepare

1. `git status --short --branch`. If the working tree isn't clean, stop and ask. A merge on top of uncommitted work mixes the user's changes into the merge, and the stash is shared between worktrees, so don't stash on your own.
2. `git fetch origin`. Merge the remote ref (`origin/main`), not the local branch: a local `main` in a worktree setup is often stale. If they differ, say so in one line.
3. Preview before touching anything:
   - `git log --oneline HEAD..origin/main` — what comes in, and `git merge-base HEAD origin/main`.
   - Files changed on both sides since the merge base, i.e. the intersection of `git diff --name-only <base> HEAD` and `git diff --name-only <base> origin/main`. These are the likely conflicts; read the incoming commit messages for them now, because they tell you the other side's intent.

## 2. Merge without committing

```bash
git -c merge.conflictStyle=zdiff3 merge --no-ff --no-commit origin/main
```

`--no-commit` keeps the merge open even when git resolves everything itself, so the checks in step 5 run before anything is committed. `zdiff3` shows the merge base inside each conflict, which is what makes the classification in step 3 reliable: you see what each side changed, not just two final versions. For a file already conflicted without it: `git checkout --conflict=zdiff3 -- <file>`.

## 3. Understand and classify every conflict

For each conflicted file, work out what each side intended before resolving anything:

- this branch: `git log --oneline <base>..HEAD -- <file>` and `git diff <base> HEAD -- <file>`
- incoming: `git log --oneline <base>..MERGE_HEAD -- <file>` and `git diff <base> MERGE_HEAD -- <file>`

Then put every conflict hunk in one of two groups.

**Simple — resolve it yourself.** You can state each side's intent in one sentence, the intents don't contradict each other, and the result keeps both without a judgment call. Typical cases:

- One side only reformatted (Prettier line wrapping, whitespace) and the other changed content → take the content, then format.
- One side applied a mechanical, repo-wide change (a hex color → token, a renamed CSS class, an import path → alias) and the other changed content on the same lines → take the content and re-apply the mechanical change.
- Both sides added different, independent entries (imports, i18n keys, list items, route meta keys) → keep both, in a sensible order.
- Both sides made the identical change → keep one.

Example from this repo: this branch replaced `text-[#dbddd3]` with `text-color-sage` and Prettier-wrapped the lines; `main` replaced the static text on the same lines with `cms?.label ?? $t('…')`. Resolution: `main`'s content and structure, with `text-color-sage` re-applied.

**Needs the user — ask, don't resolve.** Anything where the result depends on a choice, or where you are not sure of an intent:

- both sides changed behavior, logic, data flow or values of the same thing (validation rules, a computed, a config value, copy text, a dependency version);
- one side moved, renamed or deleted a file that the other side modified (modify/delete, rename/modify);
- tests on the two sides expect different behavior;
- `package.json` / `pnpm-lock.yaml` — never hand-merge a lockfile; propose taking one side and regenerating it with `pnpm install`, which changes dependencies, so ask first;
- `CLAUDE.md` and skills where the two sides state rules that contradict each other (rules that merely sit side by side are simple);
- you can't find out why one side changed what it changed.

If you hesitate between the two groups, it needs the user. A wrong silent resolution costs far more than a question.

## 4. Resolve

- Simple conflicts: resolve them, then run the formatter on the files you resolved (`pnpm exec prettier --write <files>`). Format only those files, not every incoming file, so the merge commit contains the resolution and nothing else.
- Hard conflicts: collect them and ask in one go with AskUserQuestion (up to 4 per call). For each, give the file, what each side did and why, the options (ours / theirs / a concrete combination), and your recommendation first. Resolve exactly as decided.
- Don't change incoming code outside the conflict hunks. The one exception: incoming code that brings back something this branch deliberately removed (e.g. a raw hex this branch replaced everywhere with tokens) — restore this branch's change and list it in the summary. Any other problem in incoming code goes in the summary under "found, not fixed".

## 5. Verify

Run all of these before concluding the merge:

1. `git diff --name-only --diff-filter=U` is empty, and `git diff --check` reports no conflict markers.
2. `node .claude/skills/merge-branch/scripts/merge-checks.mjs` — finds what git doesn't flag: leftover conflict markers, i18n keys used by incoming changes that no longer exist after the merge, and files or Nuxt components this branch moved or removed that the merged tree still references. For an already concluded merge: `--commit <merge-sha>`.
3. `pnpm lint` and the full `pnpm test`.
4. Check incoming new code against this branch's conventions (the skills under `.claude/skills/`, e.g. raw hex colors, relative imports, bare `<img>`) and note violations for the summary; don't fix them in the merge.

If anything fails, stop and tell the user what failed instead of concluding the merge.

## 6. Conclude

`git commit --no-edit`, with hooks. Then `git status --short --branch`, and don't push.

## 7. Summary

Always end with this summary, in the user's language, keeping the section order:

```
MERGE: <ref> → <branch> — <n> commits, <m> files
RESULT: merge commit <sha>, not pushed | stopped before committing: <why>

CONFLICTS (<k> files):
| File | This branch | Incoming | Type | Resolution | Decided by |

MERGED BY GIT, CHECKED: <files and what you checked in them>
CHANGED OUTSIDE CONFLICTS: <e.g. restored a token over an incoming raw hex> | none
FOUND, NOT FIXED: <incoming code against this branch's conventions, follow-ups> | none
VERIFICATION: <markers, merge-checks, lint, tests with counts; what was not verified, e.g. "not checked in a browser">
NEXT: <push? issues for the findings?>
```

"Type" is the group from step 3 with a few words, e.g. "simple — formatting vs content", "simple — token vs content", "user — both changed validation". "Decided by" is "me" or "user". Report anything that went wrong or was skipped plainly in the summary.
