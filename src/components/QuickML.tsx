import React, { useState } from 'react';
import { prepareMLData } from '../utils/mlCommon';
import { trainQuickML } from '../utils/mlBrowser';
import { validateMLData } from '../utils/mlValidation';
import type { MLSummary } from '../types/ml';
import MLDatasetWarning from './MLDatasetWarning';

interface QuickMLProps {
  data: any[];
  targetColumn: string;
  onComplete: (results: MLSummary) => void;
  onBack: () => void;
}

const QuickML: React.FC<QuickMLProps> = ({
  data,
  targetColumn,
  onComplete,
  onBack
}) => {
  const [isTraining, setIsTraining] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 7 });
  const [showWarning, setShowWarning] = useState(true);
  const [proceedWithWarning, setProceedWithWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Prepare and validate dataset
  const mlData = prepareMLData(data, targetColumn);
  const validation = validateMLData(mlData);
  const hasIssues = !validation.isValid || validation.warnings.length > 0;

  const handleStartTraining = async () => {
    console.log('Starting training immediately');
    console.log('Setting isTraining to true');
    
    // Check validation before starting
    if (!validation.isValid) {
      setError('Dataset validation failed. Please use a classification dataset.');
      return;
    }
    
    setIsTraining(true);
    setError(null);
    
    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Prepare ML data
      const mlData = prepareMLData(data, targetColumn);
      
      console.log('About to call trainQuickML');
      // Train all algorithms
      const results = await trainQuickML(mlData, (algo, idx, total) => {
        console.log('Training progress:', algo, idx, total);
        setCurrentAlgorithm(algo);
        setProgress({ current: idx, total });
      });
      
      console.log('Training complete, calling onComplete');
      onComplete(results);
    } catch (error) {
      console.error('Training failed:', error);
      setError(error instanceof Error ? error.message : 'Training failed. Please try again.');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem' }}>⚡ Quick ML - Browser Training</h3>
        <button 
          onClick={onBack}
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
          ← Back to Mode Selection
        </button>
      </div>

      <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong style={{ color: '#374151' }}>Target Column:</strong>
            <p style={{ margin: '4px 0', color: '#10b981', fontWeight: '600' }}>{targetColumn}</p>
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Dataset Size:</strong>
            <p style={{ margin: '4px 0', color: '#6b7280' }}>{data.length} rows</p>
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Algorithms:</strong>
            <p style={{ margin: '4px 0', color: '#6b7280' }}>7 models</p>
          </div>
          <div>
            <strong style={{ color: '#374151' }}>Estimated Time:</strong>
            <p style={{ margin: '4px 0', color: '#6b7280' }}>30-60 seconds</p>
          </div>
        </div>
      </div>

      {/* Dataset Warning */}
      {hasIssues && showWarning && !proceedWithWarning && (
        <MLDatasetWarning
          data={data}
          targetColumn={targetColumn}
          onProceedAnyway={() => {
            if (!validation.isValid) {
              // Critical error - don't allow proceeding
              return;
            }
            setProceedWithWarning(true);
            setShowWarning(false);
          }}
        />
      )}

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
      {(() => { console.log('Render: isTraining =', isTraining); return null; })()}
      {!isTraining ? (
        <button 
          type="button"
          onClick={(e) => {
            console.log('Button clicked!', e);
            handleStartTraining();
          }}
          disabled={!validation.isValid}
          style={{
            width: '100%',
            padding: '16px',
            background: validation.isValid ? '#10b981' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.125rem',
            fontWeight: '600',
            cursor: validation.isValid ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            opacity: validation.isValid ? 1 : 0.6
          }}
          onMouseEnter={(e) => validation.isValid && (e.currentTarget.style.background = '#059669')}
          onMouseLeave={(e) => validation.isValid && (e.currentTarget.style.background = '#10b981')}
        >
          <span>🚀</span>
          <span>Start Training (7 Algorithms)</span>
        </button>
      ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                width: '50px', 
                height: '50px', 
                border: '4px solid #e5e7eb', 
                borderTop: '4px solid #10b981', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }} />
              <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#10b981', margin: '10px 0' }}>
                Training in progress...
              </p>
              <p style={{ fontSize: '1rem', color: '#6b7280', margin: '10px 0' }}>
                {currentAlgorithm || 'Preparing data...'}
              </p>
              <div style={{ 
                background: '#e5e7eb', 
                height: '8px', 
                borderRadius: '4px', 
                overflow: 'hidden',
                margin: '15px 0'
              }}>
                <div style={{
                  background: '#10b981',
                  height: '100%',
                  width: `${(progress.current / progress.total) * 100}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                {progress.current} of {progress.total} algorithms completed
              </p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '10px' }}>
                This may take 30-60 seconds depending on dataset size
              </p>
            </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #3b82f6' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
          <strong>💡 Tip:</strong> Quick ML runs entirely in your browser. Your data never leaves your computer!
        </p>
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

export default QuickML;
