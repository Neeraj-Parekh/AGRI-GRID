"""
JAL-SURAKSHA v3.0 - Anomaly Detector (Simplified)
Uses sklearn IsolationForest instead of Keras autoencoder.
No TensorFlow dependency required.

Usage:
    python anomaly_detector.py --train --data normal_data.csv
    python anomaly_detector.py --detect --model anomaly_model.pkl --input sensor_data.json
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_score, recall_score, f1_score
import joblib
import json
import argparse


class AnomalyDetector:
    """
    IsolationForest-based anomaly detector for water quality.
    
    Design choice:
    - Replaced Keras autoencoder with sklearn IsolationForest
    - Reason: No TensorFlow dependency, simpler, works well for hackathon
    - Both approaches are valid for unsupervised anomaly detection
    
    Reference: Sensors 2023 used autoencoder (96% TPR benchmark)
    Our approach: IsolationForest (architecture inspired, our implementation)
    """
    
    FEATURE_NAMES = ['pH', 'TDS', 'Turbidity', 'Temperature', 'FlowRate', 'Pressure']
    
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,  # Expect ~5% anomalies
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.threshold = None
        self.is_trained = False
        
    def generate_normal_data(self, n_samples=1000):
        """Generate normal water quality data for training."""
        np.random.seed(42)
        data = {
            'pH': np.random.normal(7.0, 0.5, n_samples).clip(6.5, 8.5),
            'TDS': np.random.normal(300, 100, n_samples).clip(100, 500),
            'Turbidity': np.random.normal(30, 15, n_samples).clip(5, 80),
            'Temperature': np.random.normal(25, 5, n_samples).clip(15, 35),
            'FlowRate': np.random.normal(5, 1.5, n_samples).clip(2, 8),
            'Pressure': np.random.normal(1013, 10, n_samples).clip(1000, 1030)
        }
        return pd.DataFrame(data)
    
    def generate_anomaly_data(self, n_samples=200):
        """Generate anomalous data for testing."""
        np.random.seed(123)
        data = {
            'pH': np.random.normal(5.5, 1.5, n_samples).clip(3.0, 9.0),
            'TDS': np.random.normal(700, 200, n_samples).clip(400, 1500),
            'Turbidity': np.random.normal(120, 40, n_samples).clip(50, 250),
            'Temperature': np.random.normal(42, 8, n_samples).clip(35, 55),
            'FlowRate': np.random.normal(1.5, 1, n_samples).clip(0, 4),
            'Pressure': np.random.normal(880, 40, n_samples).clip(800, 950)
        }
        return pd.DataFrame(data)
    
    def train(self, X_normal=None, use_synthetic=True):
        """Train on normal data only."""
        print("=" * 60)
        print("JAL-SURAKSHA v3.0 - Training Anomaly Detector (IsolationForest)")
        print("=" * 60)
        
        if use_synthetic or X_normal is None:
            print("\n[1/3] Generating synthetic normal data...")
            X_normal = self.generate_normal_data(n_samples=2000)
            print(f"  Generated {len(X_normal)} samples")
        
        print("\n[2/3] Scaling data...")
        X_scaled = self.scaler.fit_transform(X_normal)
        
        print("\n[3/3] Training IsolationForest...")
        self.model.fit(X_scaled)
        
        # Set threshold from training data
        scores = self.model.decision_function(X_scaled)
        self.threshold = np.percentile(scores, 5)  # 5th percentile = boundary
        
        self.is_trained = True
        print(f"  Threshold: {self.threshold:.4f}")
        print("=" * 60)
        print("Training complete!")
        print("=" * 60)
    
    def detect(self, X):
        """Detect anomalies. Returns (is_anomaly, scores, raw_scores)."""
        if not self.is_trained:
            raise ValueError("Model not trained!")
        
        X_scaled = self.scaler.transform(X)
        
        # decision_function: negative = anomaly, positive = normal
        raw_scores = self.model.decision_function(X_scaled)
        predictions = self.model.predict(X_scaled)  # -1 = anomaly, 1 = normal
        
        anomalies = predictions == -1
        scores = np.clip(-raw_scores / abs(self.threshold), 0, 2) if self.threshold != 0 else np.zeros_like(raw_scores)
        
        return anomalies, scores, raw_scores
    
    def get_anomaly_explanation(self, X_single):
        """Explain which features contributed to anomaly."""
        if not self.is_trained:
            raise ValueError("Model not trained!")
        
        X_scaled = self.scaler.transform(X_single.reshape(1, -1))
        
        # Simple: compare each feature to training mean
        train_mean = self.scaler.mean_
        train_std = self.scaler.scale_
        
        deviations = np.abs(X_scaled[0] - train_mean / train_std)
        total_dev = deviations.sum()
        
        explanation = pd.DataFrame({
            'feature': self.FEATURE_NAMES,
            'value': X_single,
            'deviation': deviations,
            'contribution': deviations / total_dev if total_dev > 0 else deviations
        }).sort_values('contribution', ascending=False)
        
        return explanation
    
    def evaluate(self, X_normal, X_anomaly):
        """Evaluate on known normal/anomaly data."""
        X_all = np.vstack([X_normal, X_anomaly])
        y_true = np.concatenate([np.zeros(len(X_normal)), np.ones(len(X_anomaly))])
        
        anomalies, _, _ = self.detect(X_all)
        y_pred = anomalies.astype(int)
        
        metrics = {
            'precision': precision_score(y_true, y_pred),
            'recall': recall_score(y_true, y_pred),
            'f1': f1_score(y_true, y_pred),
            'accuracy': np.mean(y_true == y_pred)
        }
        
        print("\nAnomaly Detection Performance:")
        for k, v in metrics.items():
            print(f"  {k}: {v:.3f}")
        
        return metrics
    
    def save_model(self, filepath='anomaly_model.pkl'):
        """Save model."""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'threshold': self.threshold,
            'feature_names': self.FEATURE_NAMES,
            'is_trained': self.is_trained
        }, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='anomaly_model.pkl'):
        """Load model."""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.threshold = data['threshold']
        self.is_trained = data['is_trained']
        print(f"Model loaded from {filepath}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--train', action='store_true')
    parser.add_argument('--detect', action='store_true')
    parser.add_argument('--model', type=str, default='anomaly_model.pkl')
    parser.add_argument('--input', type=str)
    args = parser.parse_args()
    
    det = AnomalyDetector()
    
    if args.train:
        det.train(use_synthetic=True)
        X_normal = det.generate_normal_data(500)
        X_anomaly = det.generate_anomaly_data(100)
        det.evaluate(X_normal, X_anomaly)
        det.save_model(args.model)
    
    elif args.detect:
        det.load_model(args.model)
        with open(args.input) as f:
            data = json.load(f)
        X = np.array([[data['pH'], data['tds'], data['turbidity'],
                       data['temperature'], data['flowRate'], data['pressure']]])
        anomalies, scores, raw = det.detect(X)
        print(f"Anomaly: {anomalies[0]}, Score: {scores[0]:.3f}")


if __name__ == '__main__':
    main()
