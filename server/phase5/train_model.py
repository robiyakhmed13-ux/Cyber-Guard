import csv
import json
import pickle
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction import DictVectorizer
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "data" / "training_dataset.csv"
ARTIFACTS_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "risk_model.pkl"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"


def _coerce_row(row):
    return {
        "threat_type": row["threat_type"],
        "severity": row["severity"],
        "source_ip": row["source_ip"],
        "target_asset": row["target_asset"],
        "ioc_type": row["ioc_type"],
        "ioc_source": row["ioc_source"],
        "status": row["status"],
        "description_length": int(row["description_length"]),
        "related_iocs": int(row["related_iocs"]),
        "open_ports": int(row["open_ports"]),
    }


def load_dataset():
    with DATASET_PATH.open("r", encoding="utf-8", newline="") as handle:
      reader = csv.DictReader(handle)
      rows = list(reader)

    features = [_coerce_row(row) for row in rows]
    labels = [row["risk_level"] for row in rows]
    return features, labels


def train_and_save_model():
    X, y = load_dataset()
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    model = Pipeline(
        [
            ("vectorizer", DictVectorizer(sparse=False)),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=160,
                    random_state=42,
                    class_weight="balanced",
                ),
            ),
        ]
    )
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    with MODEL_PATH.open("wb") as handle:
        pickle.dump(model, handle)

    classes = list(model.named_steps["classifier"].classes_)
    metadata = {
        "dataset_path": str(DATASET_PATH),
        "model_path": str(MODEL_PATH),
        "samples": len(X),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "classes": classes,
        "accuracy": accuracy_score(y_test, predictions),
        "classification_report": classification_report(
            y_test,
            predictions,
            output_dict=True,
            zero_division=0,
        ),
        "example_probability_vector": dict(zip(classes, probabilities[0].tolist())),
        "feature_fields": list(X[0].keys()),
    }

    with METADATA_PATH.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)

    return metadata


def ensure_model():
    if MODEL_PATH.exists() and METADATA_PATH.exists():
        return
    train_and_save_model()


if __name__ == "__main__":
    info = train_and_save_model()
    print(json.dumps(info, indent=2))
