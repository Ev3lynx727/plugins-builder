---
name: oc-plugins-builder
description: Build and manage custom OpenCode plugins in .config/opencode/plugins/. Includes single and multi-tool patterns, templates, and loader schema.
---

# OpenCode Plugins Builder

Build and manage custom OpenCode plugins in `.config/opencode/plugins/`.

## Plugin Location

All custom plugins must be placed in:
```
.config/opencode/plugins/<plugin_name>.ts
```

## Plugin Structure

OpenCode plugins use `@opencode-ai/plugin`:

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Plugin description",
  args: {
    arg1: tool.schema.string().describe("Description"),
    arg2: tool.schema.boolean().default(false).describe("Description"),
  },
  async execute(args) {
    // Plugin logic
    return result
  },
})
```

## Available Schema Types

- `tool.schema.string()`
- `tool.schema.number()`
- `tool.schema.boolean()`
- `.optional()`
- `.default(value)`
- `.describe("description")`

## Creating a New Plugin

1. Create file: `.config/opencode/plugins/<name>.ts`
2. Import `tool` from `@opencode-ai/plugin`
3. Define args using `tool.schema`
4. Implement `execute` function
5. Export default tool

## Validation

After creating a plugin, validate it:

```bash
# Check plugins are loaded
opencode debug info

# Test plugin loads
opencode mcp list
```

## Multi-Tool Plugin Structure

For moderate-advanced plugins with multiple tools:

```
.config/opencode/plugins/
├── <plugin_name>/
│   ├── src/
│   │   ├── index.ts      # Main entry point
│   │   ├── tool_a.ts     # Individual tool
│   │   └── tool_b.ts     # Individual tool
│   └── package.json      # (optional) for external deps
└── <plugin_name>.ts      # Wrapper entry point
```

### Wrapper Entry Point (`<plugin_name>.ts`)
```typescript
import { myAdvancedPlugin } from "./<plugin_name>/src/index"

export default myAdvancedPlugin
```

### Main Index (`src/index.ts`)
```typescript
import { tool } from "@opencode-ai/plugin"
import { toolA } from "./tool_a"
import { toolB } from "./tool_b"

export const myAdvancedPlugin = tool({
  description: "Advanced plugin with multiple tools",
  args: {
    action: tool.schema.string().describe("Action: action1, action2"),
    text: tool.schema.string().describe("Text to process"),
  },
  async execute(args) {
    switch (args.action) {
      case "action1":
        return await toolA.execute(args)
      case "action2":
        return await toolB.execute(args)
      default:
        throw new Error(`Unknown action: ${args.action}`)
    }
  },
})

export { toolA, toolB }
```

### Individual Tool (`src/tool_a.ts`)
```typescript
import { tool } from "@opencode-ai/plugin"

export const toolA = tool({
  description: "Tool A description",
  args: {
    input: tool.schema.string().describe("Input description"),
  },
  async execute(args) {
    // Tool logic
    return result
  },
})
```

### External Dependencies

Add to `.config/opencode/plugins/package.json`:
```bash
cd ~/.config/opencode/plugins
npm install <package-name>
```

Then import in your tools:
```typescript
import { something } from "<package-name>"
```

## Plugin Examples

### Example 1: Simple File Reader

```typescript
import { tool } from "@opencode-ai/plugin"
import { readFile } from "fs/promises"

export default tool({
  description: "Read file contents",
  args: {
    path: tool.schema.string().describe("File path to read"),
  },
  async execute(args) {
    try {
      const content = await readFile(args.path, "utf-8")
      return content
    } catch (error) {
      throw new Error(`Failed to read file: ${error}`)
    }
  },
})
```

### Example 2: API Request

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Fetch data from URL",
  args: {
    url: tool.schema.string().describe("URL to fetch"),
    method: tool.schema.string().optional().default("GET").describe("HTTP method"),
  },
  async execute(args) {
    const response = await fetch(args.url, { method: args.method })
    return await response.text()
  },
})
```

### Example 3: Shell Command

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Run shell command",
  args: {
    command: tool.schema.string().describe("Command to run"),
    cwd: tool.schema.string().optional().describe("Working directory"),
  },
  async execute(args) {
    const { execSync } = await import("child_process")
    try {
      const result = execSync(args.command, {
        cwd: args.cwd,
        encoding: "utf-8",
        timeout: 30000,
      })
      return result
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number }
      throw new Error(`Command failed: ${err.message}`)
    }
  },
})
```

## Local Dependencies

Plugins can have their own dependencies. A `package.json` is provided:

```
.config/opencode/plugins/
├── package.json      # Local node_modules for plugins
├── node_modules/     # Installed dependencies
├── ripgrep.ts       # Your plugins here
├── markdownlint.ts
└── rtk.ts
```

To add dependencies:
```bash
cd ~/.config/opencode/plugins
npm install <package-name>
```

Then import in your plugin:
```typescript
import { something } from "<package-name>"
```

## Plugin Loader Schema

OpenCode auto-discovers plugins - no explicit config needed.

**How it works:**
1. Scans `.config/opencode/plugins/` for `*.ts` files
2. Auto-loads each as a plugin
3. Registers tools with OpenCode

**View loaded plugins:**
```bash
opencode debug config | jq '.plugin'
opencode debug config | jq '.plugin_origins'
```

**Output example:**
```json
{
  "plugin": [
    "file:///home/ev3lynx/.config/opencode/plugins/ripgrep.ts"
  ],
  "plugin_origins": [
    {
      "spec": "file:///home/ev3lynx/.config/opencode/plugins/ripgrep.ts",
      "source": "/home/ev3lynx/.config/opencode",
      "scope": "local"
    }
  ]
}
```

**Requirements:**
- File must be `.ts` in `.config/opencode/plugins/`
- Must export default tool
- Must use `@opencode-ai/plugin`

## Configuration

Plugins are auto-discovered from `.config/opencode/plugins/`. No config needed.

To verify plugins are loaded:
```bash
opencode debug info
```

Output shows:
```
plugins:
- file:///home/ev3lynx/.config/opencode/plugins/ripgrep.ts
- file:///home/ev3lynx/.config/opencode/plugins/markdownlint.ts
```

## Adding Plugins to Agents

To use a plugin in an agent, add it to the agent's tools in `opencode.jsonc`:

```json
{
  "agent": {
    "your-agent": {
      "tools": {
        "your_plugin_name": true
      }
    }
  }
}
```

## Troubleshooting

**Plugin not loading?**
1. Check file is in `.config/opencode/plugins/`
2. Verify file has `.ts` extension
3. Run `opencode debug info` to see loaded plugins
4. Check for syntax errors in the plugin file

**TypeScript errors?**
1. Ensure `@opencode-ai/plugin` is available
2. Check schema types are correct
3. Verify export is `export default tool({...})`

## Plugin vs MCP Comparison

See `docs/benchmark.md` for detailed comparison.

**Summary:**
- **Plugins**: Fast, simple, in-process (use this by default)
- **MCP**: For external services, process isolation

You can also use MCP patterns inside plugins for multi-tool behavior.

## Template: Multi-Tool Plugin

Use this template for moderate-advanced plugins:

**Structure:**
```
.config/opencode/plugins/<plugin_name>/
├── src/
│   ├── index.ts      # Main entry point
│   ├── tool_a.ts     # Individual tool
│   └── tool_b.ts     # Individual tool
└── <plugin_name>.ts  # Wrapper entry point
```

**Quick create:**
```bash
# 1. Create directory
mkdir -p ~/.config/opencode/plugins/<name>/src

# 2. Create wrapper: ~/.config/opencode/plugins/<name>.ts
# 3. Create src/index.ts with tool definitions
# 4. Create src/tool_*.ts for each tool
```

**External deps:** Add to `.config/opencode/plugins/package.json`

## Using npm-registry Tools

Instead of running npm CLI commands via bash, use the plugin tools for token savings:

| CLI Command | Use Tool Instead |
|------------|------------------|
| `npm search <query>` | `npm-registry_npmSearch` |
| `npm view <package>` | `npm-registry_npmPackageInfo` |
| `npm view <package> versions` | `npm-registry_npmPackageVersions` |
| `npm view <package> dist` | `npm-registry_npmPackageDownloads` |

**Example:**
- ❌ `bash` with `npm search jsonl --json`
- ✅ Use `npm-registry_npmSearch` tool directly

The `npm-redirect_npmRedirectPlugin` tool can check if a command should be redirected.

## Best Practices

1. **Descriptive names**: Use clear plugin names (e.g., `ripgrep.ts` not `tool1.ts`)
2. **Document args**: Always use `.describe()` for all arguments
3. **Error handling**: Wrap execution in try/catch
4. **Type safety**: Use proper TypeScript types
5. **Small scope**: Each plugin should do one thing well