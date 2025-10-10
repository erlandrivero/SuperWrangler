import React from 'react';
import { prepareMLData } from '../utils/mlCommon';
import { validateMLData } from '../utils/mlValidation';

interface MLModeSelectorProps {
  onSelectMode: (mode: 'quick' | 'advanced') => void;
  datasetSize: number;
  data: any[];
  targetColumn: string;
}

const MLModeSelector: React.FC<MLModeSelectorProps> = ({
  onSelectMode,
  datasetSize,
  data,
  targetColumn
}) => {
  // Validate dataset for Quick ML
  const mlData = prepareMLData(data, targetColumn);
  const validation = validateMLData(mlData);
  const isQuickMLCompatible = validation.isValid && validation.compatibleAlgorithms.length > 0;
  
  // Recommend Quick ML based on multiple factors
  const featureCount = mlData.featureNames.length;
  const recommendQuick = 
    isQuickMLCompatible && 
    datasetSize < 10000 && // Increased from 1000 to 10000
    featureCount < 50 && // Not too many features
    validation.targetType !== 'regression'; // Not regression

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', margin: '20px 0' }}>
      <h3 style={{ marginBottom: '20px', color: '#333', fontSize: '1.5rem' }}>🤖 Choose Machine Learning Mode</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Quick ML Card */}
        <div style={{ 
          border: '2px solid #10b981', 
          borderRadius: '8px', 
          padding: '20px', 
          transition: 'all 0.3s',
          cursor: 'pointer',
          background: recommendQuick ? '#ecfdf5' : 'white'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '32px' }}>⚡</span>
            <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#10b981' }}>Quick ML</h4>
          </div>
          
          <div style={{ marginBottom: '15px', color: '#555' }}>
            <p style={{ margin: '8px 0', fontWeight: 'bold' }}>7 algorithms</p>
            <p style={{ margin: '8px 0' }}>Instant results</p>
            <p style={{ margin: '8px 0' }}>Runs in browser</p>
            <p style={{ margin: '8px 0' }}>Data stays local</p>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '15px', padding: '10px', background: '#f9fafb', borderRadius: '4px' }}>
            <small>Random Forest, Decision Tree, KNN, Naive Bayes, Logistic Regression, SVM, Neural Network</small>
          </div>

          {/* Always show a banner for Quick ML */}
          {!isQuickMLCompatible ? (
            <div style={{ 
              background: '#fee2e2', 
              border: '1px solid #ef4444',
              color: '#991b1b', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              marginBottom: '15px',
              fontWeight: '500',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>⚠️</span>
              <span>Not recommended for your dataset</span>
            </div>
          ) : recommendQuick ? (
            <div style={{ 
              background: '#d1fae5', 
              border: '1px solid #10b981',
              color: '#065f46', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              marginBottom: '15px',
              fontWeight: '500',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>✨</span>
              <span>Recommended for your dataset</span>
            </div>
          ) : (
            <div style={{ 
              background: '#f3f4f6', 
              border: '1px solid #d1d5db',
              color: '#6b7280', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              marginBottom: '15px',
              fontWeight: '500',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>ℹ️</span>
              <span>Not recommended for your dataset</span>
            </div>
          )}

          <button 
            onClick={() => onSelectMode('quick')}
            disabled={!isQuickMLCompatible}
            style={{
              width: '100%',
              padding: '12px',
              background: isQuickMLCompatible ? '#10b981' : '#d1d5db',
              color: isQuickMLCompatible ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isQuickMLCompatible ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (isQuickMLCompatible) e.currentTarget.style.background = '#059669';
            }}
            onMouseLeave={(e) => {
              if (isQuickMLCompatible) e.currentTarget.style.background = '#10b981';
            }}
          >
            {isQuickMLCompatible ? 'Start Quick ML' : 'Not Compatible'}
          </button>
        </div>

        {/* Advanced ML Card */}
        <div style={{ 
          border: '2px solid #6366f1', 
          borderRadius: '8px', 
          padding: '20px',
          background: 'white',
          transition: 'all 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '32px' }}>🎯</span>
            <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#6366f1' }}>Advanced ML</h4>
          </div>
          
          <div style={{ marginBottom: '15px', color: '#555' }}>
            <p style={{ margin: '8px 0', fontWeight: 'bold' }}>15 advanced algorithms</p>
            <p style={{ margin: '8px 0' }}>1-3 minutes</p>
            <p style={{ margin: '8px 0' }}>Best accuracy</p>
            <p style={{ margin: '8px 0' }}>Includes XGBoost, LightGBM</p>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '15px', padding: '10px', background: '#f9fafb', borderRadius: '4px' }}>
            <small>Advanced-only algorithms: Gradient Boosting, XGBoost, LightGBM, CatBoost, AdaBoost, Extra Trees, Stacking, and more (excludes Quick ML models)</small>
          </div>

          {/* Recommend Advanced ML for larger datasets, complex problems, or regression */}
          {(!isQuickMLCompatible && validation.targetType === 'regression') || 
           datasetSize >= 5000 || 
           featureCount >= 30 || 
           validation.numClasses > 5 ? (
            <div style={{ 
              background: '#e0e7ff', 
              border: '1px solid #6366f1',
              color: '#3730a3', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              marginBottom: '15px',
              fontWeight: '500',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>✨</span>
              <span>Recommended for your dataset</span>
            </div>
          ) : !recommendQuick && isQuickMLCompatible ? (
            <div style={{ 
              background: '#e0e7ff', 
              border: '1px solid #6366f1',
              color: '#3730a3', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              marginBottom: '15px',
              fontWeight: '500',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>✨</span>
              <span>Recommended for your dataset</span>
            </div>
          ) : (
            <div style={{ 
              background: '#f3f4f6', 
              border: '1px solid #d1d5db',
              color: '#6b7280', 
              padding: '8px 12px', 
              borderRadius: '4px', 
              fontSize: '0.8rem',
              marginBottom: '15px',
              fontWeight: '500',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.9rem' }}>ℹ️</span>
              <span>Not recommended for your dataset</span>
            </div>
          )}

          <button 
            onClick={() => onSelectMode('advanced')}
            style={{
              width: '100%',
              padding: '12px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4f46e5'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#6366f1'}
          >
            Start Advanced ML
          </button>
        </div>
      </div>
    </div>
  );
};

export default MLModeSelector;
