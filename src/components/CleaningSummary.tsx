import { useState } from 'react';

const CleaningSummary = ({ items, data }: { items: { key: string, title: string }[], data: { [key: string]: any } }) => {
  const [showCommonColumns, setShowCommonColumns] = useState(false);
  const [showFilledDetails, setShowFilledDetails] = useState(false);

  // Calculate data quality score
  const calculateQualityScore = () => {
    if (!data.finalRows || !data.finalColumns) return null;
    const totalCells = data.finalRows * data.finalColumns;
    const filledCount = data.missingValuesFilled || 0;
    const qualityScore = ((totalCells - filledCount) / totalCells) * 100;
    return qualityScore.toFixed(2);
  };

  const qualityScore = calculateQualityScore();
  const getQualityColor = (score: number) => {
    if (score >= 95) return '#10b981'; // Green
    if (score >= 85) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div>
      {/* Processing Mode Indicator */}
      {data.processingMode && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: data.processingMode === 'single' ? '#e0f2fe' : '#f0fdf4',
          border: `2px solid ${data.processingMode === 'single' ? '#0ea5e9' : '#10b981'}`,
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <strong style={{ color: data.processingMode === 'single' ? '#0369a1' : '#065f46' }}>
            Processing Mode: {data.processingMode === 'single' ? 'Single Dataset' : 'Merged Datasets'}
          </strong>
        </div>
      )}

      {/* Feature Engineering Status */}
      {(data.featureType === 'wine-specific' || data.featureType === 'generic') && data.engineeredFeatures > 0 && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#d1fae5',
          border: '2px solid #10b981',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <strong style={{ color: '#065f46' }}>
            ✓ Automatic feature engineering enabled ({data.engineeredFeatures} features created)
          </strong>
        </div>
      )}


      {/* Main Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {items.map((item) => (
          <div key={item.key} className="card" style={{ textAlign: 'center' }}>
            <h4 style={{ margin: 0, color: '#666' }}>{item.title}</h4>
            <p style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#3b82f6' }}>
              {data[item.key] !== undefined ? data[item.key] : '-'}
            </p>
          </div>
        ))}
      </div>

      {/* Data Quality Score */}
      {qualityScore && (
        <div className="card" style={{ marginTop: '1rem', textAlign: 'center', backgroundColor: '#f9fafb' }}>
          <h4 style={{ margin: 0, color: '#666' }}>Data Quality Score</h4>
          <p style={{ 
            fontSize: '2.5rem', 
            margin: '0.5rem 0', 
            color: getQualityColor(parseFloat(qualityScore)),
            fontWeight: 'bold'
          }}>
            {qualityScore}%
          </p>
          <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
            {parseFloat(qualityScore) >= 95 ? '✓ Excellent' : parseFloat(qualityScore) >= 85 ? '⚠ Good' : '✗ Needs Attention'}
          </p>
        </div>
      )}

      {/* Column Breakdown */}
      {data.finalColumns && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#666' }}>Column Breakdown</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem', flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{data.commonColumns || 13}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Original</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem', flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{data.engineeredFeatures || 0}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Engineered</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem', flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{data.binnedColumnsCreated || 0}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Binned</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem', flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{data.finalColumns}</div>
              <div style={{ fontSize: '0.875rem', color: '#666' }}>Total</div>
            </div>
          </div>
        </div>
      )}

      {/* Common Columns List - Collapsible */}
      {data.commonColumnsList && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div 
            onClick={() => setShowCommonColumns(!showCommonColumns)}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h4 style={{ margin: 0, color: '#666' }}>Common Columns Found ({data.commonColumnsList.length})</h4>
            <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>{showCommonColumns ? '−' : '+'}</span>
          </div>
          {showCommonColumns && (
            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.commonColumnsList.map((col: string) => (
                <span 
                  key={col}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  {col}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Missing Values Details - Collapsible */}
      {data.filledCounts && Object.keys(data.filledCounts).length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div 
            onClick={() => setShowFilledDetails(!showFilledDetails)}
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <h4 style={{ margin: 0, color: '#666' }}>
              Missing Values Filled: {data.missingValuesFilled || 0}
              {data.missingValuesFilled === 0 && ' (Data was already complete)'}
            </h4>
            {data.missingValuesFilled > 0 && (
              <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>{showFilledDetails ? '−' : '+'}</span>
            )}
          </div>
          {showFilledDetails && data.missingValuesFilled > 0 && (
            <div style={{ marginTop: '1rem' }}>
              {Object.entries(data.filledCounts).map(([col, count]: [string, any]) => (
                count > 0 && (
                  <div key={col} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '0.5rem',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span style={{ color: '#666' }}>{col}</span>
                    <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{count}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bin Distribution Details */}
      {data.qualityBinCounts && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#666' }}>Quality Bin Distribution</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
              <strong>Low (≤5):</strong> {data.qualityBinCounts.low}
            </div>
            <div style={{ flex: 1, minWidth: '150px', padding: '0.5rem', backgroundColor: '#dbeafe', borderRadius: '0.5rem' }}>
              <strong>Medium (5-6):</strong> {data.qualityBinCounts.medium}
            </div>
            <div style={{ flex: 1, minWidth: '150px', padding: '0.5rem', backgroundColor: '#d1fae5', borderRadius: '0.5rem' }}>
              <strong>High (&gt;6):</strong> {data.qualityBinCounts.high}
            </div>
          </div>
        </div>
      )}

      {data.alcoholBinCounts && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#666' }}>Alcohol Bin Distribution</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px', padding: '0.5rem', backgroundColor: '#fce7f3', borderRadius: '0.5rem' }}>
              <strong>Very Low (≤10):</strong> {data.alcoholBinCounts.very_low}
            </div>
            <div style={{ flex: 1, minWidth: '150px', padding: '0.5rem', backgroundColor: '#e0e7ff', borderRadius: '0.5rem' }}>
              <strong>Low (10-12):</strong> {data.alcoholBinCounts.low}
            </div>
            <div style={{ flex: 1, minWidth: '150px', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '0.5rem' }}>
              <strong>Medium (12-14):</strong> {data.alcoholBinCounts.medium}
            </div>
            <div style={{ flex: 1, minWidth: '150px', padding: '0.5rem', backgroundColor: '#fed7aa', borderRadius: '0.5rem' }}>
              <strong>High (&gt;14):</strong> {data.alcoholBinCounts.high}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningSummary;
