---
name: overnight-work
description: Schedule agent work for a later time, for example "do this at 2:00", and a continuation window when the first one runs out of API limit ("and continue at 7:00"). Use when the owner asks to start a task at a given hour, run something overnight, or resume it later; also for Polish requests like "zaplanuj na noc", "o 2:00", "kontynuuj o 7:00", "jak skończą się tokeny".
---

# Overnight work: scheduling a task and its continuation

Used when the owner wants work to start later (a clock time) and to carry on after the 5-hour API limit resets. It only schedules; the work itself is done by agents in worktrees, as in `spawn-issue-agents` and `worktree-manager` (read their safety rules first: no stash, no force operations, nothing deleted).

## What can and cannot be done

- **`CronCreate` (in this Claude session).** One-shot jobs at a local time (`recurring: false`, pinned minute, hour, day and month). The job's prompt is enqueued into **this session** when the time comes. Facts that decide whether it works:
  - **The session must be open and the computer awake.** Jobs live in memory only (`durable` has no effect); they are gone when the session ends. A sleeping laptop fires nothing until it wakes. On macOS keep it awake with `caffeinate -dimsu` in a terminal (and plugged in); closing the lid sleeps it.
  - **A job fires only when the session is idle** (not mid-query). Background agents don't block this.
  - The scheduler shifts a job slightly (up to 90 s early on `:00` and `:30`). Prefer an off-minute (`2:03`, `7:04`) unless the owner means an exact time, and tell the owner the **actual next run time** the tool returns, not the cron expression.
  - Recurring jobs expire after 7 days. Use one-shots for "at 2:00" and "at 7:00".
- **Cloud routines (the `schedule` skill, `RemoteTrigger`).** Run on claude.ai, so the laptop can be off, but they have **no local state**: no worktrees, no Docker, no local secrets, only a clone of the repository and `gh`. Right for tasks that need only the repository (reports, reviews, issue drafts); wrong for anything that needs Docker or the existing worktrees. Check that the account has them before promising it.
- `ScheduleWakeup` is only for `/loop` pacing (delays up to one hour); it is not a way to run something at 2:00.

## Procedure

1. **Settle three things with the owner** (ask only what is missing):
   - _What:_ the task must already have a spec, normally a GitHub issue. If it has none, write the issue first; an unattended agent needs a brief, not a chat history.
   - _When:_ the start time and the continuation time (the API limit resets 5 hours after it was hit; the owner usually names the second time).
   - _Authorization:_ what may be done without asking. The permission system can refuse a `git push` or a PR while nobody is there, and an unattended refusal just stops the job. Say so, and agree on what to do then (default: leave local commits and write it in the state file).
2. **Write the brief** to a file in the scratchpad (`.../scratchpad/overnight/<task>-brief.md`): the agent prompt with `{{WORKTREE}}` and `{{BRANCH}}` placeholders, so the start job needs no decisions. Use the briefing template of `spawn-issue-agents` (read `CLAUDE.md` and the skills, Node 22 path, husky symlinks, no push or PR from the agent, a final report), and add: "if you hit the API limit your work is saved in the worktree; after a resume read your own changes first (`git status`, `git log`) and continue, do not start over".
3. **Create a state file** `.../scratchpad/overnight/state.md` (agent id, start time, status). Jobs append to it, and it is what the owner reads in the morning.
4. **Schedule two one-shot jobs** with `CronCreate`:
   - **Start job** (about the first time): fetch, create the worktree from `origin/main` (reuse it if it exists, never delete), launch one background agent with the brief, record its id in the state file. When the agent reports: verify its diff against the report, push, open the PR, create the follow-up issues, check CI once, update the state file.
   - **Continuation job** (about the second time), written to be **idempotent**: it reads the state file but checks the real state (`git log` and `status` of the worktree, `gh pr list --head <branch>`); if the agent is still running do nothing; if it stopped before its report (a rate-limit failure) resume it with `SendMessage` to its id ("re-read your own changes and continue the brief"); if it finished and there is no PR, finish the PR steps; if the PR exists, check CI once. It always ends by appending a short summary to the state file.
   - Both jobs carry the constraints: no merges, no deletion of worktrees or branches (local or remote), no production or secret changes, and a refused push or PR is not worked around.
5. **Verify** with `CronList` that both jobs exist, then tell the owner: the real run times, that the session must stay open and the laptop awake (and how), what happens at a permission refusal, where the state file is, and that nothing was run yet.

## Rules

- Never schedule a task that needs a decision from the owner midway; resolve the decisions in the issue first and record them there.
- One agent per task and one worktree per agent; never a second agent on the same worktree. A dead agent is resumed with `SendMessage`, not replaced.
- The jobs verify and report; they do not merge, close issues or touch anything the owner did not authorize in step 1.
- A morning summary beats silence: the state file must say what ran, what is open and what the owner has to decide, even when nothing happened (for example because the computer slept).
