import React, { useState } from 'react';
import type { MLSummary } from '../types/ml';
import BestModelCard from './BestModelCard';
import ConfusionMatrix from './ConfusionMatrix';
import FeatureImportance from './FeatureImportance';

interface ModelResultsProps {
  results: MLSummary;
  onReset: () => void;
}

const ModelResults: React.FC<ModelResultsProps> = ({ results, onReset }) => {
  const [sortBy, setSortBy] = useState<'f1Score' | 'accuracy' | 'algorithm'>('f1Score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showConfusionMatrix, setShowConfusionMatrix] = useState(false);
  const [showFeatureImportance, setShowFeatureImportance] = useState(false);

  const sortedResults = [...results.results].sort((a, b) => {
    if (sortBy === 'algorithm') {
      return sortOrder === 'asc' 
        ? a.algorithm.localeCompare(b.algorithm)
        : b.algorithm.localeCompare(a.algorithm);
    }
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (column: 'f1Score' | 'accuracy' | 'algorithm') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem' }}>📊 ML Results</h3>
        <button 
          onClick={onReset}
          style={{
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#6b7280'}
        >
          🔄 Train New Model
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '6px', border: '1px solid #10b981' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>Total Time</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {(results.totalTime / 1000).toFixed(2)}s
          </p>
        </div>
        <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '6px', border: '1px solid #10b981' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>Successful</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {results.successCount}/{results.results.length}
          </p>
        </div>
        <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '6px', border: '1px solid #10b981' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>Best Model</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.125rem', fontWeight: 'bold', color: '#10b981' }}>
            {results.bestModel.algorithm}
          </p>
        </div>
        <div style={{ background: '#ecfdf5', padding: '15px', borderRadius: '6px', border: '1px solid #10b981' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#059669', fontWeight: '600' }}>Best F1-Score</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {(results.bestModel.f1Score * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Performance Context Info */}
      {results.bestModel.confusionMatrix.length > 2 && (
        <div style={{ 
          background: '#eff6ff', 
          border: '2px solid #3b82f6', 
          borderRadius: '8px', 
          padding: '15px', 
          marginBottom: '20px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>💡</span>
            <div>
              <strong style={{ color: '#1e40af', fontSize: '1rem' }}>Multi-Class Classification Detected</strong>
              <p style={{ margin: '8px 0 0 0', color: '#1e40af', fontSize: '0.875rem', lineHeight: '1.5' }}>
                Your dataset has <strong>{results.bestModel.confusionMatrix.length} classes</strong>, making this a challenging multi-class problem. 
                Scores of <strong>30-50%</strong> are actually <strong>good performance</strong> (random guessing would be ~{(100 / results.bestModel.confusionMatrix.length).toFixed(1)}%). 
                For comparison: binary classification (2 classes) typically achieves 70-90% accuracy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Best Model Card */}
      <BestModelCard model={results.bestModel} />

      {/* Results Table */}
      <div style={{ marginTop: '25px' }}>
        <h4 style={{ marginBottom: '15px', color: '#374151' }}>All Models Comparison</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th 
                  onClick={() => handleSort('algorithm')}
                  style={{ padding: '12px', textAlign: 'left', cursor: 'pointer', fontWeight: '600', color: '#374151' }}
                >
                  Algorithm {sortBy === 'algorithm' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('f1Score')}
                  style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: '600', color: '#374151' }}
                >
                  F1-Score {sortBy === 'f1Score' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('accuracy')}
                  style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: '600', color: '#374151' }}
                >
                  Accuracy {sortBy === 'accuracy' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Precision</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Recall</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Training Time</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result, idx) => (
                <tr 
                  key={idx}
                  style={{ 
                    borderBottom: '1px solid #e5e7eb',
                    background: result.algorithm === results.bestModel.algorithm ? '#ecfdf5' : 'white'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: result.algorithm === results.bestModel.algorithm ? '600' : 'normal' }}>
                    {result.algorithm === results.bestModel.algorithm && '🏆 '}
                    {result.algorithm}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                    {(result.f1Score * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {(result.accuracy * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {(result.precision * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {(result.recall * 100).toFixed(2)}%
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                    {result.trainingTime.toFixed(0)}ms
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {result.status === 'success' ? (
                      <span style={{ color: '#10b981', fontWeight: '600', fontSize: '1.125rem' }}>✓</span>
                    ) : (
                      <span 
                        style={{ color: '#ef4444', fontWeight: '600', fontSize: '1.125rem', cursor: 'help' }}
                        title={result.error || 'Training failed'}
                      >
                        ✗
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix Toggle */}
      <div style={{ marginTop: '25px' }}>
        <button
          onClick={() => setShowConfusionMatrix(!showConfusionMatrix)}
          style={{
            padding: '12px 20px',
            background: showConfusionMatrix ? '#059669' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.background = showConfusionMatrix ? '#059669' : '#10b981'}
        >
          <span>{showConfusionMatrix ? '▼' : '▶'}</span>
          <span>{showConfusionMatrix ? 'Hide' : 'Show'} Confusion Matrix</span>
        </button>
        
        {showConfusionMatrix && (
          <ConfusionMatrix matrix={results.bestModel.confusionMatrix} algorithm={results.bestModel.algorithm} />
        )}
      </div>

      {/* Feature Importance Toggle */}
      {results.bestModel.featureImportance && (
        <div style={{ marginTop: '25px' }}>
          <button
            onClick={() => setShowFeatureImportance(!showFeatureImportance)}
            style={{
              padding: '12px 20px',
              background: showFeatureImportance ? '#059669' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '15px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.background = showFeatureImportance ? '#059669' : '#10b981'}
          >
            <span>{showFeatureImportance ? '▼' : '▶'}</span>
            <span>{showFeatureImportance ? 'Hide' : 'Show'} Feature Importance</span>
          </button>
          
          {showFeatureImportance && (
            <FeatureImportance importance={results.bestModel.featureImportance} />
          )}
        </div>
      )}
    </div>
  );
};

export default ModelResults;
