#!/bin/bash
# kiro-devctx-setup.sh — Setup .devctx/ integration for kiro-cli
#
# This script configures kiro-cli to automatically discover and load .devctx/
# from the workspace at agent startup.
#
# Usage: ./kiro-devctx-setup.sh [--force]

set -e

KIRO_DIR="$HOME/.kiro"
STEERING_DIR="$KIRO_DIR/steering"
CLI_CONFIG="$KIRO_DIR/settings/cli.json"
DISCOVER_SCRIPT="$STEERING_DIR/discover.py"
STEERING_CONFIG="$STEERING_CONFIG"
FORCE=false

if [[ "${1:-}" == "--force" ]]; then
    FORCE=true
fi

echo "kiro-devctx-setup: Configuring .devctx/ integration for kiro"

# Check if already configured
if [[ -f "$CLI_CONFIG" ]] && grep -q "pre_startup_hook" "$CLI_CONFIG" 2>/dev/null; then
    if [[ "$FORCE" != true ]]; then
        echo "  [SKIP] kiro-cli already configured with pre_startup_hook"
        echo "  Use --force to overwrite"
        exit 0
    fi
    echo "  [WARN] Overwriting existing configuration"
fi

# Create steering directory
mkdir -p "$STEERING_DIR"
echo "  [OK] Created $STEERING_DIR"

# Write discover.py
cat > "$DISCOVER_SCRIPT" << 'DISCOVER_EOF'
#!/usr/bin/env python3
"""
Steering hook: Discover and load .devctx/ config at agent startup.
Scans current working directory and parent dirs for .devctx/ and loads:
- .devctx/skills/ -> symlinks into ~/.kiro/skills/
- .devctx/workflows/ -> symlinks into ~/.kiro/workflows/
- .devctx/manifest.json -> applies runtime settings
"""

import os
import sys
import json
from pathlib import Path


def find_devctx(start_path: Path) -> Path | None:
    """Find .devctx/ in current dir or parent dirs."""
    current = start_path.resolve()
    while current != current.parent:
        devctx = current / ".devctx"
        if devctx.is_dir():
            return devctx
        current = current.parent
    return None


def load_manifest(devctx_path: Path) -> dict:
    """Load .devctx/manifest.json if exists."""
    manifest_path = devctx_path / "manifest.json"
    if manifest_path.exists():
        with open(manifest_path) as f:
            return json.load(f)
    return {}


def symlink_skills(devctx_path: Path, kiro_skills_dir: Path) -> list[str]:
    """Symlink skills from .devctx/skills/ to ~/.kiro/skills/."""
    src_skills_dir = devctx_path / "skills"
    if not src_skills_dir.exists():
        return []

    kiro_skills_dir.mkdir(parents=True, exist_ok=True)

    linked = []
    for skill_dir in src_skills_dir.iterdir():
        if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
            dest = kiro_skills_dir / skill_dir.name
            if not dest.exists():
                relative_source = os.path.relpath(skill_dir, kiro_skills_dir)
                os.symlink(relative_source, dest)
                print(f"  [devctx] Symlinked skill: {skill_dir.name}")
                linked.append(skill_dir.name)
            else:
                print(f"  [devctx] Skill already exists (skip): {skill_dir.name}")
    return linked


def symlink_workflows(devctx_path: Path, kiro_workflows_dir: Path) -> list[str]:
    """Symlink workflows from .devctx/workflows/ to ~/.kiro/workflows/."""
    src_workflows_dir = devctx_path / "workflows"
    if not src_workflows_dir.exists():
        return []

    kiro_workflows_dir.mkdir(parents=True, exist_ok=True)

    linked = []
    for wf_file in src_workflows_dir.iterdir():
        if wf_file.is_file() and wf_file.suffix in (".json", ".jsonl", ".yaml", ".yml"):
            dest = kiro_workflows_dir / wf_file.name
            if not dest.exists():
                relative_source = os.path.relpath(wf_file, kiro_workflows_dir)
                os.symlink(relative_source, dest)
                print(f"  [devctx] Symlinked workflow: {wf_file.name}")
                linked.append(wf_file.name)
            else:
                print(f"  [devctx] Workflow already exists (skip): {wf_file.name}")
    return linked


def main():
    """Main entry point for steering discovery."""
    cwd = Path(os.environ.get("PWD", os.getcwd()))
    devctx = find_devctx(cwd)

    if not devctx:
        print("[devctx] No .devctx/ found in current or parent directories")
        return 0

    print(f"[devctx] Found: {devctx}")

    # Load manifest
    manifest = load_manifest(devctx)
    if manifest:
        print("[devctx] Loaded manifest.json")
        if "settings" in manifest:
            print("[devctx] Applying runtime settings...")
            for key, value in manifest["settings"].items():
                print(f"  [devctx] {key} = {value}")

    # Symlink skills to kiro directory
    kiro_skills_dir = Path.home() / ".kiro" / "skills"
    skills = symlink_skills(devctx, kiro_skills_dir)
    if skills:
        print(f"[devctx] Skills symlinked: {len(skills)}")

    # Symlink workflows to kiro directory
    kiro_workflows_dir = Path.home() / ".kiro" / "workflows"
    workflows = symlink_workflows(devctx, kiro_workflows_dir)
    if workflows:
        print(f"[devctx] Workflows symlinked: {len(workflows)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
DISCOVER_EOF

chmod +x "$DISCOVER_SCRIPT"
echo "  [OK] Created $DISCOVER_SCRIPT"

# Write steering config
cat > "$STEERING_CONFIG" << 'CONFIG_EOF'
{
  "enabled": true,
  "priority": "high",
  "scan_parents": true,
  "auto_load": true,
  "on_startup": true,
  "on_session_load": true,
  "manifest_schema": "1.0.0",
  "skills_dir": "skills",
  "workflows_dir": "workflows",
  "settings_key": "settings"
}
CONFIG_EOF

echo "  [OK] Created $STEERING_CONFIG"

# Update CLI config
if [[ -f "$CLI_CONFIG" ]]; then
    cp "$CLI_CONFIG" "$CLI_CONFIG.bak"
    echo "  [OK] Backed up existing config to $CLI_CONFIG.bak"
fi

# Add pre_startup_hook to existing or new config
python3 << PYTHON_EOF
import json

config = {}
try:
    with open("$CLI_CONFIG") as f:
        config = json.load(f)
except FileNotFoundError:
    pass

config["pre_startup_hook"] = "$DISCOVER_SCRIPT"

with open("$CLI_CONFIG", "w") as f:
    json.dump(config, f, indent=2)
PYTHON_EOF

echo "  [OK] Updated $CLI_CONFIG with pre_startup_hook"
echo ""
echo "kiro-devctx-setup: Setup complete!"
echo "Restart kiro-cli to activate .devctx/ discovery"
