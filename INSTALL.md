# Install Cascade

Three-tier installation: use whatever fits your workflow.

## Tier 1: skills.sh (Discovery)

```bash
# Discover what's available
npx skills add Ev3lynx727/plugins-builder --list

# Install a specific skill
npx skills add Ev3lynx727/plugins-builder --skill oc-plugins-builder

# Install all skills
npx skills add Ev3lynx727/plugins-builder --all
```

Installed skills land in `.agents/skills/` or `~/.agents/skills/`.

## Tier 2: Direct API (Install)

```bash
# Auto-detect framework from config files
node scripts/install.mjs

# Explicit framework
node scripts/install.mjs opencode
node scripts/install.mjs hermes
node scripts/install.mjs openclaw
node scripts/install.mjs kiro

# Custom plugin name
node scripts/install.mjs opencode my-custom-plugin
```

Copies templates to framework-specific paths.

## Tier 3: Manual (Templates)

```bash
# Copy a template by hand
cp -r templates/opencode/ ~/.config/opencode/plugins/my-plugin.ts
```

## Framework-Specific Config

### OpenCode
```bash
# Plugins are auto-discovered. Verify:
opencode debug config | jq '.plugin'
```

### Hermes
```yaml
# ~/.hermes/config.yaml
plugins:
  enabled:
    - md-analyzer
```

### OpenClaw
```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "md-analyzer": { "enabled": true }
      }
    }
  }
}
```

### Kiro CLI
```json
{
  "hooks": {
    "preToolUse": [
      {
        "matcher": "read",
        "command": "uv run python ~/.kiro/hooks/pre_read_md.py",
        "timeout_ms": 3000
      }
    ]
  }
}
```
