"""Считает воспроизводимые базовые метрики JavaScript-файлов стандартной библиотекой."""

import json
import re
from pathlib import Path


BRANCH = re.compile(r"\b(?:if|for|while|case|catch)\b|&&|\|\||\?")
FUNCTION = re.compile(
    r"\bfunction\s*\*?\s*[A-Za-z_$][\w$]*\s*\(|"
    r"\b(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*(?:async\s*)?"
    r"(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>"
)
IMPORT = re.compile(r"\bfrom\s+['\"]\./[^'\"]+['\"]")


def analyze(source_file: Path) -> dict:
    """Возвращает число строк, функций, ветвлений, импортов и оценку CC модуля."""
    text = source_file.read_text(encoding="utf-8")
    lines = text.splitlines()
    code_lines = [
        line for line in lines
        if line.strip() and not line.lstrip().startswith("//")
    ]
    branch_count = len(BRANCH.findall(text))
    return {
        "file": source_file.name,
        "total_lines": len(lines),
        "code_lines": len(code_lines),
        "comment_lines": sum(line.lstrip().startswith("//") for line in lines),
        "functions": len(FUNCTION.findall(text)),
        "branches": branch_count,
        "module_cc_estimate": branch_count + 1,
        "imports": len(IMPORT.findall(text)),
    }


if __name__ == "__main__":
    project = Path(__file__).resolve().parents[1]
    sources = sorted((project / "js").glob("*.js")) + [project / "server.js"]
    print(json.dumps([analyze(path) for path in sources], ensure_ascii=False, indent=2))
