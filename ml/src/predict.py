from pathlib import Path

import joblib
import pandas as pd 

DAY_OF_WEEK_MAP = {
    "sunday": 6,
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    
}


WEATHER_MAP = {
    "clear": 0,
    "cloudy": 1,
    "rain": 2,
    "storm": 3,
    "fog": 4,
}


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "traffic_model.pkl"


def predict_speed_kmh(
    hour: int,
    day_of_week: str,
    weather: str,
    is_holiday: bool,
    road_capacity: float,
    road_length_km: float,
    historical_flow: float,
) -> float:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    model_bundle = joblib.load(MODEL_PATH)
    model = model_bundle["model"]
    feature_names = model_bundle["feature_names"]

    row = {
        "hour": int(hour),
        "day_of_week_encoded": DAY_OF_WEEK_MAP[str(day_of_week).strip().lower()],
        "weather_encoded": WEATHER_MAP[str(weather).strip().lower()],
        "is_holiday": int(bool(is_holiday)),
        "road_capacity": float(road_capacity),
        "road_length_km": float(road_length_km),
        "historical_flow": float(historical_flow),
    }

    input_df = pd.DataFrame([row])[feature_names]
    prediction = model.predict(input_df)[0]

    return round(float(prediction), 2)



