#!/usr/bin/env node
/**
 * Release script for plugins-builder
 *
 * Workflow: changelog → bump version → commit → tag → push → publish
 *
 * Usage:
 *   node scripts/release.mjs patch    # 0.2.0 → 0.2.1
 *   node scripts/release.mjs minor    # 0.2.0 → 0.3.0
 *   node scripts/release.mjs major    # 0.2.0 → 1.0.0
 *   node scripts/release.mjs 0.3.0    # explicit version
 */

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function run(cmd, opts = {}) {
  console.log(`  $ ${cmd}`)
  return execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...opts })
}

function getPackageVersion() {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
  return pkg.version
}

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split('.').map(Number)
  switch (type) {
    case 'major': return `${major + 1}.0.0`
    case 'minor': return `${major}.${minor + 1}.0`
    case 'patch': return `${major}.${minor}.${patch + 1}`
    default:
      if (/^\d+\.\d+\.\d+$/.test(type)) return type
      throw new Error(`Unknown bump type: ${type}. Use patch, minor, major, or semver.`)
  }
}

function updatePackageVersion(version) {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
  pkg.version = version
  writeFileSync(resolve(ROOT, 'package.json'), JSON.stringify(pkg, null, 2) + '\n')
}

function main() {
  const type = process.argv[2]
  if (!type || type === '--help' || type === '-h') {
    console.log(`
  Release script for plugins-builder

  Usage:
    node scripts/release.mjs patch    # bump patch version
    node scripts/release.mjs minor    # bump minor version
    node scripts/release.mjs major    # bump major version
    node scripts/release.mjs 0.3.0    # set explicit version

  Steps performed:
    1. Bump version in package.json
    2. Generate CHANGELOG.md via git-cliff
    3. Commit version + changelog
    4. Tag (vX.Y.Z)
    5. Push to origin
    6. Publish to npm (optional — prompts first)
`)
    process.exit(0)
  }

  const current = getPackageVersion()
  const next = bumpVersion(current, type)
  const tag = `v${next}`

  console.log(`\n🏷️  Release: ${current} → ${next} (${tag})\n`)

  // 1. Bump version
  console.log('Step 1/6: Bump version in package.json')
  updatePackageVersion(next)

  // 2. Changelog
  console.log('\nStep 2/6: Generate CHANGELOG.md')
  try {
    run(`git-cliff --output CHANGELOG.md`)
  } catch {
    console.error('  ⚠️  git-cliff failed. Is it installed?')
    process.exit(1)
  }

  // 3. Commit
  console.log('\nStep 3/6: Commit changes')
  run(`git add package.json CHANGELOG.md`)
  run(`git commit -m "chore(release): prepare for ${tag}"`)

  // 4. Tag
  console.log('\nStep 4/6: Create tag')
  run(`git tag -a ${tag} -m "Release ${tag}"`)

  // 5. Push
  console.log('\nStep 5/6: Push to origin')
  run(`git push origin develop`)
  run(`git push origin ${tag}`)

  // 6. Publish
  console.log('\nStep 6/6: Publish to npm')
  console.log(`  Ready to run: npm publish`)
  console.log(`  (execute manually, or confirm below)\n`)

  // Can't prompt in non-interactive mode, so just print instructions
  console.log(`\n✅  Release ${tag} complete!`)
  console.log(`   To publish: npm publish`)
  console.log(`   Or run:     node scripts/release.mjs ${type} && npm publish`)
  console.log('')
}

main()
