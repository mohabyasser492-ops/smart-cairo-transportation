import json
from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

from prepare_dataset import prepare_training_dataframe


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "training_data.csv"
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "traffic_model.pkl"
METRICS_PATH = MODELS_DIR / "model_metrics.json"


def main():
    x, y = prepare_training_dataframe(DATA_PATH)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=42,
    )

    model = RandomForestRegressor(
        n_estimators=200,
        random_state=42,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
    )

    model.fit(x_train, y_train)

    predictions = model.predict(x_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions) ** 0.5
    r2 = r2_score(y_test, predictions)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model_bundle = {
        "model": model,
        "feature_names": list(x.columns),
        "target_name": "avg_speed_kmh",
    }

    joblib.dump(model_bundle, MODEL_PATH)

    metrics = {
        "model_type": "RandomForestRegressor",
        "training_rows": len(x),
        "feature_count": len(x.columns),
        "feature_names": list(x.columns),
        "mae": round(float(mae), 4),
        "rmse": round(float(rmse), 4),
        "r2_score": round(float(r2), 4),
    }

    with METRICS_PATH.open("w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=2)

    print("Model trained successfully")
    print(f"Model saved to: {MODEL_PATH}")
    print(f"Metrics saved to: {METRICS_PATH}")
    print(metrics)


if __name__ == "__main__":
    main()