<#
.SYNOPSIS
    Creates an isolated git worktree + branch for a parallel agent task.

.DESCRIPTION
    Companion script for the worktree-manager skill. Computes a branch name
    and worktree directory from a task name, checks for conflicts, and only
    with -Apply actually creates the worktree. Never commits, pushes,
    merges, rebases, deletes anything, or runs tests/lint/build. Does not
    copy .env or any other files into the new worktree. Does not launch a
    new agent session itself - it prints the exact command to run instead.

.PARAMETER TaskName
    Short task description, e.g. "fix-checkout-bug". Slugified to derive
    the branch name and worktree directory name.

.PARAMETER BaseRef
    Git ref to branch from. Defaults to the current branch.

.PARAMETER BranchPrefix
    Prefix for the new branch name. Default: "agents/".

.PARAMETER Apply
    Without this switch, the script only prints the plan (dry run, default).
    Pass -Apply to actually create the branch and worktree.

.EXAMPLE
    ./new-agent.ps1 -TaskName "fix-checkout-bug"
    ./new-agent.ps1 -TaskName "fix-checkout-bug" -Apply
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$TaskName,

  [string]$BaseRef,

  [string]$BranchPrefix = "agents/",

  [switch]$Apply
)

$ErrorActionPreference = "Stop"

function Get-Slug([string]$text) {
  $slug = $text.ToLowerInvariant()
  $slug = $slug -replace '[^a-z0-9]+', '-'
  $slug = $slug.Trim('-')
  return $slug
}

# --- Repo sanity checks ---
$repoRoot = (git rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) {
  Write-Error "Not inside a git repository."
  exit 1
}
$repoRoot = $repoRoot.Trim() -replace '/', '\'

$currentBranch = (git branch --show-current).Trim()
if (-not $BaseRef) {
  if (-not $currentBranch) {
    Write-Error "Currently in detached HEAD with no -BaseRef given. Pass -BaseRef explicitly."
    exit 1
  }
  $BaseRef = $currentBranch
}

$status = git status --porcelain
if ($status) {
  Write-Warning "Working tree has uncommitted changes. They will NOT be carried into the new worktree automatically - commit or stash them first if the new agent needs them."
}

# --- Compute names ---
$slug = Get-Slug $TaskName
if (-not $slug) {
  Write-Error "TaskName produced an empty slug - use letters/numbers."
  exit 1
}
$branchName = "$BranchPrefix$slug"
$worktreePath = "$repoRoot.worktrees\$slug"

Write-Host ""
Write-Host "=== Plan ===" -ForegroundColor Cyan
Write-Host "Repo root:       $repoRoot"
Write-Host "Base ref:        $BaseRef"
Write-Host "New branch:      $branchName"
Write-Host "Worktree path:   $worktreePath"
Write-Host ""

# --- Conflict checks (never force past these) ---
git show-ref --verify --quiet "refs/heads/$branchName"
if ($LASTEXITCODE -eq 0) {
  Write-Error "Branch '$branchName' already exists. Pick a different -TaskName, or remove/rename the existing branch yourself first."
  exit 1
}
if (Test-Path $worktreePath) {
  Write-Error "Directory '$worktreePath' already exists. Pick a different -TaskName, or remove it yourself first."
  exit 1
}

if (-not $Apply) {
  Write-Host "Dry run only - no changes made. Re-run with -Apply to create the branch and worktree." -ForegroundColor Yellow
  exit 0
}

# --- Apply ---
Write-Host "Creating worktree..." -ForegroundColor Cyan
git worktree add -b $branchName $worktreePath $BaseRef
if ($LASTEXITCODE -ne 0) {
  Write-Error "git worktree add failed - nothing else was done."
  exit 1
}

$headCommit = (git -C $worktreePath rev-parse --short HEAD).Trim()

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Worktree path:   $worktreePath"
Write-Host "Branch:          $branchName"
Write-Host "Base commit:     $headCommit (from $BaseRef)"
Write-Host ""
Write-Host "To start a new Claude Code session in this worktree, run:" -ForegroundColor Cyan
Write-Host "  cd `"$worktreePath`"; claude"
Write-Host ""
Write-Host "Dependencies and local config (node_modules, .env) are not copied automatically - install/configure them in the new worktree if the task needs them." -ForegroundColor Yellow
