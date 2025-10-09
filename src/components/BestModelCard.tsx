import React from 'react';
import type { MLResult } from '../types/ml';

interface BestModelCardProps {
  model: MLResult;
}

const BestModelCard: React.FC<BestModelCardProps> = ({ model }) => {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
      padding: '25px', 
      borderRadius: '12px', 
      color: 'white',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <span style={{ fontSize: '2rem' }}>🏆</span>
        <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Best Model: {model.algorithm}</h4>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>F1-Score</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>
            {(model.f1Score * 100).toFixed(2)}%
          </p>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Accuracy</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>
            {(model.accuracy * 100).toFixed(2)}%
          </p>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Precision</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>
            {(model.precision * 100).toFixed(2)}%
          </p>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '12px', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Recall</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '1.75rem', fontWeight: 'bold' }}>
            {(model.recall * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '15px', borderRadius: '8px' }}>
        <h5 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '600' }}>Cross-Validation</h5>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>CV F1 Mean</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
              {(model.cvF1Mean * 100).toFixed(2)}%
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>CV F1 Std</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
              ±{(model.cvF1Std * 100).toFixed(2)}%
            </p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>Training Time</p>
            <p style={{ margin: '3px 0 0 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
              {model.trainingTime.toFixed(0)}ms
            </p>
          </div>
          {model.rocAuc !== null && (
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>ROC-AUC</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '1.25rem', fontWeight: 'bold' }}>
                {(model.rocAuc * 100).toFixed(2)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {Object.keys(model.hyperparameters).length > 0 && (
        <div style={{ marginTop: '15px', background: 'rgba(255, 255, 255, 0.15)', padding: '15px', borderRadius: '8px' }}>
          <h5 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '600' }}>Hyperparameters</h5>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            {Object.entries(model.hyperparameters).map(([key, value]) => (
              <div key={key}>
                <span style={{ opacity: 0.9 }}>{key}:</span>{' '}
                <span style={{ fontWeight: '600' }}>
                  {typeof value === 'number' ? value.toFixed(3) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BestModelCard;
