from flask import Flask, request, jsonify
from flask_cors import CORS
from ml_engine import train_all_models

app = Flask(__name__)
# Enable CORS for all origins (public API)
CORS(app)

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
    """Receives data, trains models, and returns results (non-streaming)."""
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
            
        # Train models (all at once)
        results = train_all_models(data, target_column)
        
        return jsonify(results), 200
        
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid data: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Training failed: {str(e)}"}), 500


@app.route("/api/train-stream", methods=["POST"])
def train_models_stream():
    """Streams training results as each model completes using Server-Sent Events."""
    import json
    from ml_engine import train_all_models_streaming
    
    # Get request data before entering generator
    payload = request.get_json()
    if not payload:
        return jsonify({"error": "No JSON payload provided"}), 400
        
    data = payload.get("data")
    target_column = payload.get("targetColumn")
    
    if not data or not target_column:
        return jsonify({"error": "Missing 'data' or 'targetColumn' in request"}), 400
    
    if not isinstance(data, list) or len(data) == 0:
        return jsonify({"error": "Data must be a non-empty list"}), 400
    
    def generate():
        try:
            # Stream results as they complete
            for result in train_all_models_streaming(data, target_column):
                yield f"data: {json.dumps(result)}\n\n"
                
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
    
    response = app.response_class(generate(), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Access-Control-Allow-Origin'] = request.headers.get('Origin', '*')
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

if __name__ == "__main__":
    print("=" * 50)
    print("SuperWrangler ML API Starting...")
    print("=" * 50)
    print("Health Check: http://127.0.0.1:5000/api/health")
    print("Algorithms:   http://127.0.0.1:5000/api/algorithms")
    print("Train:        POST http://127.0.0.1:5000/api/train")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
