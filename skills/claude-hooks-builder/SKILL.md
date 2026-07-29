---
name: claude-hooks-builder
description: Build and manage Claude Code hooks in ~/.claude/hooks/. TypeScript modules with default export, registered via ~/.claude/settings.json hooks.PreToolUse or hooks.PostToolUse.
---

# Claude Code Hooks Builder

Build and manage Claude Code tool-call hooks.

## Hook Location

```
~/.claude/hooks/<name>.ts
```

Or organize by function:
```
~/.claude/hooks/
├── pre-read-md.ts
├── post-write-backup.ts
└── metrics/
    └── log-tool-use.ts
```

## Config Location

```
~/.claude/settings.json
→ hooks.PreToolUse[] or hooks.PostToolUse[]
```

## Hook Structure

TypeScript module with a **default async export function**:

```typescript
interface ToolCall {
  tool: string
  input: Record<string, unknown>
}

export default async function preToolUse(toolCall: ToolCall): Promise<ToolCall> {
  // Inspect and optionally mutate
  if (toolCall.tool !== "Read") return toolCall

  const filePath = toolCall.input?.file_path as string
  if (filePath?.endsWith(".md")) {
    return { ...toolCall, input: { ...toolCall.input, _hint: "markdown" } }
  }

  return toolCall
}
```

## Hook Types

| Hook | When Fires | Can Mutate | Common Use |
|------|------------|------------|------------|
| **PreToolUse** | Before every tool execution | Tool name + input args | Add context, validate paths, inject tokens |
| **PostToolUse** | After tool execution completes | Output before model sees it | Log results, strip secrets, format output |

## Config Schema

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Read",
        "hooks": [
          { "type": "file", "file": "~/.claude/hooks/pre-read-md.ts" }
        ]
      }
    ]
  }
}
```

- `matcher`: Tool name or `"*"` for all tools.
- `type: "file"`: Load and execute a TypeScript module.
- `type: "command"`: Run a shell command (receives tool call JSON via stdin).

## Writing To Disk

The installer patches `~/.claude/settings.json` automatically:

```bash
node scripts/install.mjs claude my-plugin
```

This:
1. Copies `templates/claude/hook.ts` → `~/.claude/hooks/my-plugin.ts`
2. Appends the hook entry to `~/.claude/settings.json`

## Validation

```bash
# Check hook syntax
node --check ~/.claude/hooks/my-plugin.ts

# Run installer dry-run
node scripts/install.mjs claude my-plugin --dry-run
```

## Environment

Claude Code hooks run in the same Node.js process as the harness. You have access to:
- `fs`, `path`, `child_process` (Node built-ins)
- Any npm packages installed globally (e.g., `tsx` for TypeScript execution)

## Limitations

- Hooks cannot *prevent* a tool call — they can only mutate arguments.
- No async imports during hook execution (use top-level static imports).
- Hook timeout: 5s default (configurable in harness settings).

## See Also

- [Claude Code hooks docs](https://docs.anthropic.com/en/docs/claude-code/hooks) (official)
- `skills/oc-plugins-builder/SKILL.md` — OpenCode equivalent
- `skills/openclaw-hooks-builder/SKILL.md` — OpenClaw equivalent
