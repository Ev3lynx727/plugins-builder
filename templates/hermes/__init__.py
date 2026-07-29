import subprocess
import json
import os
from pathlib import Path


def get_config() -> dict:
    return {
        "binary": os.getenv("MD_ANALYZER_PATH", "md-analyzer"),
        "max_tokens": int(os.getenv("MD_ANALYZER_MAX_TOKENS", "5000")),
        "whitelist": set(os.getenv("MD_ANALYZER_WHITELIST", "").split(",")) - {""},
        "exclude": [p for p in os.getenv("MD_ANALYZER_EXCLUDE", "").split(",") if p],
    }


def should_process(file_path: str, config: dict) -> bool:
    path = Path(file_path)
    if not path.suffix in {".md", ".txt"}:
        return False
    for prefix in config["exclude"]:
        if prefix in file_path:
            return False
    return True


def get_keypoints(file_path: str, binary: str) -> str | None:
    try:
        result = subprocess.run(
            [binary, str(file_path), "--keypoints", "--json"],
            capture_output=True, text=True, timeout=5,
        )
        if result.returncode != 0:
            return None
        docs = json.loads(result.stdout)
        if not docs:
            return None
        doc = docs[0]
        lines = [f"── md-analyzer: {file_path} ──"]
        lines.append(f"  {doc['summary']['totalTokens']} tokens  ·  {doc['summary']['wordCount']} words  ·  {doc.get('readingTime', '?')}")
        lines.append(f"  {doc['summary']['totalHeadings']} headings  ·  {doc['summary']['totalLinks']} links")
        for h in doc.get("keyHeadings", []):
            lines.append(f"  {'#' * h['level']} {h['text']}  L<{h['line']}> ~{h.get('tokens', '?')}t")
        return "\n".join(lines)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
        return None


def before_tool_call(tool: str, input_data: dict) -> dict:
    if tool != "read":
        return input_data
    file_path = input_data.get("path", "")
    config = get_config()
    if not should_process(file_path, config):
        return input_data
    outline = get_keypoints(file_path, config["binary"])
    if outline is None:
        return input_data
    filename = Path(file_path).name
    if filename in config["whitelist"]:
        input_data["content"] = outline
    else:
        original = input_data.get("content", "")
        input_data["content"] = outline + "\n\n── file content ──\n\n" + original
    return input_data
