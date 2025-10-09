import pandas as pd
import time
import numpy as np
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
    """Returns a dictionary of all models to test (22 total)."""
    
    # Define base estimators for ensemble models
    base_lr = LogisticRegression(max_iter=1000, random_state=42)
    base_rf = RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1)
    base_nb = GaussianNB()
    
    return {
        # Linear Models (4)
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Ridge Classifier": RidgeClassifier(random_state=42),
        "SGD Classifier": SGDClassifier(random_state=42, max_iter=1000),
        "Perceptron": Perceptron(random_state=42, max_iter=1000),
        
        # Tree-Based Models (4)
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Extra Tree": ExtraTreeClassifierWrapper(random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        "Extra Trees Ensemble": ExtraTreesClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        
        # Boosting Models (6)
        "AdaBoost": AdaBoostClassifier(n_estimators=50, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
        "Histogram Gradient Boosting": HistGradientBoostingClassifier(random_state=42),
        "XGBoost": XGBClassifier(n_estimators=100, random_state=42, use_label_encoder=False, eval_metric='logloss', n_jobs=-1, verbosity=0),
        "LightGBM": LGBMClassifier(n_estimators=100, random_state=42, n_jobs=-1, verbose=-1),
        "CatBoost": CatBoostClassifier(iterations=100, random_state=42, verbose=0),
        
        # Ensemble Models (3)
        "Bagging Classifier": BaggingClassifier(n_estimators=50, random_state=42, n_jobs=-1),
        "Voting Classifier": VotingClassifier(
            estimators=[('lr', base_lr), ('rf', base_rf), ('nb', base_nb)],
            voting='soft',
            n_jobs=-1
        ),
        "Stacking Classifier": StackingClassifier(
            estimators=[('lr', base_lr), ('rf', base_rf), ('nb', base_nb)],
            final_estimator=LogisticRegression(max_iter=1000),
            n_jobs=-1
        ),
        
        # Support Vector Machines (2)
        "SVC (RBF)": SVC(random_state=42, probability=True),
        "Linear SVC": LinearSVC(random_state=42, dual=False, max_iter=2000),
        
        # Other Models (3)
        "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
        "Gaussian Naive Bayes": GaussianNB(),
        "Multi-Layer Perceptron": MLPClassifier(hidden_layer_sizes=(100,), random_state=42, max_iter=1000),
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
        
        # Cross-validation
        try:
            cv_scores = cross_val_score(model, X_train, y_train, cv=min(5, len(X_train) // 2), 
                                       scoring='f1_weighted', n_jobs=-1)
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
