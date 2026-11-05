# -*- coding: utf-8 -*-
"""
CLI Inference Script - Loads Pre-trained LightGBM/HistGradientBoosting Model (.pkl)
and runs live inference on sample_retail_dataset.csv.
"""

import os
import sys
import json
import pickle
import csv
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PKL_PATH = os.path.join(BASE_DIR, "pretrained_lgbm_model.pkl")
DATASET_CSV_PATH = os.path.join(BASE_DIR, "sample_retail_dataset.csv")


def run_benchmark_test(limit=12):
    with open(MODEL_PKL_PATH, "rb") as f:
        bundle = pickle.load(f)

    model = bundle["model"]
    feature_cols = bundle["feature_cols"]
    metrics = bundle["metrics"]

    with open(DATASET_CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_rows = list(reader)

    # Pick latest rows across different stores and products
    step = max(1, len(all_rows) // limit)
    sample_rows = [all_rows[i] for i in range(len(all_rows) - 1, -1, -step)][:limit]

    results = []
    for r in sample_rows:
        feat = np.array([[float(r[c]) for c in feature_cols]])
        pred_daily = float(max(1.0, model.predict(feat)[0]))
        actual_daily = float(r["actual_demand"])
        abs_err = abs(actual_daily - pred_daily)

        results.append({
            "storeId": int(r["store_id"]),
            "storeCode": r["store_code"],
            "productId": int(r["product_id"]),
            "sku": r["sku"],
            "temperatureC": float(r["temperature_c"]),
            "discountPct": int(r["discount_pct"]),
            "shelfLifeDays": int(r["shelf_life_days"]),
            "rollingMean14d": float(r["rolling_mean_14d"]),
            "actualDailyDemand": round(actual_daily, 2),
            "predictedDailyDemand": round(pred_daily, 2),
            "predictedDemand7d": round(pred_daily * 7.0, 1),
            "absError": round(abs_err, 2)
        })

    output = {
        "success": True,
        "modelName": "LightGBM-HistGBT-v2.1-Pretrained (.pkl Live Inference)",
        "datasetPath": "Backend/ai_engine/sample_retail_dataset.csv",
        "totalDatasetRows": len(all_rows),
        "metrics": metrics,
        "testPredictions": results
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    lim = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    run_benchmark_test(lim)
