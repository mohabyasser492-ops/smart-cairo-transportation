from pathlib import Path
from typing import Tuple

import pandas as pd


DAY_OF_WEEK_MAP = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

WEATHER_MAP = {
    "clear": 0,
    "cloudy": 1,
    "rain": 2,
    "storm": 3,
    "fog": 4,
}


def prepare_training_dataframe(csv_path: str | Path) -> Tuple[pd.DataFrame, pd.Series]:
    csv_path = Path(csv_path)

    if not csv_path.exists():
        raise FileNotFoundError(f"Training data file not found: {csv_path}")

    df = pd.read_csv(csv_path)

    df = _normalize_columns(df)
    df = _validate_required_columns(df)
    df = _clean_dataframe(df)

    feature_columns = [
        "hour",
        "day_of_week_encoded",
        "weather_encoded",
        "is_holiday",
        "road_capacity",
        "road_length_km",
        "historical_flow",
    ]

    target_column = "avg_speed_kmh"

    x = df[feature_columns]
    y = df[target_column]

    return x, y


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    column_aliases = {
        "road_capacity": ["road_capacity", "capacity", "capacity_vehicles_per_hour"],
        "road_length_km": ["road_length_km", "distance_km", "length_km", "distance"],
        "historical_flow": ["historical_flow", "flow", "vehicles_per_hour", "traffic_volume"],
        "avg_speed_kmh": ["avg_speed_kmh", "speed_kmh", "average_speed_kmh"],
        "day_of_week": ["day_of_week", "weekday"],
        "weather": ["weather", "weather_condition"],
        "is_holiday": ["is_holiday", "holiday"],
        "hour": ["hour"],
        "road_id": ["road_id", "id"],
    }

    renamed_columns = {}

    for canonical_name, aliases in column_aliases.items():
        for alias in aliases:
            if alias in df.columns:
                renamed_columns[alias] = canonical_name
                break

    df = df.rename(columns=renamed_columns)
    return df


def _validate_required_columns(df: pd.DataFrame) -> pd.DataFrame:
    required_columns = [
        "hour",
        "day_of_week",
        "weather",
        "is_holiday",
        "road_capacity",
        "road_length_km",
        "historical_flow",
        "avg_speed_kmh",
    ]

    missing_columns = [column for column in required_columns if column not in df.columns]

    if missing_columns:
        raise ValueError(
            "Training data is missing required columns: "
            + ", ".join(missing_columns)
        )

    return df


def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    df["day_of_week"] = (
        df["day_of_week"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    df["weather"] = (
        df["weather"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    df["is_holiday"] = df["is_holiday"].apply(_to_int_bool)
    df["hour"] = pd.to_numeric(df["hour"], errors="coerce")
    df["road_capacity"] = pd.to_numeric(df["road_capacity"], errors="coerce")
    df["road_length_km"] = pd.to_numeric(df["road_length_km"], errors="coerce")
    df["historical_flow"] = pd.to_numeric(df["historical_flow"], errors="coerce")
    df["avg_speed_kmh"] = pd.to_numeric(df["avg_speed_kmh"], errors="coerce")

    df["day_of_week_encoded"] = df["day_of_week"].map(DAY_OF_WEEK_MAP)
    df["weather_encoded"] = df["weather"].map(WEATHER_MAP)

    df = df.dropna(
        subset=[
            "hour",
            "day_of_week_encoded",
            "weather_encoded",
            "is_holiday",
            "road_capacity",
            "road_length_km",
            "historical_flow",
            "avg_speed_kmh",
        ]
    )

    df["hour"] = df["hour"].astype(int)
    df["is_holiday"] = df["is_holiday"].astype(int)

    return df


def _to_int_bool(value) -> int:
    if isinstance(value, bool):
        return int(value)

    value_str = str(value).strip().lower()

    if value_str in {"1", "true", "yes"}:
        return 1

    return 0
