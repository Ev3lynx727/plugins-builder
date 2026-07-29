# kiro-devctx-setup — Setup .devctx/ Integration for Kiro

## Overview

This template creates the setup script for integrating kiro-cli with the `.devctx/` cross-agent configuration system.

## Files Created

| File | Purpose |
|------|---------|
| `~/.kiro/steering/discover.py` | Scans for `.devctx/` and symlinks skills/workflows |
| `~/.kiro/steering/config.json` | Steering behavior settings |
| `~/.kiro/settings/cli.json` | Updated with `pre_startup_hook` |

## Usage

```bash
# Copy and run the setup script
cp /home/ev3lynx/dev/plugins-builder/templates/kiro/kiro-devctx-setup.sh ~/dev/
cd ~/dev
bash kiro-devctx-setup.sh

# Or force overwrite
bash kiro-devctx-setup.sh --force
```

## How It Works

1. Creates `~/.kiro/steering/` directory
2. Writes `discover.py` — scans `.devctx/` at startup
3. Writes `config.json` — steering configuration
4. Updates `cli.json` with `pre_startup_hook`
5. Symlinks skills from `.devctx/skills/` to `~/.kiro/skills/`

## Expected Output

```
[kiro-wrapper] Running pre_startup_hook: /home/ev3lynx/.kiro/steering/discover.py
[devctx] Found: /home/ev3lynx/dev/.devctx
[devctx] Loaded manifest.json
[devctx] Applying runtime settings...
  [devctx] default_branch = develop
[devctx] Symlinked skill: kiro-setup-devctx
[devctx] Skills symlinked: 1
```

## Troubleshooting

- **Hook not running**: Check `pre_startup_hook` path in `cli.json`
- **Permission denied**: Run `chmod +x discover.py`
- **Symlink broken**: Ensure `.devctx/skills/` exists with `SKILL.md`
