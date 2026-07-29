---
name: plugins-builder
description: Cross-framework plugin installer for OpenCode (TypeScript), Hermes (Python), OpenClaw (TypeScript hooks), and Kiro CLI (Python hooks). One-shot template copy + config print.
metadata:
  internal: false
---

# Plugins Builder

Cross-framework plugin installer. Run once to scaffold a working plugin for your agent framework.

## Quick Install

```bash
# Install via skills.sh
npx skills add Ev3lynx727/plugins-builder

# Then install a specific framework skill
npx skills add Ev3lynx727/plugins-builder --skill oc-plugins-builder
```

## Direct Usage

```bash
# Clone and run
git clone https://github.com/Ev3lynx727/plugins-builder
cd plugins-builder
node scripts/install.mjs          # auto-detect framework
node scripts/install.mjs opencode # explicit framework
```

## Cascade

1. **API** — `scripts/install.mjs` detects framework → copies templates → prints config
2. **DOCS** — This repo documents the plugin architecture per framework
3. **SKILLS.SH** — Each `skills/*/SKILL.md` is independently installable

## Frameworks

| Framework | Plugin Type | Install Path | Config File |
|-----------|-------------|--------------|-------------|
| OpenCode | TypeScript plugin | `.config/opencode/plugins/<name>.ts` | auto-discovered |
| Hermes | Python package | `.hermes/plugins/<name>/plugin.yaml + __init__.py` | `config.yaml plugins.enabled[]` |
| OpenClaw | TypeScript hook | `.openclaw/hooks/<name>/handler.ts` | `openclaw.json hooks.internal.entries` |
| Kiro CLI | Python script | `.kiro/hooks/<name>.py` | `agent_config.json hooks.preToolUse[]` |
