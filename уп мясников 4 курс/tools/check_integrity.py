"""Сверяет SHA-256 выбранных файлов с отдельным JSON-манифестом."""

import argparse
import hashlib
import json
from pathlib import Path


def sha256(path: Path) -> str:
    """Возвращает SHA-256 файла, читая его блоками."""
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    """Печатает OK / ИЗМЕНЁН / ОТСУТСТВУЕТ и возвращает код результата."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="Путь к JSON-манифесту")
    parser.add_argument("project", type=Path, help="Папка проверяемого проекта")
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    failed = False

    for relative_path, expected_hash in manifest.items():
        file_path = args.project / relative_path
        if not file_path.is_file():
            print(f"ОТСУТСТВУЕТ  {relative_path}")
            failed = True
        elif sha256(file_path) == expected_hash:
            print(f"OK           {relative_path}")
        else:
            print(f"ИЗМЕНЁН      {relative_path}")
            failed = True

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
