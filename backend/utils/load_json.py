"""Utility helpers for working with Bowtie JSON files."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import json


def load_bowtie(path: Path | str) -> Dict[str, Any]:
    """Load a Bowtie diagram JSON file.

    Parameters
    ----------
    path:
        Path to the JSON file on disk.

    Returns
    -------
    Dict[str, Any]
        Parsed JSON structure.

    Raises
    ------
    FileNotFoundError
        If the file cannot be located.
    json.JSONDecodeError
        If the file is not valid JSON.
    """

    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Bowtie JSON not found: {file_path}")

    with file_path.open("r", encoding="utf-8") as fp:
        return json.load(fp)


def save_bowtie(data: Dict[str, Any], path: Path | str) -> Path:
    """Persist a Bowtie diagram JSON file."""
    file_path = Path(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)

    with file_path.open("w", encoding="utf-8") as fp:
        json.dump(data, fp, indent=2)

    return file_path


