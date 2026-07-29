---
name: openclaw-hooks-builder
description: Build and manage OpenClaw tool-call hooks in ~/.openclaw/hooks/. TypeScript handler.ts with default export, registered via openclaw.json hooks.internal.entries.
---

# OpenClaw Hooks Builder

Build and manage OpenClaw before-tool-call hooks.

## Hook Location

```
~/.openclaw/hooks/<name>/
├── handler.ts    # default export async (tool, input) => input
└── package.json  # optional, "type": "module"
```

## Config Location

```
~/.openclaw/openclaw.json
→ hooks.internal.entries
```

## Hook Structure

TypeScript module with a default async function:

```typescript
const handler = async (tool: string, input: any) => {
  // Intercept tool calls before execution
  if (tool !== "read") return input
  // modify input or inject context
  return input
}

export default handler
```

## Registration

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "md-analyzer": {
          "enabled": true
        }
      }
    }
  }
}
```

## Known Hooks

| Hook | Purpose |
|------|---------|
| `rtk-rewrite` | Rewrites bash/shell commands through RTK |
| `shared-sync` | Sync shared workspace state |
| `workspace-onboard` | First-run workspace setup |

## Notes

- OpenClaw uses `hooks/`, not `plugins/` or `extensions/`
- `plugins/` is for npm package tracking, not tool hooks
- `extensions/` is unused
- Hooks execute in order of registration

## Template Source

```
~/dev/plugins-builder/templates/openclaw/handler.ts
```

## Related Skills

- `oc-plugins-builder` — opencode TypeScript plugins
- `hermes-plugins-builder` — hermes Python plugin packages
- `kiro-hooks-builder` — kiro-cli Python hooks
