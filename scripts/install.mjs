#!/usr/bin/env node

import {
  existsSync, mkdirSync, cpSync, readdirSync,
  readFileSync, writeFileSync, rmSync, statSync,
} from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const HOME = process.env.HOME
if (!HOME) { console.error('error: HOME not set'); process.exit(1) }

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      target[key] = deepMerge(target[key] || {}, source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}

function readJsonMaybe(path) {
  if (!existsSync(path)) return {}
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return {} }
}

function writeJson(path, data, dryRun) {
  if (dryRun) {
    console.log(`  [dry-run] would write: ${path}`)
    console.log(JSON.stringify(data, null, 2).split('\n').map(l => '    ' + l).join('\n'))
    return
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n')
  console.log('  done ✓')
}

function copyTemplate(src, dest, vars, dryRun) {
  if (dryRun) {
    console.log(`  [dry-run] would copy ${src} → ${dest}`)
    return
  }
  mkdirSync(dest, { recursive: true })

  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name)
    const d = join(dest, entry.name)

    if (entry.isDirectory()) {
      copyTemplate(s, d, vars, dryRun)
    } else {
      let content = readFileSync(s, 'utf8')
      for (const [k, v] of Object.entries(vars)) {
        content = content.split(`{{${k}}}`).join(v)
      }
      writeFileSync(d, content)
    }
  }
}

function removeDirSafe(p, dryRun) {
  if (dryRun) {
    console.log(`  [dry-run] would remove: ${p}`)
    return
  }
  if (existsSync(p)) rmSync(p, { recursive: true, force: true })
}

function removeHookFromSettings(settingsPath, matcher, filePath, dryRun) {
  const data = readJsonMaybe(settingsPath)
  if (!data.hooks?.PreToolUse) return

  data.hooks.PreToolUse = data.hooks.PreToolUse.filter(
    (h) => !(h.matcher === matcher && h.hooks?.some((hh) => hh.file === filePath))
  )

  if (data.hooks.PreToolUse.length === 0) delete data.hooks.PreToolUse
  if (Object.keys(data.hooks).length === 0) delete data.hooks
  if (Object.keys(data).length === 0) {
    if (!dryRun && existsSync(settingsPath)) rmSync(settingsPath)
    return
  }

  writeJson(settingsPath, data, dryRun)
}

const TEMPLATES = {
  hermes: {
    type: 'python-package',
    src: resolve(ROOT, 'templates/hermes/'),
    dest: (name) => resolve(HOME, '.hermes/plugins', name),
    config: (name) => ({
      file: resolve(HOME, '.hermes/config.yaml'),
      hint: `plugins:\n  enabled:\n    - ${name}`,
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
      hint: `"${name}": { "enabled": true }`,
    }),
  },
  kiro: {
    type: 'python-script',
    src: resolve(ROOT, 'templates/kiro/'),
    dest: () => resolve(HOME, '.kiro/hooks'),
    config: () => ({
      file: resolve(HOME, '.kiro/agents/agent_config.json'),
      hint: 'see SKILL.md for config snippet',
    }),
  },
  claude: {
    type: 'typescript-hook',
    src: resolve(ROOT, 'templates/claude/'),
    dest: (name) => resolve(HOME, '.claude/hooks', name),
    config: (name) => ({
      file: resolve(HOME, '.claude/settings.json'),
      patch: (data) => {
        if (!data.hooks) data.hooks = {}
        if (!data.hooks.PreToolUse) data.hooks.PreToolUse = []

        const entry = {
          matcher: 'Read',
          hooks: [{ type: 'file', file: `~/.claude/hooks/${name}/hook.ts` }],
        }
        // avoid duplicate
        const exists = data.hooks.PreToolUse.some(
          (h) => h.matcher === 'Read' && h.hooks?.some((hh) => hh.file === entry.hooks[0].file)
        )
        if (!exists) data.hooks.PreToolUse.push(entry)
        return data
      },
    }),
  },
}

function detectFramework() {
  const checks = {
    claude: resolve(HOME, '.claude/settings.json'),
    hermes: resolve(HOME, '.hermes/config.yaml'),
    opencode: resolve(HOME, '.config/opencode/plugins'),
    openclaw: resolve(HOME, '.openclaw/openclaw.json'),
    kiro: resolve(HOME, '.kiro/agents/agent_config.json'),
  }
  // prefer most specific path first
  const order = ['claude', 'opencode', 'hermes', 'openclaw', 'kiro']
  for (const name of order) {
    if (existsSync(checks[name])) return name
  }
  return null
}

function listPlugins(framework) {
  const tmpl = TEMPLATES[framework]
  if (!tmpl) {
    console.error(`error: unknown_framework "${framework}"`)
    process.exit(1)
  }

  const destPath = typeof tmpl.dest === 'function' ? tmpl.dest('') : tmpl.dest
  console.log(`\nInstalled ${framework} plugins:\n`)

  if (!existsSync(destPath)) {
    console.log('  (none found)')
    return
  }

  const entries = readdirSync(destPath, { withFileTypes: true })
  let count = 0
  for (const entry of entries) {
    if (entry.isDirectory()) {
      console.log(`  • ${entry.name}`)
      count++
    } else if (entry.isFile() && !entry.name.startsWith('.')) {
      console.log(`  • ${entry.name}`)
      count++
    }
  }
  console.log(`\n  Total: ${count} plugin(s)\n`)
}

function uninstallPlugin(framework, name) {
  const tmpl = TEMPLATES[framework]
  if (!tmpl) {
    console.error(`error: unknown_framework "${framework}"`)
    process.exit(1)
  }

  const destPath = typeof tmpl.dest === 'function' ? tmpl.dest(name) : join(tmpl.dest(), name)

  console.log('')
  console.log('┌─────────────────────────────────────────────────┐')
  console.log(`│  Plugins Builder — UNINSTALL                     │`)
  console.log('└─────────────────────────────────────────────────┘')
  console.log(`  framework: ${framework}`)
  console.log(`  plugin:    ${name}`)
  console.log(`  path:      ${destPath}`)
  console.log('')

  if (!existsSync(destPath)) {
    console.log('  ⚠  plugin not found — nothing to remove')
    return
  }

  removeDirSafe(destPath, false)

  // clean up config entry for claude
  if (framework === 'claude' && tmpl.config) {
    const cfg = tmpl.config(name)
    if (cfg.file) {
      removeHookFromSettings(cfg.file, 'Read', `~/.claude/hooks/${name}/hook.ts`, false)
    }
  }

  console.log('  done ✓\n')
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
    console.log(`  use --force to overwrite`)
    if (!dryRun) {
      console.log('  skipped (use --force to force overwrite)')
      return
    }
  }

  if (dryRun) {
    console.log('  [dry-run] would copy files')
    console.log('')
  } else {
    copyTemplate(tmpl.src, destPath, { pluginName: name }, dryRun)
    console.log('  done ✓')
    console.log('')
  }

  console.log('┌─────────────────────────────────────────────────┐')
  console.log(`│  Stage 3/3: CONFIGURE                            │`)
  console.log('└─────────────────────────────────────────────────┘')

  if (tmpl.config) {
    const cfg = typeof tmpl.config === 'function' ? tmpl.config(name) : tmpl.config
    if (cfg && cfg.file) {
      console.log(`  config: ${cfg.file}`)

      if (cfg.patch) {
        // real JSON patching (claude)
        let data = readJsonMaybe(cfg.file)
        data = cfg.patch(data)
        writeJson(cfg.file, data, dryRun)
      } else if (cfg.hint) {
        // just print hint (other frameworks)
        console.log(`  add to file:`)
        console.log('')
        console.log(`    ${cfg.hint}`)
        console.log('')
      }
    }
  }

  console.log('  to enable the plugin, see docs:')
  console.log(`  skills/${framework === 'claude' ? 'claude-hooks' : framework + '-plugins'}-builder/SKILL.md`)
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

  const command = positional[0]

  if (command === 'list') {
    const framework = positional[1] || detectFramework()
    if (!framework) {
      console.error('error: no framework detected. specify one:')
      console.error(`  ${Object.keys(TEMPLATES).join(', ')}`)
      process.exit(1)
    }
    listPlugins(framework)
    process.exit(0)
  }

  if (command === 'uninstall') {
    const framework = positional[1] || detectFramework()
    const pluginName = positional[2]
    if (!framework || !pluginName) {
      console.error('usage: node scripts/install.mjs uninstall <framework> <plugin-name>')
      process.exit(1)
    }
    uninstallPlugin(framework, pluginName)
    process.exit(0)
  }

  // default: install
  const framework = command || detectFramework()

  if (!framework) {
    printHelp()
    process.exit(0)
  }

  const pluginName = positional[1] || 'md-analyzer'

  installPlugin(framework, pluginName, flags.dryRun)
}

function printHelp() {
  console.log(`
  Plugins Builder — Cross-Framework Plugin Installer

  Usage:
    node scripts/install.mjs [command] [framework] [plugin-name] [options]

  Commands:
    install    <framework> [plugin-name]   Scaffold a new plugin (default)
    list       [framework]                 List installed plugins
    uninstall  <framework> <plugin-name>   Remove a plugin

  Options:
    -n, --dry-run   Preview changes without copying
    -f, --force     Overwrite existing files

  Install Cascade:
    1. DETECT    — framework auto-detected or specified
    2. COPY      — templates copied to framework path
    3. CONFIGURE — config patched or instructions printed

  Frameworks:
    claude    ~/.claude/hooks/<name>/          TypeScript hook, settings.json
    hermes    ~/.hermes/plugins/<name>/        Python package, config.yaml
    opencode  ~/.config/opencode/plugins/      TypeScript plugin, auto-discovered
    openclaw  ~/.openclaw/hooks/<name>/        TypeScript hook, openclaw.json
    kiro      ~/.kiro/hooks/                   Python script, agent_config.json

  Examples:
    node scripts/install.mjs claude my-hook
    node scripts/install.mjs hermes md-analyzer --dry-run
    node scripts/install.mjs list claude
    node scripts/install.mjs uninstall claude my-hook

  Also available via skills.sh:
    npx skills add Ev3lynx727/plugins-builder --skill <framework>-plugins-builder
`)
}

main()
