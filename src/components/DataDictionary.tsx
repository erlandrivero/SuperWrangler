import { calculateColumnStats } from '../utils/statistics';
import { exportToCsv } from '../utils/exportUtils';

const DataDictionary = ({ data }: { data: any[] }) => {
  if (data.length === 0) {
    return <p>Load data to generate a data dictionary.</p>;
  }

  const stats = calculateColumnStats(data);

  const handleExport = () => {
    exportToCsv(stats, 'data_dictionary.csv');
  };

  return (
    <div>
<button onClick={handleExport} style={{ marginBottom: '1rem' }}>Export as CSV</button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Column</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Type</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Non-Null</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Unique</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Min</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Max</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Mean</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(stat => (
            <tr key={stat.column}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.column}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.dataType}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.nonNullCount}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.uniqueCount}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.min}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.max}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.mean}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataDictionary;
