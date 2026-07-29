---
name: hermes-plugins-builder
description: Investigate and understand the Hermes Agent plugins mechanism, including bundled vs user plugins, plugin loading patterns, and the critical distinction between Plugins and Skills.
---

# Hermes Plugins Mechanism

Use this skill to investigate Hermes plugin architecture, troubleshoot plugin loading, or understand bundled vs user plugins.

## Plugin Types

| Type | Location | Purpose | Config Key |
|------|----------|---------|------------|
| **Bundled** | `~/.hermes/hermes-agent/plugins/` | Shipped memory/context backends | `memory.provider`, `context.engine` |
| **User** | `~/.hermes/plugins/` | Custom installed backends | Same as above |
| **Skills** | `~/.hermes/skills/` | User-facing capabilities | `skills.external_dirs` |

**Plugins** = Python import-based backends (memory providers, context engines).
**Skills** = Injected instructions loaded from SKILL.md files.

## Plugin Structure

```
~/.hermes/plugins/<name>/
├── __init__.py          # Entry point: register() or MemoryProvider subclass
├── plugin.yaml          # Manifest: name, version, deps, hooks
└── version.py           # __version__ + __plugin_name__ (optional)
```

## Key Requirements

- **plugin.yaml** `name` field must match the directory name exactly
- **__init__.py** is the entry point (not `plugin.py`)
- Directory names must use underscores (PEP 8) — hyphens cause `ModuleNotFoundError`
- `logger` must be defined BEFORE any try/except block that uses it
- Do NOT use `load_dotenv()` — Hermes auto-loads `~/.hermes/.env` at startup
- User plugins go in `~/.hermes/plugins/`, NOT in workspace copies

## Plugin Loading

Hermes uses `importlib.util.spec_from_file_location()`:
1. Scans bundled plugins first (`hermes-agent/plugins/`), then user plugins
2. Bundled plugins take precedence on name collisions
3. Modules registered as `plugins.memory.<name>` (bundled) or `_hermes_user_memory.<name>` (user)

## Registration Patterns

```python
# Pattern A: register() function
def register(ctx):
    ctx.register_memory_provider(MyProvider())

# Pattern B: MemoryProvider subclass
from agent.memory_provider import MemoryProvider

class MyProvider(MemoryProvider):
    def is_available(self) -> bool: ...
    def store(self, content: str) -> None: ...

# Required base class method
def handle_tool_call(self, tool_name: str, **kwargs) -> Any:
    # Route tool calls. This IS called by Hermes dispatch.
    # call_tool() is legacy and NEVER invoked.
```

## Sync Workflow

1. Workspace copies (`~/.openclaw/workspace-*/agents/hermes/plugins/`) are development source of truth
2. Live copies (`~/.hermes/plugins/`) are what Hermes actually loads
3. Sync: `rsync -av <workspace>/ <live>/ --delete`
4. After sync or code changes: `touch ~/.hermes/plugins/<name>/__init__.py` (forces .pyc recompile)
5. Restart Hermes to pick up changes (`kill <pid>` → `hermes chat`)

## Logfire Notes

- Wrap `logfire.configure()` in try/except for graceful fallback
- Invalid token or network issues should not crash the plugin
- Logfire config lives in `~/.logfire/default.toml`, not config.yaml

## Redis-Specific Pitfalls

- `decode_responses=True` causes `module_list()` to return string keys (not bytes)
- Compare with `m.get('name')` not `m[b'name']`
- Use `datetime.now(timezone.utc)` not `datetime.now()` (naive local time)
