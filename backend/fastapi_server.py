"""
JAL-SURAKSHA v3.0 - FastAPI Backend (Simplified AI Stack)
Autoencoder + Random Forest + SHAP

Usage:
    uvicorn fastapi_server:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from datetime import datetime

from wqi_classifier import WaterQualityClassifier
from anomaly_detector import AnomalyDetector

app = FastAPI(
    title="JAL-SURAKSHA v3.0 API",
    description="Simplified AI: Autoencoder + Random Forest + SHAP",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
wqi_clf = WaterQualityClassifier()
anomaly_det = AnomalyDetector()

@app.on_event("startup")
async def load_models():
    wqi_clf.train(use_synthetic=True)
    anomaly_det.train(use_synthetic=True)
    print("[OK] Models loaded (synthetic training for demo)")

class SensorData(BaseModel):
    pH: float
    tds: float
    turbidity: float
    temperature: float
    flowRate: float
    pressure: float

@app.get("/")
async def root():
    return {
        "name": "JAL-SURAKSHA v3.0",
        "ai_stack": "Autoencoder + Random Forest + SHAP",
        "note": "Performance benchmarks from cited papers, not our results",
        "docs": "/docs"
    }

@app.post("/api/predict")
async def predict(data: SensorData):
    X = np.array([[data.pH, data.tds, data.turbidity,
                   data.temperature, data.flowRate, data.pressure]])
    prediction = wqi_clf.predict(X)[0]
    proba = wqi_clf.predict_proba(X)[0]
    confidence = float(max(proba))
    return {"wqi_class": prediction, "confidence": confidence,
            "timestamp": datetime.now().isoformat()}

@app.post("/api/explain")
async def explain(data: SensorData):
    X = np.array([[data.pH, data.tds, data.turbidity,
                   data.temperature, data.flowRate, data.pressure]])
    return wqi_clf.explain(X[0])

@app.post("/api/anomaly")
async def detect_anomaly(data: SensorData):
    X = np.array([[data.pH, data.tds, data.turbidity,
                   data.temperature, data.flowRate, data.pressure]])
    anomalies, scores, mse = anomaly_det.detect(X)
    return {
        "is_anomaly": bool(anomalies[0]),
        "anomaly_score": float(scores[0]),
        "reconstruction_error": float(mse[0]),
        "threshold": float(anomaly_det.threshold)
    }

@app.get("/api/feature-importance")
async def feature_importance():
    return wqi_clf.get_feature_importance().to_dict('records')

@app.get("/api/model-info")
async def model_info():
    return {
        "wqi_model": {
            "type": "Random Forest",
            "n_estimators": 100,
            "reference": "Our design (not from paper)",
            "note": "Replaced Stacked Ensemble for simplicity"
        },
        "anomaly_model": {
            "type": "Autoencoder",
            "architecture": "6→32→16→3→16→32→6",
            "reference": "Architecture inspired by Sensors 2023",
            "note": "Unsupervised, no labeled data needed"
        },
        "explainability": {
            "method": "SHAP TreeExplainer",
            "reference": "Nature 2025 (XAI underutilized gap)"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
