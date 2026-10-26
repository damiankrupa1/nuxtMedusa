#!/usr/bin/env node
// Checks a merge for breakage that git does not report as a conflict.
//
//   node .claude/skills/merge-branch/scripts/merge-checks.mjs
//       during a merge in progress: ours=HEAD, theirs=MERGE_HEAD, tree=working tree
//   node .claude/skills/merge-branch/scripts/merge-checks.mjs --commit <merge-sha>
//       after the merge commit: ours=<sha>^1, theirs=<sha>^2, tree=<sha>
//   --ours <ref> --theirs <ref> [--tree <ref>]   explicit refs (tree defaults to the working tree)
//
// Exit code 1 when anything is found.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? null : args[i + 1]
}

const git = (...cmd) =>
  execFileSync('git', cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const gitOk = (...cmd) => {
  try {
    return git(...cmd)
  } catch (error) {
    // git grep exits 1 when nothing matches
    if (error.status === 1) return ''
    throw error
  }
}

const commit = arg('commit')
const ours = arg('ours') ?? (commit ? `${commit}^1` : 'HEAD')
const theirs = arg('theirs') ?? (commit ? `${commit}^2` : 'MERGE_HEAD')
const tree = arg('tree') ?? commit ?? null
const base = git('merge-base', ours, theirs).trim()

// During a merge the working tree is the truth: a conflicted file has no
// stage-0 entry in the index to read.
const readFromTree = (path) =>
  tree ? git('show', `${tree}:${path}`) : readFileSync(path, 'utf8')
const listTree = (dir) =>
  (tree
    ? git('ls-tree', '-r', '--name-only', tree, '--', dir)
    : git('ls-files', '--', dir)
  )
    .split('\n')
    .filter(Boolean)
const grepTree = (pattern, ...paths) =>
  gitOk('grep', '-n', '-E', pattern, ...(tree ? [tree] : []), '--', ...paths)
    .split('\n')
    .filter(Boolean)

const findings = []
const report = (title, lines) => {
  if (lines.length) findings.push({ title, lines })
}

// 1. Conflict markers left anywhere in the merged tree.
report('Leftover conflict markers', grepTree('^(<{7}|={7}|>{7})( |$)', '.'))

// 2. i18n keys added by the incoming side that don't exist after the merge
//    (e.g. keys this branch moved or renamed). Dynamic keys can't be checked.
const localeFiles = listTree('i18n/locales').filter((f) => f.endsWith('.json'))
const locales = Object.fromEntries(
  localeFiles.map((f) => [f, JSON.parse(readFromTree(f))]),
)
const incomingAdded = git('diff', '--unified=0', base, theirs, '--', 'app')
  .split('\n')
  .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
  .join('\n')
const keys = [
  ...new Set(
    [...incomingAdded.matchAll(/(?:\$t|\bt)\(\s*(['"])([\w.-]+)\1/g)].map(
      (m) => m[2],
    ),
  ),
]
const get = (obj, key) =>
  key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)
report(
  `i18n keys used by incoming changes but missing after the merge (${keys.length} checked)`,
  localeFiles.flatMap((f) =>
    keys
      .filter((k) => get(locales[f], k) === undefined)
      .map((k) => `${f}: ${k}`),
  ),
)

// 3. Files this branch renamed or deleted under app/ that the merged tree
//    still references — by path, or by Nuxt auto-import component name.
const pascal = (s) =>
  s
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
const componentName = (path) => {
  const m = path.match(/^app\/components\/(.+)\.vue$/)
  if (!m) return null
  const parts = m[1].split('/').map(pascal)
  if (parts.length > 1 && parts.at(-1) === 'Index') parts.pop()
  return parts.join('')
}
const goneOnOurSide = git(
  'diff',
  '--name-status',
  '-M',
  base,
  ours,
  '--',
  'app',
)
  .split('\n')
  .filter((l) => /^(R\d*|D)\t/.test(l))
  .map((l) => l.split('\t')[1])
for (const oldPath of goneOnOurSide) {
  const stem = oldPath.replace(/^app\//, '').replace(/\.(vue|ts|js)$/, '')
  const name = componentName(oldPath)
  const pattern = name
    ? `(${stem.replace(/[.]/g, '\\.')}|<${name}[\\s/>]|\\b${name}\\b)`
    : stem.replace(/[.]/g, '\\.')
  report(
    `Still referenced after this branch moved or removed ${oldPath}${name ? ` (component ${name})` : ''}`,
    grepTree(pattern, 'app', 'tests', 'server'),
  )
}

console.log(
  `merge-checks: base ${base.slice(0, 7)}, ours ${ours}, theirs ${theirs}, tree ${tree ?? 'working tree'}`,
)
if (!findings.length) {
  console.log('No findings.')
} else {
  for (const { title, lines } of findings) {
    console.log(`\n## ${title}`)
    for (const line of lines) console.log(`  ${line}`)
  }
  process.exitCode = 1
}
