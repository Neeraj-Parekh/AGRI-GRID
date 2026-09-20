# IsolationForest Edge AI on ESP32 - Anomaly Detection

- **Source:** scikit-learn / Espressif ESP-DL
- **Year:** 2024
- **URL:** https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html
- **Type:** Technical Documentation / Tutorial
- **Relevance to AGRI-GRID:** Core algorithm for edge-based anomaly detection in agricultural sensor data, enabling local processing without cloud dependency.

## Summary
IsolationForest is an unsupervised learning algorithm for anomaly detection that isolates anomalies by randomly selecting features and split values. It works well with high-dimensional data and doesn't require labeled training data. On ESP32, a pre-trained model can be deployed using TFLite Micro or ONNX Runtime for real-time anomaly detection on sensor streams.

## Key Technical Details
- Algorithm: Isolation Forest (unsupervised)
- Principle: Anomalies are easier to isolate (fewer splits needed)
- Key Parameters:
  - n_estimators: Number of isolation trees (default: 100)
  - max_samples: Samples to draw for each tree
  - contamination: Expected proportion of anomalies
  - max_features: Features to draw for each tree
- Anomaly Score: Lower score = more anomalous
- Threshold: Typically -0.5 to 0.1 (configurable)
- ESP32 Deployment:
  - Pre-train model on Python (scikit-learn)
  - Export to ONNX format
  - Convert to TFLite using onnx2tf
  - Deploy using ESP-DL or TFLite Micro
  - Model size: 50-200 KB (depending on parameters)
  - Inference time: 10-50 ms on ESP32-S3
- Use Cases in Agriculture:
  - Sensor malfunction detection (sudden spike/drop)
  - Irrigation pipe leak detection
  - Soil contamination alerting
  - Pest infestation early warning
  - Equipment failure prediction
- Memory Requirements:
  - RAM: 20-50 KB for inference
  - Flash: 100-500 KB for model storage
- Power Impact:
  - Active inference: ~20 mA for 50 ms
  - Negligible impact on battery life with 15-min intervals

## AGRI-GRID Citation
AGRI-GRID deploys a pre-trained IsolationForest model on each ESP32 sensor node to detect anomalies in soil moisture, pH, and temperature readings. The model is trained offline on 6 months of agricultural sensor data and exported to ONNX format for edge deployment. When an anomaly is detected (e.g., sudden pH drop indicating pesticide contamination), the node immediately transmits an alert via LoRa, bypassing the normal 15-minute reporting interval.
