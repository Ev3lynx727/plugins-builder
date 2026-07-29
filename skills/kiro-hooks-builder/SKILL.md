---
name: kiro-hooks-builder
description: Build and manage kiro-cli pre-tool hooks in ~/.kiro/hooks/. Python scripts configured via hooks.preToolUse in agent_config.json.
---

# Kiro Hooks Builder

Build and manage kiro-cli pre-tool hooks.

## Hook Location

```
~/.kiro/hooks/<name>.py
```

## Config Location

```
~/.kiro/agents/agent_config.json
→ hooks.preToolUse[]
```

## Hook Structure

kiro-cli hooks are standalone Python scripts referenced by path in `agent_config.json`:

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

## Python Script Pattern

```python
import sys, json, subprocess

def handle_tool(tool_name: str, input_data: dict) -> dict:
    if tool_name != "read":
        return input_data
    # hook logic here
    return input_data

if __name__ == "__main__":
    tool_name = sys.argv[1] if len(sys.argv) > 1 else ""
    input_data = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
    result = handle_tool(tool_name, input_data)
    print(json.dumps(result))
```

## Matcher Field

| Matcher | Behavior |
|---------|----------|
| `"read"` | Exact tool name match |
| `"*"` | Wildcard — matches all tools |
| `{"tool_name": "read"}` | Object matcher |

## Template Source

```
~/dev/plugins-builder/templates/kiro/pre_read_md.py
```

## Related Skills

- `oc-plugins-builder` — opencode TypeScript plugins
- `hermes-plugins-builder` — hermes Python plugin packages
- `openclaw-hooks-builder` — openclaw TypeScript hooks
