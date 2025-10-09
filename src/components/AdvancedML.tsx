import React, { useState, useEffect } from 'react';
import { trainAdvancedML, checkAPIHealth } from '../utils/mlApi';
import type { MLSummary } from '../types/ml';

interface AdvancedMLProps {
  data: any[];
  targetColumn: string;
  onComplete: (results: MLSummary) => void;
  onBack: () => void;
}

const AdvancedML: React.FC<AdvancedMLProps> = ({
  data,
  targetColumn,
  onComplete,
  onBack
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check API health on mount
    checkAPIHealth().then(isHealthy => {
      setApiStatus(isHealthy ? 'online' : 'offline');
    });
  }, []);

  const handleStartTraining = async () => {
    setIsTraining(true);
    setError(null);
    setProgressMessage('Initializing...');

    try {
      const results = await trainAdvancedML(data, targetColumn, setProgressMessage);
      onComplete(results);
    } catch (err) {
      console.error('Training error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsTraining(false);
      setProgressMessage('');
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#6366f1', fontSize: '1.5rem' }}>🎯 Advanced ML - Python Backend</h3>
        <button 
          onClick={onBack}
          disabled={isTraining}
          style={{
            padding: '8px 16px',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isTraining ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            opacity: isTraining ? 0.5 : 1
          }}
          onMouseEnter={(e) => !isTraining && (e.currentTarget.style.background = '#4b5563')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#6b7280')}
        >
          ← Back to Mode Selection
        </button>
      </div>

      {/* API Status */}
      <div style={{ 
        background: apiStatus === 'online' ? '#ecfdf5' : apiStatus === 'offline' ? '#fef2f2' : '#f3f4f6',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '20px',
        border: `1px solid ${apiStatus === 'online' ? '#10b981' : apiStatus === 'offline' ? '#ef4444' : '#d1d5db'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>
            {apiStatus === 'checking' && '⏳'}
            {apiStatus === 'online' && '✅'}
            {apiStatus === 'offline' && '❌'}
          </span>
          <div>
            <strong style={{ color: apiStatus === 'online' ? '#059669' : apiStatus === 'offline' ? '#991b1b' : '#374151' }}>
              API Status: {apiStatus === 'checking' ? 'Checking...' : apiStatus === 'online' ? 'Online' : 'Offline'}
            </strong>
            {apiStatus === 'offline' && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#991b1b' }}>
                The Advanced ML server is not running. Please start it with: <code>python app.py</code>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Info */}
      <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong style={{ color: '#374151' }}>Target Column:</strong>
            <p style={{ margin: '4px 0', color: '#6366f1', fontWeight: '600' }}>{targetColumn}</p>
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Dataset Size:</strong>
            <p style={{ margin: '4px 0', color: '#6b7280' }}>{data.length} rows</p>
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Algorithms:</strong>
            <p style={{ margin: '4px 0', color: '#6b7280' }}>22 models</p>
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Estimated Time:</strong>
            <p style={{ margin: '4px 0', color: '#6b7280' }}>1-3 minutes</p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#fee2e2', 
          border: '1px solid #ef4444', 
          color: '#991b1b', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Training Button or Progress */}
      {!isTraining ? (
        <button 
          onClick={handleStartTraining}
          disabled={apiStatus !== 'online'}
          style={{
            width: '100%',
            padding: '16px',
            background: apiStatus === 'online' ? '#6366f1' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.125rem',
            fontWeight: '600',
            cursor: apiStatus === 'online' ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseEnter={(e) => apiStatus === 'online' && (e.currentTarget.style.background = '#4f46e5')}
          onMouseLeave={(e) => apiStatus === 'online' && (e.currentTarget.style.background = '#6366f1')}
        >
          <span>🚀</span>
          <span>Start Training (22 Algorithms)</span>
        </button>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #6366f1', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#6366f1', margin: '10px 0' }}>
            Training in progress...
          </p>
          <p style={{ fontSize: '1rem', color: '#6b7280', margin: '10px 0' }}>
            {progressMessage || 'Processing...'}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', margin: '10px 0' }}>
            This may take 1-3 minutes depending on dataset size
          </p>
        </div>
      )}

      {/* Info Box */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#eff6ff', 
        borderRadius: '6px',
        border: '1px solid #3b82f6'
      }}>
        <strong style={{ color: '#1e40af', fontSize: '0.875rem' }}>💡 Advanced ML Features:</strong>
        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#1e40af', fontSize: '0.875rem', lineHeight: '1.6' }}>
          <li>22 state-of-the-art algorithms including XGBoost, LightGBM, and CatBoost</li>
          <li>Automatic feature scaling and encoding</li>
          <li>Cross-validation for robust performance estimates</li>
          <li>Comprehensive metrics and confusion matrices</li>
        </ul>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdvancedML;
