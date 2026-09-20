"""
JAL-SURAKSHA v3.0 - Random Forest Classifier for WQI
Simplified from Stacked Ensemble (v2.0) for hackathon clarity.

Usage:
    python wqi_classifier.py --train --data water_quality.csv
    python wqi_classifier.py --predict --model rf_model.pkl --input sensor_data.json
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.preprocessing import StandardScaler
import shap
import joblib
import json
import argparse


class WaterQualityClassifier:
    """
    Random Forest classifier for Water Quality Index prediction.
    
    Design choice (v2→v3 simplification):
    - Replaced Stacked Ensemble (4 models) with single Random Forest
    - Reason: Interpretable, explainable with SHAP, fast, works with small data
    - No deep learning overhead for a hackathon demo
    
    Classes: Excellent (90-100), Good (70-89), Fair (50-69), Poor (30-49), Very Poor (0-29)
    """
    
    CLASSES = ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor']
    FEATURE_NAMES = ['pH', 'TDS', 'Turbidity', 'Temperature', 'FlowRate', 'Pressure']
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.explainer = None
        self.is_trained = False
        
    def generate_synthetic_data(self, n_samples=2000):
        """Generate synthetic water quality data for demo."""
        np.random.seed(42)
        
        data = {
            'pH': np.random.normal(7.0, 1.0, n_samples).clip(5.0, 9.0),
            'TDS': np.random.normal(300, 150, n_samples).clip(50, 1000),
            'Turbidity': np.random.normal(50, 30, n_samples).clip(0, 200),
            'Temperature': np.random.normal(25, 8, n_samples).clip(5, 45),
            'FlowRate': np.random.normal(5, 2, n_samples).clip(0, 15),
            'Pressure': np.random.normal(1013, 20, n_samples).clip(950, 1100)
        }
        
        df = pd.DataFrame(data)
        
        # Calculate WQI using weighted BIS method
        wqi = np.zeros(n_samples)
        
        # pH score (weight 0.22)
        ph_score = np.where(
            (df['pH'] >= 6.5) & (df['pH'] <= 8.5), 100,
            np.where(df['pH'] < 6.5,
                     np.maximum(0, 100 - (6.5 - df['pH']) * 40),
                     np.maximum(0, 100 - (df['pH'] - 8.5) * 40))
        )
        
        # TDS score (weight 0.20)
        tds_score = np.where(
            df['TDS'] <= 500, 100,
            np.where(df['TDS'] <= 1000,
                     np.maximum(0, 100 - (df['TDS'] - 500) * 0.1),
                     np.maximum(0, 50 - (df['TDS'] - 1000) * 0.05))
        )
        
        # Turbidity score (weight 0.18)
        turb_score = np.where(
            df['Turbidity'] <= 1, 100,
            np.where(df['Turbidity'] <= 5,
                     np.maximum(0, 100 - (df['Turbidity'] - 1) * 15),
                     np.where(df['Turbidity'] <= 100,
                              np.maximum(0, 40 - (df['Turbidity'] - 5) * 0.4), 0))
        )
        
        # Temperature score (weight 0.15)
        temp_score = np.where(
            (df['Temperature'] >= 15) & (df['Temperature'] <= 35), 100,
            np.where(df['Temperature'] < 15,
                     np.maximum(0, 100 - (15 - df['Temperature']) * 5),
                     np.maximum(0, 100 - (df['Temperature'] - 35) * 5))
        )
        
        # Flow score (weight 0.10)
        flow_score = np.where(
            df['FlowRate'] >= 2, 100,
            np.where(df['FlowRate'] >= 0.5,
                     (df['FlowRate'] / 2) * 100, 0)
        )
        
        # Safety score (weight 0.15)
        safe_count = (
            ((df['pH'] >= 6.5) & (df['pH'] <= 8.5)).astype(float) +
            (df['TDS'] <= 500).astype(float) +
            (df['Turbidity'] <= 5).astype(float) +
            ((df['Temperature'] >= 15) & (df['Temperature'] <= 35)).astype(float)
        )
        safety_score = (safe_count / 4) * 100
        
        # Weighted WQI
        wqi = (ph_score * 0.22 + tds_score * 0.20 + turb_score * 0.18 +
               temp_score * 0.15 + flow_score * 0.10 + safety_score * 0.15)
        
        # Classify WQI
        classes = pd.cut(wqi, bins=[0, 30, 50, 70, 90, 100],
                        labels=self.CLASSES, include_lowest=True)
        
        return df, classes
    
    def train(self, X=None, y=None, use_synthetic=True):
        """Train the Random Forest classifier."""
        print("=" * 60)
        print("JAL-SURAKSHA v3.0 - Training Random Forest Classifier")
        print("=" * 60)
        
        if use_synthetic or X is None:
            print("\n[1/4] Generating synthetic data...")
            X, y = self.generate_synthetic_data(n_samples=2000)
            print(f"  Generated {len(X)} samples")
        
        print("\n[2/4] Scaling features...")
        X_scaled = self.scaler.fit_transform(X)
        
        print("\n[3/4] Training Random Forest...")
        self.model.fit(X_scaled, y)
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X_scaled, y, cv=5)
        print(f"\n  5-fold CV accuracy: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
        
        # Evaluate
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        y_pred = self.model.predict(X_test)
        
        print("\n[4/4] Evaluation:")
        print(classification_report(y_test, y_pred))
        
        # Initialize SHAP
        print("  Initializing SHAP TreeExplainer...")
        self.explainer = shap.TreeExplainer(self.model)
        
        self.is_trained = True
        print("=" * 60)
        print("Training complete!")
        print("=" * 60)
        
    def predict(self, X):
        """Predict WQI class."""
        if not self.is_trained:
            raise ValueError("Model not trained!")
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def predict_proba(self, X):
        """Get prediction probabilities."""
        if not self.is_trained:
            raise ValueError("Model not trained!")
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)
    
    def explain(self, X_single):
        """SHAP explanation for a single prediction."""
        if not self.is_trained:
            raise ValueError("Model not trained!")
        
        X_scaled = self.scaler.transform(X_single.reshape(1, -1))
        shap_values = self.explainer.shap_values(X_scaled)
        
        pred_class = self.model.predict(X_scaled)[0]
        pred_proba = self.model.predict_proba(X_scaled)[0]
        
        # Get SHAP values for predicted class
        class_idx = list(self.model.classes_).index(pred_class)
        
        ev = self.explainer.expected_value
        if isinstance(ev, (list, np.ndarray)):
            base_val = float(ev[class_idx]) if len(ev) > class_idx else float(ev[0])
        else:
            base_val = float(ev)
        
        # shap_values shape: (n_samples, n_features, n_classes) for multiclass
        if isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
            sv = shap_values[0][:, class_idx]  # features x one class
        elif isinstance(shap_values, list):
            sv = shap_values[class_idx][0]
        else:
            sv = shap_values[0]
        
        explanation = {
            'prediction': pred_class,
            'confidence': float(pred_proba[class_idx]),
            'base_value': base_val,
            'features': []
        }
        
        for i, (name, value) in enumerate(
            zip(self.FEATURE_NAMES, X_single)
        ):
            shap_val = float(sv[i]) if hasattr(sv, '__len__') else float(sv)
            explanation['features'].append({
                'name': name,
                'value': float(value),
                'shap_value': shap_val,
                'impact': 'positive' if shap_val > 0 else 'negative',
                'magnitude': abs(shap_val)
            })
        
        explanation['features'].sort(key=lambda x: x['magnitude'], reverse=True)
        return explanation
    
    def get_feature_importance(self):
        """Get global feature importance."""
        if not self.is_trained:
            raise ValueError("Model not trained!")
        
        importance = pd.DataFrame({
            'feature': self.FEATURE_NAMES,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return importance
    
    def save_model(self, filepath='wqi_rf_model.pkl'):
        """Save trained model."""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'classes': self.model.classes_,
            'feature_names': self.FEATURE_NAMES,
            'is_trained': self.is_trained
        }, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='wqi_rf_model.pkl'):
        """Load trained model."""
        data = joblib.load(filepath)
        self.model = data['model']
        self.scaler = data['scaler']
        self.is_trained = data['is_trained']
        self.explainer = shap.TreeExplainer(self.model)
        print(f"Model loaded from {filepath}")


def main():
    parser = argparse.ArgumentParser(description='JAL-SURAKSHA v3.0 WQI Classifier')
    parser.add_argument('--train', action='store_true')
    parser.add_argument('--predict', action='store_true')
    parser.add_argument('--explain', action='store_true')
    parser.add_argument('--data', type=str)
    parser.add_argument('--model', type=str, default='wqi_rf_model.pkl')
    parser.add_argument('--input', type=str)
    
    args = parser.parse_args()
    clf = WaterQualityClassifier()
    
    if args.train:
        X, y = None, None
        if args.data:
            df = pd.read_csv(args.data)
            X = df[clf.FEATURE_NAMES]
            y = pd.cut(df['WQI'], bins=[0, 30, 50, 70, 90, 100],
                      labels=clf.CLASSES, include_lowest=True)
        
        clf.train(X=X, y=y, use_synthetic=(args.data is None))
        clf.save_model(args.model)
        
        print("\nFeature Importance:")
        print(clf.get_feature_importance())
        
    elif args.predict or args.explain:
        clf.load_model(args.model)
        
        with open(args.input, 'r') as f:
            data = json.load(f)
        
        X = np.array([[data['pH'], data['tds'], data['turbidity'],
                       data['temperature'], data['flowRate'], data['pressure']]])
        
        prediction = clf.predict(X)[0]
        print(f"\nPredicted WQI Class: {prediction}")
        
        if args.explain:
            explanation = clf.explain(X[0])
            print(f"\nConfidence: {explanation['confidence']:.1%}")
            print(f"Base Value: {explanation['base_value']:.3f}")
            print("\nFeature Contributions:")
            for f in explanation['features']:
                print(f"  {f['name']:12} : {f['shap_value']:+.4f} ({f['impact']})")


if __name__ == '__main__':
    main()
