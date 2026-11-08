"""
JAL-SURAKSHA v2.0 - Stacked Ensemble Model for Water Quality Index
Reference: Nature Scientific Reports 2025 - R² = 0.9952

Usage:
    python stacked_ensemble.py --train --data water_quality.csv
    python stacked_ensemble.py --predict --model model.pkl --input sensor_data.json
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import StackingRegressor, RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import xgboost as xgb
from catboost import CatBoostRegressor
import shap
import joblib
import json
import argparse
import warnings
warnings.filterwarnings('ignore')


class WaterQualityStackedEnsemble:
    """
    Stacked Ensemble Model for Water Quality Index (WQI) Prediction
    
    Architecture (from Nature Scientific Reports 2025):
    - Base estimators: XGBoost, CatBoost, Random Forest, Gradient Boosting
    - Meta-learner: Gradient Boosting
    - Cross-validation: 5-fold
    - Expected R²: 0.9952
    
    Features:
    - pH
    - TDS (Total Dissolved Solids)
    - Turbidity
    - Temperature
    - Flow Rate
    - Pressure
    """
    
    FEATURE_NAMES = ['pH', 'TDS', 'Turbidity', 'Temperature', 'FlowRate', 'Pressure']
    
    def __init__(self):
        self.base_estimators = [
            ('xgboost', xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            )),
            ('catboost', CatBoostRegressor(
                iterations=100,
                depth=6,
                learning_rate=0.1,
                random_state=42,
                verbose=0
            )),
            ('random_forest', RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )),
            ('gradient_boosting', GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42
            ))
        ]
        
        self.model = StackingRegressor(
            estimators=self.base_estimators,
            final_estimator=GradientBoostingRegressor(
                n_estimators=50,
                max_depth=3,
                learning_rate=0.1,
                random_state=42
            ),
            cv=5,
            n_jobs=-1
        )
        
        self.scaler = StandardScaler()
        self.explainer = None
        self.shap_values = None
        self.is_trained = False
        
    def generate_synthetic_data(self, n_samples=1000):
        """
        Generate synthetic water quality data for training
        In real deployment, use actual sensor data
        """
        np.random.seed(42)
        
        # Generate realistic sensor readings
        data = {
            'pH': np.random.normal(7.0, 1.0, n_samples).clip(5.0, 9.0),
            'TDS': np.random.normal(300, 150, n_samples).clip(50, 1000),
            'Turbidity': np.random.normal(50, 30, n_samples).clip(0, 200),
            'Temperature': np.random.normal(25, 8, n_samples).clip(5, 45),
            'FlowRate': np.random.normal(5, 2, n_samples).clip(0, 15),
            'Pressure': np.random.normal(1013, 20, n_samples).clip(950, 1100)
        }
        
        df = pd.DataFrame(data)
        
        # Calculate WQI based on BIS standards (simplified)
        wqi = np.zeros(n_samples)
        
        # pH contribution (optimal: 6.5-8.5)
        wqi += np.where((df['pH'] >= 6.5) & (df['pH'] <= 8.5), 25, 10)
        
        # TDS contribution (optimal: <500)
        wqi += np.where(df['TDS'] < 500, 25, 10)
        
        # Turbidity contribution (optimal: <100)
        wqi += np.where(df['Turbidity'] < 100, 25, 10)
        
        # Temperature contribution (optimal: 15-35)
        wqi += np.where((df['Temperature'] >= 15) & (df['Temperature'] <= 35), 25, 10)
        
        # Add some noise
        wqi += np.random.normal(0, 2, n_samples)
        wqi = np.clip(wqi, 0, 100)
        
        return df, wqi
    
    def train(self, X=None, y=None, use_synthetic=True):
        """
        Train the stacked ensemble model
        
        Args:
            X: Feature matrix (optional)
            y: Target values (optional)
            use_synthetic: If True, generate synthetic data for demo
        """
        print("=" * 60)
        print("JAL-SURAKSHA v2.0 - Training Stacked Ensemble Model")
        print("=" * 60)
        
        # Generate synthetic data if not provided
        if use_synthetic or X is None:
            print("\n[1/5] Generating synthetic water quality data...")
            X, y = self.generate_synthetic_data(n_samples=2000)
            print(f"  Generated {len(X)} samples with {len(self.FEATURE_NAMES)} features")
        
        # Scale features
        print("\n[2/5] Scaling features...")
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        print("\n[3/5] Splitting data (80/20)...")
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        print(f"  Training: {len(X_train)} samples")
        print(f"  Testing: {len(X_test)} samples")
        
        # Train model
        print("\n[4/5] Training Stacked Ensemble...")
        print("  Base estimators: XGBoost, CatBoost, Random Forest, Gradient Boosting")
        print("  Meta-learner: Gradient Boosting")
        print("  Cross-validation: 5-fold")
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        print("\n[5/5] Evaluating model...")
        y_pred = self.model.predict(X_test)
        
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        
        print("\n" + "=" * 60)
        print("MODEL PERFORMANCE METRICS")
        print("=" * 60)
        print(f"  R² Score:          {r2:.4f}")
        print(f"  RMSE:              {rmse:.4f}")
        print(f"  MAE:               {mae:.4f}")
        print(f"  Reference (Nature): 0.9952")
        print("=" * 60)
        
        # Initialize SHAP explainer
        print("\n[BONUS] Initializing SHAP Explainer...")
        self.explainer = shap.TreeExplainer(self.model.estimators_[0])  # XGBoost
        self.shap_values = self.explainer.shap_values(X_test[:100])  # Sample for speed
        
        self.is_trained = True
        
        return {
            'r2': r2,
            'rmse': rmse,
            'mae': mae,
            'n_train': len(X_train),
            'n_test': len(X_test)
        }
    
    def predict(self, X):
        """Make predictions"""
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)
    
    def explain_prediction(self, X_single):
        """
        Explain a single prediction using SHAP
        
        Returns:
            dict with prediction, shap values, feature contributions
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        X_scaled = self.scaler.transform(X_single.reshape(1, -1))
        
        # Get prediction
        prediction = self.model.predict(X_scaled)[0]
        
        # Get SHAP values
        shap_values = self.explainer.shap_values(X_scaled)[0]
        
        # Create explanation
        explanation = {
            'prediction': float(prediction),
            'base_value': float(self.explainer.expected_value),
            'shap_values': shap_values.tolist(),
            'feature_names': self.FEATURE_NAMES,
            'feature_contributions': []
        }
        
        # Feature contributions
        for i, (name, value, shap_val) in enumerate(
            zip(self.FEATURE_NAMES, X_single, shap_values)
        ):
            explanation['feature_contributions'].append({
                'name': name,
                'value': float(value),
                'shap_value': float(shap_val),
                'impact': 'positive' if shap_val > 0 else 'negative',
                'description': f"{'↑' if shap_val > 0 else '↓'} {name} contributes {abs(shap_val):.3f} to WQI"
            })
        
        # Sort by absolute SHAP value
        explanation['feature_contributions'].sort(
            key=lambda x: abs(x['shap_value']), 
            reverse=True
        )
        
        return explanation
    
    def get_feature_importance(self):
        """
        Get global feature importance using SHAP
        
        Returns:
            DataFrame with feature importance rankings
        """
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        importance = pd.DataFrame({
            'feature': self.FEATURE_NAMES,
            'mean_abs_shap': np.abs(self.shap_values).mean(axis=0)
        }).sort_values('mean_abs_shap', ascending=False)
        
        importance['percentage'] = (
            importance['mean_abs_shap'] / importance['mean_abs_shap'].sum() * 100
        )
        
        return importance
    
    def save_model(self, filepath='jal_suraksha_model.pkl'):
        """Save trained model to disk"""
        if not self.is_trained:
            raise ValueError("Model not trained yet!")
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.FEATURE_NAMES,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, filepath)
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath='jal_suraksha_model.pkl'):
        """Load trained model from disk"""
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.is_trained = model_data['is_trained']
        
        # Re-initialize SHAP
        self.explainer = shap.TreeExplainer(self.model.estimators_[0])
        
        print(f"Model loaded from {filepath}")


def main():
    parser = argparse.ArgumentParser(description='JAL-SURAKSHA v2.0 Stacked Ensemble')
    parser.add_argument('--train', action='store_true', help='Train the model')
    parser.add_argument('--predict', action='store_true', help='Make predictions')
    parser.add_argument('--explain', action='store_true', help='Explain a prediction')
    parser.add_argument('--data', type=str, help='Path to training data CSV')
    parser.add_argument('--model', type=str, default='jal_suraksha_model.pkl', 
                       help='Path to save/load model')
    parser.add_argument('--input', type=str, help='Input JSON for prediction')
    
    args = parser.parse_args()
    
    model = WaterQualityStackedEnsemble()
    
    if args.train:
        # Load data if provided
        X, y = None, None
        if args.data:
            df = pd.read_csv(args.data)
            X = df[['pH', 'TDS', 'Turbidity', 'Temperature', 'FlowRate', 'Pressure']]
            y = df['WQI']
        
        # Train
        metrics = model.train(X=X, y=y, use_synthetic=(args.data is None))
        
        # Save model
        model.save_model(args.model)
        
        # Print feature importance
        print("\nFeature Importance:")
        print(model.get_feature_importance())
        
    elif args.predict or args.explain:
        # Load model
        model.load_model(args.model)
        
        # Load input
        with open(args.input, 'r') as f:
            input_data = json.load(f)
        
        X = np.array([[
            input_data['pH'],
            input_data['tds'],
            input_data['turbidity'],
            input_data['temperature'],
            input_data['flowRate'],
            input_data['pressure']
        ]])
        
        # Predict
        prediction = model.predict(X)
        print(f"\nPredicted WQI: {prediction[0]:.2f}")
        
        # Explain if requested
        if args.explain:
            explanation = model.explain_prediction(X[0])
            print("\n" + "=" * 60)
            print("SHAP EXPLANATION")
            print("=" * 60)
            print(f"Prediction: {explanation['prediction']:.2f}")
            print(f"Base Value: {explanation['base_value']:.2f}")
            print("\nFeature Contributions:")
            for contrib in explanation['feature_contributions']:
                print(f"  {contrib['name']:15} : {contrib['shap_value']:+.3f} ({contrib['impact']})")
            print("=" * 60)


if __name__ == '__main__':
    main()
