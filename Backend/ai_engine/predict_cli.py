# -*- coding: utf-8 -*-
"""
CLI Inference Script - Chay mo hinh Pre-trained (.pkl) tren du lieu thuc te
duoc truy van tu SQL Server (retail_spoilage_db) ket hop thoi tiet Open-Meteo (stdin JSON).
"""

import os
import sys
import json
import pickle
import warnings
import numpy as np

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PKL_PATH = os.path.join(BASE_DIR, "pretrained_lgbm_model.pkl")


def run_live_sql_inference(payload):
    with open(MODEL_PKL_PATH, "rb") as f:
        bundle = pickle.load(f)

    model = bundle["model"]
    feature_cols = bundle["feature_cols"]
    rows = payload.get("rows") or []

    results = []
    abs_errors = []
    sq_errors = []
    pct_errors = []

    if rows:
        feat_matrix = np.array([[float(r.get(c, 0)) for c in feature_cols] for r in rows], dtype=float)
        pred_all = np.maximum(0.0, model.predict(feat_matrix))
    else:
        pred_all = np.array([], dtype=float)

    for idx, r in enumerate(rows):
        pred_daily = float(pred_all[idx])
        actual_daily = float(r.get("actual_demand", 0))
        abs_err = abs(actual_daily - pred_daily)
        abs_errors.append(abs_err)
        sq_errors.append(abs_err ** 2)
        if actual_daily > 0:
            pct_errors.append(abs_err / actual_daily * 100.0)

        results.append({
            "rowKey": r.get("row_key"),
            "storeId": int(r.get("store_id", 1)),
            "storeCode": r.get("store_code", "RETAIL-STORE-01"),
            "productId": int(r.get("product_id", 0)),
            "sku": r.get("sku", ""),
            "productName": r.get("product_name", ""),
            "temperatureC": round(float(r.get("temperature_c", 0)), 1),
            "discountPct": int(r.get("discount_pct", 0)),
            "shelfLifeDays": int(r.get("shelf_life_days", 0)),
            "rollingMean14d": round(float(r.get("rolling_mean_14d", 0)), 2),
            "actualDailyDemand": round(actual_daily, 2),
            "predictedDailyDemand": round(pred_daily, 2),
            "predictedDemand7d": round(pred_daily * 7.0, 1),
            "absError": round(abs_err, 2),
        })

    real_metrics = {
        "mae": round(float(np.mean(abs_errors)), 2) if abs_errors else None,
        "rmse": round(float(np.sqrt(np.mean(sq_errors))), 2) if sq_errors else None,
        "mape_pct": round(float(np.mean(pct_errors)), 2) if pct_errors else None,
    }

    output = {
        "success": True,
        "modelName": f"{bundle.get('modelLibrary', 'LightGBM')} (.pkl SQL Server + Open-Meteo Live)",
        "datasetPath": "SQL Server dbo.sales_history + Open-Meteo Live",
        "totalDatasetRows": len(rows),
        "metrics": real_metrics,
        "testPredictions": results,
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    raw_stdin = sys.stdin.read()
    if not raw_stdin.strip():
        print(json.dumps({"success": False, "message": "Khong co du lieu thuc te tu SQL Server de suy luan."}))
        sys.exit(1)
    payload_data = json.loads(raw_stdin)
    run_live_sql_inference(payload_data)
