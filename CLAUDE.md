# CLAUDE.md — plugins-builder

## Project Overview

Cross-framework plugin scaffold generator for agent toolkits. Supports 5 frameworks:
OpenCode (TS), Hermes (Python), OpenClaw (TS hooks), Kiro (Python hooks), **Claude Code (settings.json hooks)**.

## Architecture

```
scripts/install.mjs      ← CLI entry: detect → copy → patch
skills/*/SKILL.md        ← skills.sh installable skill docs
templates/<framework>/   ← copy source for scaffolded plugins
```

## Key Patterns

- **Templates** are framework-native code; no abstraction layer.
- **Installer** copies templates + prints (or patches) config snippets.
- **Plugin name** parameterized; default `md-analyzer` can be overridden.
- **Dry-run mode** (`-n`) previews without file system changes.

## Adding a Framework

1. Create `templates/<name>/` with working sample code.
2. Add entry to `TEMPLATES{}` in `install.mjs` with `src`, `dest`, `config`.
3. Add `skills/<name>-plugins-builder/SKILL.md` for skills.sh.
4. Update README.md framework table.
5. Update `package.json` keywords.

## Commit Rules

- Never commit on `main` — branch policy is `main` as release, `develop` for work.
- Run `node scripts/install.mjs <framework> --dry-run` before tagging.

## Quick Commands

```bash
# Test all frameworks dry-run
for f in opencode hermes openclaw kiro claude; do
  node scripts/install.mjs $f --dry-run
done

# Validate a template syntax
node --check templates/opencode/plugin.ts
python3 -m py_compile templates/hermes/__init__.py
```
