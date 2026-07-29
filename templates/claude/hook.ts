/**
 * Claude Code PreToolUse Hook
 *
 * Intercepts `Bash(read|cat|find|grep)` and `Read(file)` tool calls
 * to inject structured context or modify arguments before execution.
 *
 * Install: copy this file to ~/.claude/hooks/pre-read-md.ts
 * Register in ~/.claude/settings.json:
 *   {
 *     "hooks": {
 *       "PreToolUse": [
 *         { "matcher": "Read", "hooks": [{ "type": "file", "file": "~/.claude/hooks/pre-read-md.ts" }] }
 *       ]
 *     }
 *   }
 */

interface ToolCall {
  tool: string
  input: Record<string, unknown>
}

// Whitelist of docs worth preprocessing
const WHITELIST_NAMES = [
  "AGENTS.md", "README.md", "CONTRIBUTING.md", "CHANGELOG.md",
  "ARCHITECTURE.md", "ROADMAP.md", "DESIGN.md", "OVERVIEW.md",
  "SKILL.md", "SKILLS.md", "STEERING.md",
  "SPEC.md", "TODO.md", "NOTES.md", "DECISIONS.md",
  "ADR.md", "HACKING.md", "DEVELOPMENT.md", "SETUP.md", "INSTALL.md",
];

const WHITELIST_PATHS = [
  "docs/", "documentation/", ".claude/", "steering/", "skills/",
];

function shouldProcess(filePath: string): boolean {
  const name = filePath.split("/").pop() || "";
  if (WHITELIST_NAMES.includes(name)) return true;
  return WHITELIST_PATHS.some((p) => filePath.includes(p));
}

// Simple heuristic: if reading a whitelisted .md, inject a header note
function enrichReadFile(filePath: string, originalInput: Record<string, unknown>): Record<string, unknown> {
  if (!filePath.endsWith(".md") && !filePath.endsWith(".txt")) {
    return originalInput;
  }

  if (!shouldProcess(filePath)) {
    return originalInput;
  }

  // In a real hook, you might call out to md-analyzer or parse headings here.
  // For the scaffold: just inject a hint that this file is "document class".
  return {
    ...originalInput,
    _pluginHint: "document",
    _pluginSource: "{{pluginName}}",
  };
}

// Hook entry point — called by Claude Code harness before every tool use
export default async function preToolUse(toolCall: ToolCall): Promise<ToolCall> {
  if (toolCall.tool !== "Read") {
    return toolCall;
  }

  const filePath = toolCall.input?.file_path as string;
  if (!filePath || typeof filePath !== "string") {
    return toolCall;
  }

  const enrichedInput = enrichReadFile(filePath, toolCall.input);

  return {
    tool: toolCall.tool,
    input: enrichedInput,
  };
}
