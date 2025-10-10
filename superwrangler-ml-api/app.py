from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ml_engine import train_all_models, train_all_models_streaming
import json

app = Flask(__name__)
CORS(app)  # Allow requests from SuperWrangler frontend

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to confirm API is running."""
    return jsonify({"status": "ok", "message": "SuperWrangler ML API is running"}), 200

@app.route("/api/algorithms", methods=["GET"])
def get_algorithms():
    """
    Returns the list of ADVANCED algorithms only (15 total).
    Excludes algorithms already available in Quick ML (browser-based).
    """
    algorithms = [
        # Advanced Linear Models (3)
        "Ridge Classifier", "SGD Classifier", "Perceptron",
        # Advanced Tree Models (2)
        "Extra Tree", "Extra Trees Ensemble",
        # Boosting Models (6) - The power algorithms
        "AdaBoost", "Gradient Boosting", "Histogram Gradient Boosting",
        "XGBoost", "LightGBM", "CatBoost",
        # Ensemble Models (3)
        "Bagging Classifier", "Voting Classifier", "Stacking Classifier",
        # SVM (1)
        "Linear SVC"
    ]
    excluded_from_advanced = [
        "Logistic Regression", "Decision Tree", "Random Forest",
        "K-Nearest Neighbors", "Gaussian Naive Bayes", "SVC (RBF)", 
        "Multi-Layer Perceptron"
    ]
    return jsonify({
        "algorithms": algorithms, 
        "count": len(algorithms),
        "note": "Advanced ML only. Basic models available in Quick ML.",
        "excludedModels": excluded_from_advanced
    }), 200

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


@app.route("/api/train-stream", methods=["POST"])
def train_models_stream():
    """
    Streams training results as each model completes using Server-Sent Events.
    MEMORY OPTIMIZED: Processes one model at a time with garbage collection.
    """
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
        """Generator that yields SSE events for each model completion."""
        try:
            print("[STREAM] Starting memory-optimized model training stream...")
            # Stream results as they complete (ONE AT A TIME)
            for event_data in train_all_models_streaming(data, target_column):
                event = f"data: {json.dumps(event_data)}\n\n"
                print(f"[STREAM] Yielding event type: {event_data.get('type')}")
                yield event
            
            print("[STREAM] Stream completed successfully")
                
        except Exception as e:
            print(f"[STREAM ERROR] {str(e)}")
            error_event = f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
            yield error_event
    
    # Create response with proper SSE headers
    response = Response(generate(), mimetype='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    response.headers['X-Accel-Buffering'] = 'no'  # Disable Nginx buffering
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    
    return response


if __name__ == "__main__":
    print("=" * 50)
    print("SuperWrangler ML API Starting (MEMORY OPTIMIZED)...")
    print("=" * 50)
    print("Health Check:    http://127.0.0.1:5000/api/health")
    print("Algorithms:      http://127.0.0.1:5000/api/algorithms")
    print("Train (Batch):   POST http://127.0.0.1:5000/api/train")
    print("Train (Stream):  POST http://127.0.0.1:5000/api/train-stream")
    print("=" * 50)
    print("Optimizations:")
    print("  • 3-fold CV (down from 5)")
    print("  • Sequential processing (n_jobs=1)")
    print("  • Reduced estimators (30-70% reduction)")
    print("  • Garbage collection after each model")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=True)
