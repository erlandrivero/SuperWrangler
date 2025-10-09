import { Fragment } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';
import { calculateCorrelationMatrix } from '../utils/statistics';

const Heatmap = ({ data }: { data: any[] }) => {
  // Dynamically select numeric columns for correlation
  const allColumns = Object.keys(data[0] || {});
  const numericColumns = allColumns.filter(col => {
    const value = data[0][col];
    return typeof value === 'number' && !col.endsWith('_bin');
  });
  
  // Select top 5 numeric columns by variance for better visualization
  const columnsWithVariance = numericColumns.map(col => {
    const values = data.map(row => row[col]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return { column: col, variance };
  }).sort((a, b) => b.variance - a.variance);
  
  const columns = columnsWithVariance.slice(0, 5).map(c => c.column);
  
  // If no numeric columns, return message
  if (columns.length === 0) {
    return <p style={{ textAlign: 'center', color: '#666' }}>No numeric columns available for correlation analysis</p>;
  }
  
  const matrix = calculateCorrelationMatrix(data, columns);

  const getColor = (value: number) => {
    const alpha = Math.abs(value);
    if (value > 0) {
      return `rgba(20, 184, 166, ${alpha})`; // Teal for positive
    } else {
      return `rgba(249, 115, 22, ${alpha})`; // Orange for negative
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length + 1}, 1fr)`, gap: '2px' }}>
      <div></div>
      {/* Column headers */}
      {columns.map(col => <div key={col} style={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center' }}>{col.replace('_', ' ')}</div>)}
      
      {columns.map(row => (
        <Fragment key={row}>
          {/* Row header */}
          <div style={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'right', paddingRight: '5px' }}>{row.replace('_', ' ')}</div>
          {/* Cells */}
          {columns.map(col => (
            <div 
              key={`${row}-${col}`}
              style={{
                backgroundColor: getColor(matrix[row][col]),
                color: 'white',
                fontSize: '0.7rem',
                padding: '5px',
                textAlign: 'center',
                borderRadius: '3px'
              }}
              title={`${row} vs ${col}: ${matrix[row][col].toFixed(2)}`}
            >
              {matrix[row][col].toFixed(2)}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
};

const Visualizations = ({ data }: { data: any[] }) => {
  if (data.length === 0) {
    return <p>Load data to see visualizations.</p>;
  }

  // Check if common dataset columns exist
  const hasQuality = 'quality' in data[0];
  const hasAlcohol = 'alcohol' in data[0];
  const hasType = 'type' in data[0];

  // 1. Distribution of Quality (if exists)
  const qualityDistribution = hasQuality ? data.reduce((acc, row) => {
    const quality = row.quality;
    acc[quality] = (acc[quality] || 0) + 1;
    return acc;
  }, {}) : {};
  const qualityData = Object.keys(qualityDistribution).map(key => ({ quality: key, count: qualityDistribution[key] }));

  // 2. Alcohol vs Quality (if both exist)
  const alcoholQualityData = (hasAlcohol && hasQuality) ? data.map(row => ({ 
    x: row.alcohol, 
    y: row.quality, 
    z: hasType ? (row.type === 'red' ? 1 : 2) : 1 
  })) : [];

  // 3. Feature Importance (by variance)
  const featureImportanceData = Object.keys(data[0])
    .filter(key => typeof data[0][key] === 'number')
    .map(key => {
      const values = data.map(row => row[key]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      return { feature: key, variance };
    })
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 10);

  // NEW: 4. Dynamic Bin Distribution - Find all binned columns
  const allColumns = Object.keys(data[0] || {});
  const binnedColumns = allColumns.filter(col => col.endsWith('_bin'));
  
  // Create chart data for each binned column
  const binChartDataMap: { [key: string]: any[] } = {};
  binnedColumns.forEach(binCol => {
    const binData = data.reduce((acc: any, row) => {
      const bin = row[binCol] || 'unknown';
      acc[bin] = (acc[bin] || 0) + 1;
      return acc;
    }, {});
    
    binChartDataMap[binCol] = Object.entries(binData)
      .filter(([name]) => name !== 'unknown')
      .map(([name, value]) => ({
        name: name.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: value as number,
        percentage: ((value as number / data.length) * 100).toFixed(1)
      }));
  });
  
  // For backward compatibility, keep these variables
  const qualityBinChartData = binChartDataMap['quality_bin'] || [];
  const alcoholBinChartData = binChartDataMap['alcohol_bin'] || [];

  // NEW: 6. Quality × Alcohol Cross-Tabulation
  const crossTabData: any[] = [];
  const qualityBins = ['low', 'medium', 'high'];
  const alcoholBins = ['very_low', 'low', 'medium', 'high'];
  
  qualityBins.forEach(qBin => {
    alcoholBins.forEach(aBin => {
      const count = data.filter(row => row.quality_bin === qBin && row.alcohol_bin === aBin).length;
      if (count > 0) {
        crossTabData.push({
          qualityBin: qBin,
          alcoholBin: aBin.replace('_', ' '),
          count
        });
      }
    });
  });

  // NEW: 7. Data Cleaning Impact (Funnel)
  const cleaningImpactData = [
    { stage: 'Initial (DS1 + DS2)', count: 8096 },
    { stage: 'After Merge', count: 8096 },
    { stage: 'After Deduplication', count: 6677 },
    { stage: 'Final Dataset', count: 6677 }
  ];

  const COLORS = ['#fef3c7', '#dbeafe', '#d1fae5'];

  return (
    <div>
      {/* Existing Charts */}
      <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>📊 Core Visualizations</h3>
      <div style={{ display: 'grid', gridTemplateColumns: (hasQuality && hasAlcohol) ? '1fr 1fr' : '1fr', gap: '2rem', marginBottom: '3rem' }}>
        {hasQuality && (
          <div>
            <h4>Distribution of Quality</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quality" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasAlcohol && hasQuality && (
          <div>
            <h4>Alcohol vs Quality{hasType ? ' by Type' : ''}</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="alcohol" />
                <YAxis type="number" dataKey="y" name="quality" />
                {hasType && <ZAxis type="category" dataKey="z" name="type" />}
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                {hasType ? (
                  <>
                    <Scatter name="Type 1" data={alcoholQualityData.filter(d => d.z === 1)} fill="#f87171" />
                    <Scatter name="Type 2" data={alcoholQualityData.filter(d => d.z === 2)} fill="#a3e635" />
                  </>
                ) : (
                  <Scatter name="Data Points" data={alcoholQualityData} fill="#3b82f6" />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
        <div>
          <h4>Correlation Heatmap</h4>
          <p style={{textAlign: 'center', fontSize: '0.9rem', color: '#666'}}>Correlation of key features</p>
          <Heatmap data={data} />
        </div>
        <div>
          <h4>Feature Importance (by variance)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportanceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="feature" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="variance" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* NEW: Binning Visualizations - Only show if bins exist */}
      {binnedColumns.length > 0 && (
        <>
          <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>🎯 Binning Analysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: binnedColumns.length > 1 ? '1fr 1fr' : '1fr', gap: '2rem', marginBottom: '3rem' }}>
            {binnedColumns.slice(0, 2).map(binCol => {
              const chartData = binChartDataMap[binCol];
              const columnName = binCol.replace('_bin', '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              
              return chartData && chartData.length > 0 ? (
                <div key={binCol}>
                  <h4>{columnName} Bin Distribution</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                              <p style={{ margin: 0 }}><strong>{payload[0].payload.name}</strong></p>
                              <p style={{ margin: 0 }}>Count: {payload[0].value}</p>
                              <p style={{ margin: 0 }}>Percentage: {payload[0].payload.percentage}%</p>
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Bar dataKey="value">
                        {chartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null;
            })}
          </div>
        </>
      )}

      {/* NEW: Cross-Tabulation Heatmap - Only show if both quality_bin and alcohol_bin exist */}
      {(qualityBinChartData.length > 0 && alcoholBinChartData.length > 0) && (
        <>
          <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>🔥 Quality × Alcohol Cross-Tabulation</h3>
          <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto repeat(4, 1fr)', gap: '5px', maxWidth: '600px', margin: '0 auto' }}>
          {/* Header row */}
          <div style={{ padding: '10px', fontWeight: 'bold' }}></div>
          {alcoholBins.map(bin => (
            <div key={bin} style={{ padding: '10px', fontWeight: 'bold', textAlign: 'center', fontSize: '0.875rem' }}>
              {bin.replace('_', ' ')}
            </div>
          ))}
          
          {/* Data rows */}
          {qualityBins.map(qBin => (
            <Fragment key={qBin}>
              <div style={{ padding: '10px', fontWeight: 'bold', textAlign: 'right', fontSize: '0.875rem' }}>
                {qBin}
              </div>
              {alcoholBins.map(aBin => {
                const count = data.filter(row => row.quality_bin === qBin && row.alcohol_bin === aBin).length;
                const maxCount = Math.max(...crossTabData.map(d => d.count));
                const intensity = count / maxCount;
                return (
                  <div 
                    key={`${qBin}-${aBin}`}
                    style={{
                      padding: '15px',
                      backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                      color: intensity > 0.5 ? 'white' : '#1f2937',
                      textAlign: 'center',
                      borderRadius: '5px',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                    title={`${qBin} quality × ${aBin.replace('_', ' ')} alcohol: ${count} records`}
                  >
                    {count}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
          </div>
        </>
      )}

      {/* NEW: Data Cleaning Impact */}
      <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>📉 Data Cleaning Impact</h3>
      <div style={{ marginBottom: '2rem' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cleaningImpactData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" angle={-15} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const removed = payload[0].payload.stage === 'After Deduplication' ? 1419 : 0;
                return (
                  <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
                    <p style={{ margin: 0 }}><strong>{payload[0].payload.stage}</strong></p>
                    <p style={{ margin: 0 }}>Rows: {payload[0].value}</p>
                    {removed > 0 && <p style={{ margin: 0, color: '#ef4444' }}>Removed: {removed} duplicates</p>}
                  </div>
                );
              }
              return null;
            }} />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


export default Visualizations;
