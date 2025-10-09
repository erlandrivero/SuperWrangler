from flask import Flask, request, jsonify
from flask_cors import CORS
from ml_engine import train_all_models

app = Flask(__name__)
CORS(app)  # Allow requests from SuperWrangler frontend

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to confirm API is running."""
    return jsonify({"status": "ok", "message": "SuperWrangler ML API is running"}), 200

@app.route("/api/algorithms", methods=["GET"])
def get_algorithms():
    """Returns the list of available algorithms."""
    algorithms = [
        "Logistic Regression", "Ridge Classifier", "SGD Classifier", "Perceptron",
        "Decision Tree", "Extra Tree", "Random Forest", "Extra Trees Ensemble",
        "AdaBoost", "Gradient Boosting", "Histogram Gradient Boosting",
        "XGBoost", "LightGBM", "CatBoost",
        "Bagging Classifier", "Voting Classifier", "Stacking Classifier",
        "SVC (RBF)", "Linear SVC",
        "K-Nearest Neighbors", "Gaussian Naive Bayes", "Multi-Layer Perceptron"
    ]
    return jsonify({"algorithms": algorithms, "count": len(algorithms)}), 200

@app.route("/api/train", methods=["POST"])
def train_models():
    """Receives data, trains models, and returns results."""
    try:
        payload = request.json
        
        if not payload:
            return jsonify({"error": "No JSON payload provided"}), 400
            
        data = payload.get("data")
        target_column = payload.get("targetColumn")
        
        if not data or not target_column:
            return jsonify({"error": "Missing 'data' or 'targetColumn' in request"}), 400
        
        if not isinstance(data, list) or len(data) == 0:
            return jsonify({"error": "Data must be a non-empty list"}), 400
            
        # Train models
        results = train_all_models(data, target_column)
        
        return jsonify(results), 200
        
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Training failed: {str(e)}"}), 500

if __name__ == "__main__":
    print("=" * 50)
    print("SuperWrangler ML API Starting...")
    print("=" * 50)
    print("Health Check: http://127.0.0.1:5000/api/health")
    print("Algorithms:   http://127.0.0.1:5000/api/algorithms")
    print("Train:        POST http://127.0.0.1:5000/api/train")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
