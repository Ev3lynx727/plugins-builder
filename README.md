# Plugins Builder

[![skills.sh](https://skills.sh/b/Ev3lynx727/plugins-builder)](https://skills.sh/Ev3lynx727/plugins-builder)

Cross-framework plugin scaffold generator. Supports OpenCode, Hermes, OpenClaw, Kiro CLI, and Claude Code.

Scaffold a working plugin for any agent framework in one command.

## Cascade

```
┌─────────────────────────────────────────────────────┐
│  npx skills add Ev3lynx727/plugins-builder         │  ← skills.sh discovery
│                                                     │
│  ┌─ API ──────────────────────────────────────────┐ │
│  │  node scripts/install.mjs [framework]           │ │  ← direct install
│  │  node scripts/install.mjs opencode              │ │
│  │  node scripts/install.mjs hermes                │ │
│  │  node scripts/install.mjs openclaw              │ │
│  │  node scripts/install.mjs kiro                  │ │
│  │  node scripts/install.mjs claude                │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ DOCS ─────────────────────────────────────────┐ │
│  │  README.md   — this file, cascade overview     │ │
│  │  INSTALL.md  — framework-specific instructions  │ │
│  │  skills/     — per-framework SKILL.md files     │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ SKILLS.SH ────────────────────────────────────┐ │
│  │  oc-plugins-builder     — OpenCode plugins      │ │
│  │  hermes-plugins-builder — Hermes plugins        │ │
│  │  openclaw-hooks-builder — OpenClaw hooks        │ │
│  │  kiro-hooks-builder     — Kiro CLI hooks        │ │
│  │  claude-hooks-builder   — Claude Code hooks     │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Auto-detect framework and install
node scripts/install.mjs

# Or specify a framework
node scripts/install.mjs opencode
node scripts/install.mjs hermes
node scripts/install.mjs openclaw
node scripts/install.mjs kiro
node scripts/install.mjs claude

# Dry-run to preview
node scripts/install.mjs claude my-hook --dry-run

# List installed plugins
node scripts/install.mjs list claude

# Uninstall a plugin
node scripts/install.mjs uninstall claude my-hook
```

## Via skills.sh

```bash
# Discover and install individual skills
npx skills add Ev3lynx727/plugins-builder --skill oc-plugins-builder
npx skills add Ev3lynx727/plugins-builder --skill hermes-plugins-builder
npx skills add Ev3lynx727/plugins-builder --skill openclaw-hooks-builder
npx skills add Ev3lynx727/plugins-builder --skill kiro-hooks-builder
npx skills add Ev3lynx727/plugins-builder --skill claude-hooks-builder

# Or install all at once
npx skills add Ev3lynx727/plugins-builder --all
```

## Frameworks

| Framework | Plugin Type | Template Source | Target Path | Config |
|-----------|-------------|----------------|-------------|--------|
| **OpenCode** | TypeScript plugin | `templates/opencode/plugin.ts` | `~/.config/opencode/plugins/` | auto-discovered |
| **Hermes** | Python package | `templates/hermes/` | `~/.hermes/plugins/<name>/` | `config.yaml` plugins.enabled |
| **OpenClaw** | TypeScript hook | `templates/openclaw/` | `~/.openclaw/hooks/<name>/` | `openclaw.json` hooks.internal |
| **Kiro CLI** | Python script | `templates/kiro/pre_read_md.py` | `~/.kiro/hooks/` | `agent_config.json` hooks.preToolUse |
| **Claude Code** | TypeScript hook | `templates/claude/hook.ts` | `~/.claude/hooks/<name>/` | `settings.json` hooks.PreToolUse |

## Project Layout

```
plugins-builder/
├── CLAUDE.md                 # Project context for Claude Code
├── SKILL.md                  # Root skill (repo-level discovery)
├── README.md                 # This file
├── INSTALL.md                # Framework-specific install instructions
├── package.json              # Node metadata
├── scripts/
│   └── install.mjs           # Cascade: detect → copy → configure → done
├── skills/
│   ├── oc-plugins-builder/   # OpenCode TypeScript plugin skill
│   ├── hermes-plugins-builder/ # Hermes Python plugin skill
│   ├── openclaw-hooks-builder/ # OpenClaw TypeScript hook skill
│   ├── kiro-hooks-builder/   # Kiro CLI Python hook skill
│   └── claude-hooks-builder/ # Claude Code TypeScript hook skill
└── templates/
    ├── opencode/
    ├── hermes/
    ├── openclaw/
    ├── kiro/
    └── claude/
```

## Commit Rules

- Default branch: `main` (releases)
- Work branch: `develop` (all changes)
- Run `node scripts/install.mjs <fw> --dry-run` before tagging
- See [CLAUDE.md](CLAUDE.md) for full project context
