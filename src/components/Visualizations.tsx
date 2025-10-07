import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { calculateCorrelationMatrix } from '../utils/statistics';

const Heatmap = ({ data }: { data: any[] }) => {
  const columns = ['quality', 'alcohol', 'sulphates', 'volatile_acidity', 'density'];
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
      {/* Empty top-left corner */}
      <div></div>
      {/* Column headers */}
      {columns.map(col => <div key={col} style={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'center' }}>{col.replace('_', ' ')}</div>)}
      
      {columns.map(row => (
        <>
          {/* Row header */}
          <div key={row} style={{ fontWeight: 'bold', fontSize: '0.8rem', textAlign: 'right', paddingRight: '5px' }}>{row.replace('_', ' ')}</div>
          {/* Cells */}
          {columns.map(col => (
            <div 
              key={`${row}-${col}`}
              style={{
                backgroundColor: getColor(matrix[row][col]),
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '3px',
                fontSize: '0.9rem'
              }}
              title={`${row} vs ${col}: ${matrix[row][col].toFixed(2)}`}
            >
              {matrix[row][col].toFixed(1)}
            </div>
          ))}
        </>
      ))}
    </div>
  );
};

const Visualizations = ({ data }: { data: any[] }) => {
  if (data.length === 0) {
    return <p>Load data to see visualizations.</p>;
  }

  // 1. Distribution of Quality
  const qualityDistribution = data.reduce((acc, row) => {
    const quality = row.quality;
    acc[quality] = (acc[quality] || 0) + 1;
    return acc;
  }, {});
  const qualityData = Object.keys(qualityDistribution).map(key => ({ quality: key, count: qualityDistribution[key] }));

  // 2. Alcohol vs Quality
  const alcoholQualityData = data.map(row => ({ x: row.alcohol, y: row.quality, z: row.type === 'red' ? 1 : 2 }));

  // 4. Feature Importance (by variance)
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div>
        <h3>Distribution of Quality</h3>
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
      <div>
        <h3>Alcohol vs Quality</h3>
        <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="alcohol" />
                <YAxis type="number" dataKey="y" name="quality" />
                <ZAxis type="category" dataKey="z" name="type" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="Red" data={alcoholQualityData.filter(d => d.z === 1)} fill="#f87171" />
                <Scatter name="White" data={alcoholQualityData.filter(d => d.z === 2)} fill="#a3e635" />
            </ScatterChart>
        </ResponsiveContainer>
      </div>
            <div>
        <h3>Correlation Heatmap</h3>
        <p style={{textAlign: 'center', fontSize: '0.9rem', color: '#666'}}>Correlation of key features</p>
        <Heatmap data={data} />
      </div>
      <div>
        <h3>Feature Importance (by variance)</h3>
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
  );
};


export default Visualizations;
