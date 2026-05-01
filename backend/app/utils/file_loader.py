import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def load_json_file(file_name: str) -> Any:
    file_path = DATA_DIR / file_name

    if not file_path.exists():
        raise FileNotFoundError(f"Data file not found: {file_name}")

    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)