#!/usr/bin/env node

import { existsSync, mkdirSync, cpSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const HOME = process.env.HOME
if (!HOME) { console.error('error: HOME not set'); process.exit(1) }

const TEMPLATES = {
  hermes: {
    type: 'python-package',
    src: resolve(ROOT, 'templates/hermes/'),
    dest: (name) => resolve(HOME, '.hermes/plugins', name),
    config: (name) => ({
      file: resolve(HOME, '.hermes/config.yaml'),
      patch: `plugins:\n  enabled:\n    - ${name}\n`,
    }),
  },
  opencode: {
    type: 'typescript-plugin',
    src: resolve(ROOT, 'templates/opencode/'),
    dest: () => resolve(HOME, '.config/opencode/plugins'),
    config: null,
  },
  openclaw: {
    type: 'typescript-hook',
    src: resolve(ROOT, 'templates/openclaw/'),
    dest: (name) => resolve(HOME, '.openclaw/hooks', name),
    config: (name) => ({
      file: resolve(HOME, '.openclaw/openclaw.json'),
      patch: `"${name}": { "enabled": true }`,
    }),
  },
  kiro: {
    type: 'python-script',
    src: resolve(ROOT, 'templates/kiro/'),
    dest: () => resolve(HOME, '.kiro/hooks'),
    config: () => ({
      file: resolve(HOME, '.kiro/agents/agent_config.json'),
      patch: null,
    }),
  },
}

function detectFramework() {
  const checks = {
    hermes: resolve(HOME, '.hermes/config.yaml'),
    opencode: resolve(HOME, '.config/opencode/plugins'),
    openclaw: resolve(HOME, '.openclaw/openclaw.json'),
    kiro: resolve(HOME, '.kiro/agents/agent_config.json'),
  }
  for (const [name, path] of Object.entries(checks)) {
    if (existsSync(path)) return name
  }
  return null
}

function installPlugin(framework, name = 'md-analyzer', dryRun = false) {
  const tmpl = TEMPLATES[framework]
  if (!tmpl) {
    console.error(`error: unknown_framework "${framework}"`)
    console.error(`  supported: ${Object.keys(TEMPLATES).join(', ')}`)
    process.exit(1)
  }

  const destPath = typeof tmpl.dest === 'function' ? tmpl.dest(name) : tmpl.dest

  console.log('')
  console.log('┌─────────────────────────────────────────────────┐')
  console.log(`│  Plugins Builder — Stage 1/3: DETECT             │`)
  console.log('└─────────────────────────────────────────────────┘')
  console.log(`  framework: ${framework}`)
  console.log(`  type:      ${tmpl.type}`)
  console.log(`  plugin:    ${name}`)
  console.log(`  mode:      ${dryRun ? 'DRY-RUN (no changes)' : 'live'}`)
  console.log('')

  if (!existsSync(tmpl.src)) {
    console.error(`error: template_not_found: ${tmpl.src}`)
    console.error(`  run from the plugins-builder repo root`)
    process.exit(1)
  }

  console.log('┌─────────────────────────────────────────────────┐')
  console.log(`│  Stage 2/3: COPY                                 │`)
  console.log('└─────────────────────────────────────────────────┘')
  console.log(`  from: ${tmpl.src}`)
  console.log(`  to:   ${destPath}`)

  if (existsSync(destPath) && readdirSync(destPath).length > 0) {
    console.log(`  ⚠  destination exists and is not empty`)
    console.log(`  use -f to overwrite`)
    if (!dryRun) {
      console.log('  skipped (use -f to force overwrite)')
      return
    }
  }

  if (dryRun) {
    console.log('  [dry-run] would copy files')
    console.log('')
  } else {
    mkdirSync(destPath, { recursive: true })
    cpSync(tmpl.src, destPath, { recursive: true })
    console.log('  done ✓')
    console.log('')
  }

  console.log('┌─────────────────────────────────────────────────┐')
  console.log(`│  Stage 3/3: CONFIGURE                            │`)
  console.log('└─────────────────────────────────────────────────┘')

  if (tmpl.config) {
    const cfg = typeof tmpl.config === 'function' ? tmpl.config(name) : tmpl.config
    if (cfg && cfg.file && cfg.patch) {
      console.log(`  config: ${cfg.file}`)
      console.log(`  add to file:`)
      console.log('')
      console.log(`    ${cfg.patch}`)
      console.log('')
    }
  }

  console.log('  to enable the plugin, see docs:')
  console.log(`  skills/${framework}-plugins-builder/SKILL.md`)
  console.log('')
  console.log('┌─────────────────────────────────────────────────┐')
  console.log(`│  ${dryRun ? 'Dry-run complete' : 'Done'}. Plugin installed at:                      │`)
  console.log(`│  ${destPath.padEnd(49)}│`)
  console.log('└─────────────────────────────────────────────────┘')
  console.log('')
}

function main() {
  const args = process.argv.slice(2)
  const flags = { dryRun: false, force: false }
  const positional = []

  for (const a of args) {
    if (a === '--dry-run' || a === '-n') flags.dryRun = true
    else if (a === '--force' || a === '-f') flags.force = true
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0) }
    else positional.push(a)
  }

  const framework = positional[0] || detectFramework()

  if (!framework) {
    printHelp()
    process.exit(0)
  }

  installPlugin(framework, 'md-analyzer', flags.dryRun)
}

function printHelp() {
  console.log(`
  Plugins Builder — Cross-Framework Plugin Installer

  Usage:
    node scripts/install.mjs [framework] [options]

  Options:
    -n, --dry-run   Preview changes without copying
    -f, --force     Overwrite existing files

  Cascade:
    1. DETECT    — framework auto-detected or specified
    2. COPY      — templates copied to framework path
    3. CONFIGURE — config instructions printed

  Frameworks:
    hermes    ~/.hermes/plugins/<name>/plugin.yaml + __init__.py
    opencode  ~/.config/opencode/plugins/<name>.ts
    openclaw  ~/.openclaw/hooks/<name>/handler.ts
    kiro      ~/.kiro/hooks/pre_read_md.py + agent_config.json

  Also available via skills.sh:
    npx skills add Ev3lynx727/plugins-builder --skill <framework>-plugins-builder
`)
}

main()
