import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / 'data'

def load_json(filename: str):
    with open(DATA_DIR / filename, 'r', encoding='utf-8') as file:
        return json.load(file)
