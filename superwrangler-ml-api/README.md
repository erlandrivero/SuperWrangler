# SuperWrangler ML API

Python Flask backend for Advanced ML capabilities with 22+ algorithms.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the API
```bash
python app.py
```

The API will start on `http://127.0.0.1:5000`

## 📡 API Endpoints

### Health Check
```bash
GET /api/health
```
Returns: `{"status": "ok", "message": "SuperWrangler ML API is running"}`

### Get Algorithms
```bash
GET /api/algorithms
```
Returns: List of 22 available algorithms

### Train Models
```bash
POST /api/train
Content-Type: application/json

{
  "data": [
    {"feature1": 1.0, "feature2": 2.0, "target": 0},
    {"feature1": 3.0, "feature2": 4.0, "target": 1}
  ],
  "targetColumn": "target"
}
```

Returns: Training results with metrics for all algorithms

## 🧪 Testing

### Test Health Check
```bash
curl http://127.0.0.1:5000/api/health
```

### Test Algorithms List
```bash
curl http://127.0.0.1:5000/api/algorithms
```

### Test Training (Sample Data)
```bash
curl -X POST -H "Content-Type: application/json" \
-d '{"data": [{"a":1, "b":2, "target":0}, {"a":3, "b":4, "target":1}], "targetColumn": "target"}' \
http://127.0.0.1:5000/api/train
```

## 📦 Project Structure

```
superwrangler-ml-api/
├── app.py              # Flask application with routes
├── ml_engine.py        # ML training logic
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## 🔧 Technologies

- **Flask**: Web framework
- **scikit-learn**: ML algorithms
- **XGBoost, LightGBM, CatBoost**: Gradient boosting libraries
- **pandas**: Data manipulation
- **numpy**: Numerical computing

## 📊 Algorithms (22+)

### Linear Models (4)
- Logistic Regression
- Ridge Classifier
- SGD Classifier
- Perceptron

### Tree-Based (4)
- Decision Tree
- Extra Tree
- Random Forest
- Extra Trees Ensemble

### Boosting (6)
- AdaBoost
- Gradient Boosting
- Histogram Gradient Boosting
- XGBoost
- LightGBM
- CatBoost

### Ensemble (3)
- Bagging Classifier
- Voting Classifier
- Stacking Classifier

### SVM (2)
- SVC (RBF)
- Linear SVC

### Other (3)
- K-Nearest Neighbors
- Gaussian Naive Bayes
- Multi-Layer Perceptron

## 🔗 Integration with SuperWrangler

The frontend (React) sends cleaned data to this API for training. Results are displayed in the SuperWrangler UI.

## 📝 Status

**Prompt 1**: ✅ API Structure Complete
- Flask app running
- Health check working
- Placeholder training endpoint

**Next Steps**: Implement actual ML algorithms (Prompts 2-6)
