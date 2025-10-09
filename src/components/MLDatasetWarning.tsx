import React from 'react';
import { validateMLData } from '../utils/mlValidation';
import { prepareMLData } from '../utils/mlCommon';

interface MLDatasetWarningProps {
  data: any[];
  targetColumn: string;
  onProceedAnyway?: () => void;
}

const MLDatasetWarning: React.FC<MLDatasetWarningProps> = ({ data, targetColumn, onProceedAnyway }) => {
  // Validate the dataset
  const mlData = prepareMLData(data, targetColumn);
  const validation = validateMLData(mlData);

  // If valid, don't show warning
  if (validation.isValid && validation.warnings.length === 0) {
    return null;
  }

  // Determine severity
  const isCritical = !validation.isValid;

  return (
    <div style={{
      background: isCritical ? '#fef2f2' : '#fffbeb',
      border: `2px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '15px' }}>
        <span style={{ fontSize: '2rem' }}>
          {isCritical ? '🚫' : '⚠️'}
        </span>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: '0 0 8px 0', 
            color: isCritical ? '#991b1b' : '#92400e',
            fontSize: '1.25rem'
          }}>
            {isCritical ? 'Dataset Not Suitable for Quick ML' : 'Dataset Warning'}
          </h3>
          <p style={{ 
            margin: 0, 
            color: isCritical ? '#7f1d1d' : '#78350f',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}>
            {isCritical 
              ? 'This dataset cannot be used for classification with Quick ML.'
              : 'This dataset has some issues that may affect model performance.'
            }
          </p>
        </div>
      </div>

      {/* Dataset Info */}
      <div style={{
        background: 'white',
        borderRadius: '6px',
        padding: '12px',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <strong style={{ color: '#374151', fontSize: '0.75rem' }}>Target Column:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: '600' }}>{targetColumn}</p>
          </div>
          <div>
            <strong style={{ color: '#374151', fontSize: '0.75rem' }}>Target Type:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: '600' }}>
              {validation.targetType.charAt(0).toUpperCase() + validation.targetType.slice(1)}
            </p>
          </div>
          <div>
            <strong style={{ color: '#374151', fontSize: '0.75rem' }}>Number of Classes:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: '600' }}>{validation.numClasses}</p>
          </div>
          <div>
            <strong style={{ color: '#374151', fontSize: '0.75rem' }}>Compatible Algorithms:</strong>
            <p style={{ margin: '4px 0 0 0', color: '#1f2937', fontWeight: '600' }}>
              {validation.compatibleAlgorithms.length}/7
            </p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ 
            color: isCritical ? '#991b1b' : '#92400e',
            fontSize: '0.875rem',
            display: 'block',
            marginBottom: '8px'
          }}>
            Issues Detected:
          </strong>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: isCritical ? '#7f1d1d' : '#78350f',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            {validation.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {validation.recommendations.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ 
            color: isCritical ? '#991b1b' : '#92400e',
            fontSize: '0.875rem',
            display: 'block',
            marginBottom: '8px'
          }}>
            Recommendations:
          </strong>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: isCritical ? '#7f1d1d' : '#78350f',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            {validation.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Incompatible Algorithms */}
      {validation.incompatibleAlgorithms.length > 0 && validation.incompatibleAlgorithms.length < 7 && (
        <div style={{
          background: 'white',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '15px'
        }}>
          <strong style={{ 
            color: '#374151',
            fontSize: '0.875rem',
            display: 'block',
            marginBottom: '8px'
          }}>
            Algorithms That Will Be Skipped:
          </strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {validation.incompatibleAlgorithms.map((algo, idx) => (
              <span
                key={idx}
                style={{
                  background: '#f3f4f6',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  cursor: 'help'
                }}
                title={algo.reason}
              >
                {algo.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
        {isCritical ? (
          <>
            <div style={{ 
              flex: 1,
              background: '#fee2e2',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #fca5a5'
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#7f1d1d', fontWeight: '600' }}>
                ❌ Quick ML cannot proceed with this dataset
              </p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#991b1b' }}>
                Please use a classification dataset or wait for Advanced ML (regression support)
              </p>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={onProceedAnyway}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#d97706'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f59e0b'}
            >
              ⚠️ Proceed Anyway
            </button>
            <div style={{ 
              flex: 2,
              background: '#fef3c7',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: '#78350f',
              display: 'flex',
              alignItems: 'center'
            }}>
              Training will continue but results may be poor
            </div>
          </>
        )}
      </div>

      {/* Suggested Datasets */}
      {isCritical && (
        <div style={{
          marginTop: '15px',
          background: '#e0f2fe',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #7dd3fc'
        }}>
          <strong style={{ color: '#075985', fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>
            💡 Try These Classification Datasets:
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
            {[
              { id: '40691', name: 'Wine Quality', classes: '2' },
              { id: '61', name: 'Iris', classes: '3' },
              { id: '31', name: 'Credit', classes: '2' },
              { id: '1590', name: 'Adult Income', classes: '2' }
            ].map((dataset) => (
              <div
                key={dataset.id}
                style={{
                  background: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}
              >
                <strong style={{ color: '#0369a1' }}>OpenML {dataset.id}</strong>
                <div style={{ color: '#64748b', marginTop: '2px' }}>
                  {dataset.name} ({dataset.classes} classes)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MLDatasetWarning;
