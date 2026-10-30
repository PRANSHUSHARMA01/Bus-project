"""
Smart Public Bus Tracking & Fleet Management System
Supervised Demand Forecasting Model Training Pipeline
Pure Python Implementation with Ridge L2 Regularization & Evaluation
Location: Delhi, India
"""

import os
import csv
import json
import math

def solve_linear_system(A, b):
    """Solve A * x = b using Gaussian elimination with partial pivoting."""
    n = len(b)
    # Augmented matrix [A | b]
    M = [A[i][:] + [b[i]] for i in range(n)]

    for i in range(n):
        # Pivot
        max_row = i
        for k in range(i + 1, n):
            if abs(M[k][i]) > abs(M[max_row][i]):
                max_row = k
        M[i], M[max_row] = M[max_row], M[i]

        pivot = M[i][i]
        if abs(pivot) < 1e-12:
            pivot = 1e-12

        # Eliminate below
        for k in range(i + 1, n):
            factor = M[k][i] / pivot
            for j in range(i, n + 1):
                M[k][j] -= factor * M[i][j]

    # Back substitution
    x = [0.0] * n
    for i in range(n - 1, -1, -1):
        s = sum(M[i][j] * x[j] for j in range(i + 1, n))
        x[i] = (M[i][n] - s) / M[i][i]

    return x

def train_demand_forecast_model():
    print("=" * 72)
    print("  TRAINING SUPERVISED TRANSIT DEMAND FORECAST MODEL")
    print("=" * 72)

    csv_path = "data/ridership_history.csv"
    model_json_path = "data/forecast_model.json"

    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset {csv_path} not found! Run generate_history.py first.")

    features = []
    targets = []

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            h = float(row["hour"])
            dow = float(row["day_of_week"])
            is_wknd = float(row["is_weekend"])
            r = row["route"]
            r_A = 1.0 if r == "A" else 0.0
            r_B = 1.0 if r == "B" else 0.0
            r_C = 1.0 if r == "C" else 0.0

            # Bias term + features
            x_vec = [1.0, h, dow, is_wknd, r_A, r_B, r_C]
            y_val = float(row["boarded_passengers"])

            features.append(x_vec)
            targets.append(y_val)

    n_samples = len(targets)
    n_features = len(features[0])
    print(f"-> Successfully loaded {n_samples} records from {csv_path}.")

    # Split 80/20 train/test
    split_idx = int(0.8 * n_samples)
    X_train = features[:split_idx]
    y_train = targets[:split_idx]
    X_test = features[split_idx:]
    y_test = targets[split_idx:]

    print(f"-> Training Set: {len(X_train)} samples | Testing Set: {len(X_test)} samples.")

    # Compute X^T * X and X^T * y with Ridge regularization (lambda = 1.0)
    # XtX is (n_features x n_features)
    XtX = [[0.0] * n_features for _ in range(n_features)]
    Xty = [0.0] * n_features

    for x_vec, y_val in zip(X_train, y_train):
        for i in range(n_features):
            Xty[i] += x_vec[i] * y_val
            for j in range(n_features):
                XtX[i][j] += x_vec[i] * x_vec[j]

    # Add L2 penalty to non-bias weights
    alpha = 1.0
    for i in range(1, n_features):
        XtX[i][i] += alpha

    weights = solve_linear_system(XtX, Xty)

    # Evaluate on test set
    preds = []
    abs_errors = []
    sq_errors = []
    mean_y = sum(y_test) / len(y_test)
    ss_tot = sum((y - mean_y) ** 2 for y in y_test)

    for x_vec, y_val in zip(X_test, y_test):
        pred = sum(w * x for w, x in zip(weights, x_vec))
        preds.append(pred)
        abs_errors.append(abs(y_val - pred))
        sq_errors.append((y_val - pred) ** 2)

    mae = sum(abs_errors) / len(abs_errors)
    mse = sum(sq_errors) / len(sq_errors)
    rmse = math.sqrt(mse)
    ss_res = sum(sq_errors)
    r2 = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 1.0

    print("\nModel Performance Evaluation:")
    print(f"-> Mean Absolute Error (MAE):     {mae:.2f} passengers/hour")
    print(f"-> Root Mean Squared Error (RMSE): {rmse:.2f} passengers/hour")
    print(f"-> Coefficient of Determination (R²): {r2:.4f} ({r2*100:.1f}% variance explained)")

    feature_names = ["intercept", "hour", "day_of_week", "is_weekend", "route_A", "route_B", "route_C"]
    print("\nLearned Model Coefficients:")
    for name, w in zip(feature_names, weights):
        print(f"   {name:15s}: {w:+8.3f}")

    # Save to JSON
    model_payload = {
        "model_type": "RidgeLinearRegression",
        "feature_names": feature_names,
        "weights": weights,
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4)
        }
    }

    with open(model_json_path, "w", encoding="utf-8") as f:
        json.dump(model_payload, f, indent=2)

    print(f"\n-> Successfully serialized model artifact to: {model_json_path}")

    # Sanity check: Route A at 9 AM Monday
    sample_x = [1.0, 9.0, 0.0, 0.0, 1.0, 0.0, 0.0]
    sample_pred = sum(w * x for w, x in zip(weights, sample_x))
    print(f"\nSanity Check Prediction:")
    print(f"   Input: Route A, Monday, 09:00 AM (Peak Rush)")
    print(f"   Predicted Boarding Demand: {int(round(sample_pred))} passengers/hour")
    print("=" * 72)

if __name__ == "__main__":
    train_demand_forecast_model()
