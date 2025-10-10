import pandas as pd
import time
import numpy as np
import gc
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.preprocessing import StandardScaler

# Import Linear Models
from sklearn.linear_model import LogisticRegression, RidgeClassifier, SGDClassifier, Perceptron

# Import Tree-Based Models
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier

# Import Boosting Models
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

# Import Ensemble Models
from sklearn.ensemble import BaggingClassifier, VotingClassifier, StackingClassifier

# Import SVM Models
from sklearn.svm import SVC, LinearSVC

# Import Other Models
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.neural_network import MLPClassifier

# Custom Extra Tree model (single tree)
class ExtraTreeClassifierWrapper(ExtraTreesClassifier):
    def __init__(self, **kwargs):
        super().__init__(n_estimators=1, **kwargs)

def get_models():
    """
    Returns ADVANCED models only (15 total) - MEMORY OPTIMIZED for Render.
    
    EXCLUDED (already in Quick ML browser-based):
    - Logistic Regression
    - Decision Tree  
    - Random Forest
    - K-Nearest Neighbors
    - Gaussian Naive Bayes
    - SVC (RBF)
    - Multi-Layer Perceptron
    
    INCLUDED (Advanced algorithms Quick ML can't handle):
    - Advanced linear models (Ridge, SGD, Perceptron)
    - Extra Tree variants
    - All boosting models (AdaBoost, Gradient Boosting, XGBoost, LightGBM, CatBoost)
    - Ensemble methods (Bagging, Voting, Stacking)
    - Linear SVC
    """
    
    # Define base estimators for ensemble models (memory-efficient versions)
    base_ridge = RidgeClassifier(random_state=42)
    base_et = ExtraTreesClassifier(n_estimators=20, max_depth=10, random_state=42, n_jobs=1)
    base_sgd = SGDClassifier(random_state=42, max_iter=500, n_jobs=1)
    
    return {
        # Advanced Linear Models (3) - NOT in Quick ML
        "Ridge Classifier": RidgeClassifier(random_state=42),
        "SGD Classifier": SGDClassifier(random_state=42, max_iter=500, n_jobs=1),
        "Perceptron": Perceptron(random_state=42, max_iter=500, n_jobs=1),
        
        # Advanced Tree-Based Models (2) - Extra Trees only
        "Extra Tree": ExtraTreeClassifierWrapper(max_depth=10, random_state=42),
        "Extra Trees Ensemble": ExtraTreesClassifier(n_estimators=30, max_depth=10, random_state=42, n_jobs=1),
        
        # Boosting Models (6) - NONE in Quick ML - These are the power algorithms
        "AdaBoost": AdaBoostClassifier(n_estimators=30, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=30, max_depth=5, random_state=42),
        "Histogram Gradient Boosting": HistGradientBoostingClassifier(max_iter=30, max_depth=5, random_state=42),
        "XGBoost": XGBClassifier(n_estimators=30, max_depth=5, random_state=42, use_label_encoder=False, eval_metric='logloss', n_jobs=1, verbosity=0, tree_method='hist'),
        "LightGBM": LGBMClassifier(n_estimators=30, max_depth=5, num_leaves=15, random_state=42, n_jobs=1, verbose=-1),
        "CatBoost": CatBoostClassifier(iterations=30, depth=5, random_state=42, verbose=0, thread_count=1),
        
        # Ensemble Models (3) - NOT in Quick ML
        "Bagging Classifier": BaggingClassifier(n_estimators=20, random_state=42, n_jobs=1),
        "Voting Classifier": VotingClassifier(
            estimators=[('ridge', base_ridge), ('et', base_et), ('sgd', base_sgd)],
            voting='soft',
            n_jobs=1
        ),
        "Stacking Classifier": StackingClassifier(
            estimators=[('ridge', base_ridge), ('et', base_et), ('sgd', base_sgd)],
            final_estimator=RidgeClassifier(),
            n_jobs=1
        ),
        
        # Linear SVC (1) - More advanced than basic SVC in Quick ML
        "Linear SVC": LinearSVC(random_state=42, dual=False, max_iter=1000),
    }

def train_and_evaluate(name, model, X_train, y_train, X_test, y_test):
    """Trains a single model and returns its performance metrics."""
    try:
        # Training
        start_train = time.time()
        model.fit(X_train, y_train)
        training_time = (time.time() - start_train) * 1000  # Convert to ms
        
        # Prediction
        start_pred = time.time()
        y_pred = model.predict(X_test)
        prediction_time = (time.time() - start_pred) * 1000  # Convert to ms
        
        # Train score
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        
        # ROC-AUC (if applicable)
        roc_auc = None
        try:
            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_test)
                if y_proba.shape[1] == 2:  # Binary classification
                    roc_auc = roc_auc_score(y_test, y_proba[:, 1])
                else:  # Multi-class
                    roc_auc = roc_auc_score(y_test, y_proba, multi_class='ovr', average='weighted')
        except:
            roc_auc = None
        
        # Cross-validation - REDUCED to 3-fold and sequential to save memory
        try:
            cv_scores = cross_val_score(model, X_train, y_train, cv=min(3, len(X_train) // 2), 
                                       scoring='f1_weighted', n_jobs=1)
            cv_f1_mean = cv_scores.mean()
            cv_f1_std = cv_scores.std()
        except:
            cv_f1_mean = f1
            cv_f1_std = 0.0
        
        # Get hyperparameters
        hyperparameters = {k: str(v) for k, v in model.get_params().items() if not k.startswith('_')}
        
        return {
            "algorithm": name,
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1Score": float(f1),
            "rocAuc": float(roc_auc) if roc_auc is not None else None,
            "cvF1Mean": float(cv_f1_mean),
            "cvF1Std": float(cv_f1_std),
            "trainingTime": float(training_time),
            "predictionTime": float(prediction_time),
            "trainScore": float(train_score),
            "testScore": float(test_score),
            "confusionMatrix": cm.tolist(),
            "hyperparameters": hyperparameters,
            "status": "success"
        }
    except Exception as e:
        print(f"  ❌ {name} failed: {str(e)}")
        return {
            "algorithm": name,
            "accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1Score": 0.0,
            "rocAuc": None,
            "cvF1Mean": 0.0,
            "cvF1Std": 0.0,
            "trainingTime": 0.0,
            "predictionTime": 0.0,
            "trainScore": 0.0,
            "testScore": 0.0,
            "confusionMatrix": [[0]],
            "hyperparameters": {},
            "status": "failed",
            "error": str(e)
        }

def train_all_models(data, target_column):
    """Main function to train all models and return results."""
    print("\n" + "="*50)
    print("Starting Advanced ML Training")
    print("="*50)
    
    start_time = time.time()
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    print(f"Dataset shape: {df.shape}")
    
    # Validate target column exists
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in data")
    
    # Prepare data
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # Check if we have enough data
    if len(X) < 10:
        raise ValueError("Dataset too small. Need at least 10 samples.")
    
    # Check if target has at least 2 classes
    unique_classes = y.nunique()
    if unique_classes < 2:
        raise ValueError(f"Target must have at least 2 classes. Found: {unique_classes}")
    
    print(f"Features: {len(X.columns)}, Classes: {unique_classes}")
    
    # One-hot encode categorical features
    X_encoded = pd.get_dummies(X, drop_first=True)
    print(f"After encoding: {X_encoded.shape[1]} features")
    
    # Scale features (important for linear models)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_encoded)
    
    # Split data (80/20 train/test split with stratification)
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.20, random_state=42, stratify=y
        )
        print(f"Train: {len(X_train)}, Test: {len(X_test)} (stratified)")
    except ValueError:
        # If stratification fails (too few samples per class), split without it
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.20, random_state=42
        )
        print(f"Train: {len(X_train)}, Test: {len(X_test)} (non-stratified)")
    
    # Get models and train
    models = get_models()
    results = []
    
    print(f"\nTraining {len(models)} algorithms...")
    print("-"*50)
    
    for name, model in models.items():
        print(f"Training {name}...")
        result = train_and_evaluate(name, model, X_train, y_train, X_test, y_test)
        results.append(result)
        if result["status"] == "success":
            print(f"  ✓ F1: {result['f1Score']:.4f}, Accuracy: {result['accuracy']:.4f}")
    
    print("-"*50)
    
    # Find best model
    successful_results = [r for r in results if r["status"] == "success"]
    if not successful_results:
        raise Exception("All models failed to train")
    
    best_model = max(successful_results, key=lambda x: x["f1Score"])
    
    total_time = (time.time() - start_time) * 1000  # Convert to ms
    
    print(f"\n🏆 Best Model: {best_model['algorithm']}")
    print(f"   F1-Score: {best_model['f1Score']:.4f}")
    print(f"   Total Time: {total_time:.0f}ms")
    print("="*50 + "\n")
    
    return {
        "results": results,
        "bestModel": best_model,
        "totalTime": total_time,
        "successCount": len(successful_results),
        "failureCount": len(results) - len(successful_results),
        "datasetInfo": {
            "samples": len(df),
            "features": len(X.columns),
            "featuresAfterEncoding": X_encoded.shape[1],
            "classes": unique_classes,
            "trainSize": len(X_train),
            "testSize": len(X_test)
        }
    }


def train_all_models_streaming(data, target_column):
    """
    Generator function that yields results ONE MODEL AT A TIME - MEMORY OPTIMIZED.
    Each model is trained, evaluated, yielded, then garbage collected before the next.
    """
    print("\n" + "="*50)
    print("Starting STREAMING Advanced ML Training (Memory Optimized)")
    print("="*50)
    
    start_time = time.time()
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    print(f"Dataset shape: {df.shape}")
    
    # Validate target column exists
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in data")
    
    # Prepare data
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    # Check if we have enough data
    if len(X) < 10:
        raise ValueError("Dataset too small. Need at least 10 samples.")
    
    # Check if target has at least 2 classes
    unique_classes = y.nunique()
    if unique_classes < 2:
        raise ValueError(f"Target must have at least 2 classes. Found: {unique_classes}")
    
    print(f"Features: {len(X.columns)}, Classes: {unique_classes}")
    
    # One-hot encode categorical features
    X_encoded = pd.get_dummies(X, drop_first=True)
    print(f"After encoding: {X_encoded.shape[1]} features")
    
    # Scale features (important for linear models)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_encoded)
    
    # Split data (80/20 train/test split with stratification)
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.20, random_state=42, stratify=y
        )
        print(f"Train: {len(X_train)}, Test: {len(X_test)} (stratified)")
    except ValueError:
        # If stratification fails (too few samples per class), split without it
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.20, random_state=42
        )
        print(f"Train: {len(X_train)}, Test: {len(X_test)} (non-stratified)")
    
    # Yield initial metadata
    yield {
        "type": "start",
        "totalModels": 22,
        "datasetInfo": {
            "samples": len(df),
            "features": len(X.columns),
            "featuresAfterEncoding": X_encoded.shape[1],
            "classes": unique_classes,
            "trainSize": len(X_train),
            "testSize": len(X_test)
        }
    }
    
    # Get models and train ONE AT A TIME
    models = get_models()
    results = []
    successful_count = 0
    failure_count = 0
    
    print(f"\nTraining {len(models)} algorithms (ONE AT A TIME)...")
    print("-"*50)
    
    for idx, (name, model) in enumerate(models.items(), 1):
        print(f"[{idx}/{len(models)}] Training {name}...")
        
        # Train and evaluate THIS model
        result = train_and_evaluate(name, model, X_train, y_train, X_test, y_test)
        
        # Track results
        results.append(result)
        if result["status"] == "success":
            successful_count += 1
            print(f"  ✓ F1: {result['f1Score']:.4f}, Accuracy: {result['accuracy']:.4f}")
        else:
            failure_count += 1
            print(f"  ✗ Failed: {result.get('error', 'Unknown error')}")
        
        # Yield THIS model's result immediately
        yield {
            "type": "model_complete",
            "modelIndex": idx,
            "totalModels": len(models),
            "result": result
        }
        
        # CRITICAL: Force garbage collection to free memory before next model
        del model
        gc.collect()
    
    print("-"*50)
    
    # Find best model
    successful_results = [r for r in results if r["status"] == "success"]
    if not successful_results:
        yield {
            "type": "error",
            "error": "All models failed to train"
        }
        return
    
    best_model = max(successful_results, key=lambda x: x["f1Score"])
    
    total_time = (time.time() - start_time) * 1000  # Convert to ms
    
    print(f"\n🏆 Best Model: {best_model['algorithm']}")
    print(f"   F1-Score: {best_model['f1Score']:.4f}")
    print(f"   Total Time: {total_time:.0f}ms")
    print("="*50 + "\n")
    
    # Yield final summary
    yield {
        "type": "complete",
        "results": results,
        "bestModel": best_model,
        "totalTime": total_time,
        "successCount": successful_count,
        "failureCount": failure_count
    }
    
    # Final cleanup
    gc.collect()
