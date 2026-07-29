# Changelog

## [0.2.0] — 2026-07-29

### Added
- **Claude Code** as 5th framework — `templates/claude/` with PreToolUse hook template
- `install.mjs list <framework>` — list installed plugins
- `install.mjs uninstall <framework> <name>` — remove plugin + clean config
- Real JSON config patching for Claude Code — `settings.json` hooks.PreToolUse auto-updated
- Parameterized plugin name — any name, not just `md-analyzer`
- `CLAUDE.md` — project context for Claude Code sessions
- `.gitignore` — ignores node_modules, logs, IDE files

### Changed
- Refactored `install.mjs`:
  - Template var substitution (`{{pluginName}}`) replaces hardcoded names
  - `deepMerge` for safe JSON patching
  - Better error handling and `--force` flag on existing dirs
- Updated `package.json` v0.1.0 → v0.2.0 with `claude` keyword + `test:dry-run` script

## [0.1.0] — 2026-03-??

### Added
- Initial release supporting OpenCode, Hermes, OpenClaw, Kiro CLI
- `scripts/install.mjs` with detect → copy → print-config cascade
- Template scaffold for each framework
- `skills.sh.json` integration
