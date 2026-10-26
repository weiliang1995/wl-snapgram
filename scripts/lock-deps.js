#!/usr/bin/env node
/**
 * Lock dependency versions in package.json by removing range prefixes (^, ~, >=, etc.).
 *
 * Covers dependencies, devDependencies, peerDependencies and optionalDependencies.
 * When a package is installed, its exact version from node_modules is used, so
 * "^19.0.0" becomes the version you are actually running (e.g. "19.3.1").
 * Otherwise the prefix is simply stripped. After rewriting, `pnpm install` runs
 * to update pnpm-lock.yaml.
 *
 * Usage:
 *   node scripts/lock-deps.js            # rewrite package.json, then pnpm install
 *   node scripts/lock-deps.js --no-install  # rewrite package.json only
 *   node scripts/lock-deps.js --check    # report only, exit 1 if anything is unlocked (CI)
 *   node scripts/lock-deps.js --strip    # strip prefixes only, ignore node_modules
 *   node scripts/lock-deps.js path/to/package.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const EXACT = /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/
const PREFIXED = /^(?:\^|~|>=|<=|>|<|=|v)\s*(\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?)$/
// Specs that point somewhere other than the registry, so there's nothing to lock.
const NON_REGISTRY = /^(?:workspace:|file:|link:|portal:|patch:|npm:|git|github:|https?:|catalog:)|\//

const args = process.argv.slice(2)
const checkOnly = args.includes('--check')
const stripOnly = args.includes('--strip')
const noInstall = args.includes('--no-install')
const pkgPath = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'package.json')
const rootDir = path.dirname(pkgPath)

function installedVersion(name) {
  try {
    const file = path.join(rootDir, 'node_modules', name, 'package.json')
    return JSON.parse(fs.readFileSync(file, 'utf8')).version
  } catch {
    return undefined
  }
}

function lock(name, spec, field) {
  if (EXACT.test(spec)) return { version: spec }
  if (NON_REGISTRY.test(spec)) return { skip: 'non-registry spec' }

  // Peer ranges like "^18 || ^19" or ">=18 <20" are intentionally wide; don't guess.
  const match = spec.trim().match(PREFIXED)
  if (!match) return { skip: field === 'peerDependencies' ? 'complex peer range' : 'unsupported range' }

  const installed = stripOnly ? undefined : installedVersion(name)
  // Only trust the installed version if it is exact; peers are usually not installed locally.
  if (installed && EXACT.test(installed)) return { version: installed }
  return { version: match[1] }
}

const raw = fs.readFileSync(pkgPath, 'utf8')
const pkg = JSON.parse(raw)
const changes = []
const skipped = []

for (const field of DEP_FIELDS) {
  const deps = pkg[field]
  if (!deps) continue
  for (const [name, spec] of Object.entries(deps)) {
    const result = lock(name, spec, field)
    if (result.skip) {
      skipped.push({ field, name, spec, reason: result.skip })
    } else if (result.version !== spec) {
      changes.push({ field, name, from: spec, to: result.version })
      deps[name] = result.version
    }
  }
}

for (const c of changes) console.log(`  ${c.field}: ${c.name}  ${c.from} -> ${c.to}`)
for (const s of skipped) console.warn(`  skipped ${s.field}: ${s.name}@${s.spec} (${s.reason})`)

if (changes.length === 0) {
  console.log('All dependency versions are already locked.')
  process.exit(0)
}

if (checkOnly) {
  console.error(`\n${changes.length} unlocked version(s) found. Run "node scripts/lock-deps.js" to fix.`)
  process.exit(1)
}

// Preserve the file's indentation and trailing newline.
const indent = raw.match(/^[ \t]+(?=")/m)?.[0] ?? 2
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, indent) + (raw.endsWith('\n') ? '\n' : ''))
console.log(`\nLocked ${changes.length} version(s) in ${path.relative(process.cwd(), pkgPath) || pkgPath}.`)

if (noInstall) process.exit(0)

// Sync the lockfile and node_modules with the new exact versions.
console.log('\nRunning "pnpm install"...\n')
const install = spawnSync('pnpm', ['install'], { cwd: rootDir, stdio: 'inherit', shell: process.platform === 'win32' })
if (install.error) {
  console.error(`Failed to run pnpm: ${install.error.message}`)
  process.exit(1)
}
process.exit(install.status ?? 1)
