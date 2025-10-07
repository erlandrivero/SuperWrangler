import { useState, useMemo } from 'react';
import { calculateColumnStats } from '../utils/statistics';
import { exportToCsv } from '../utils/exportUtils';

type SourceFilter = 'all' | 'original' | 'engineered' | 'binned';

const DataDictionary = ({ data }: { data: any[] }) => {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [sortColumn, setSortColumn] = useState<string>('column');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const stats = calculateColumnStats(data);

  // Get all column names from the data
  const allColumns = Object.keys(data[0] || {});
  
  // Known engineered feature patterns
  const engineeredFeatures = ['so2_ratio', 'chlorides_to_sulphates', 'total_acidity_proxy', 'alcohol_x_sulphates', 'density_centered', 'high_acidity_flag'];
  const binnedFeatures = allColumns.filter(col => col.endsWith('_bin'));
  
  // Dynamically determine column source
  const getColumnSource = (column: string): string => {
    if (engineeredFeatures.includes(column)) return 'Engineered';
    if (binnedFeatures.includes(column)) return 'Binned';
    return 'Original';
  };
  
  // Dynamically generate description
  const getColumnDescription = (column: string): string => {
    // Engineered features
    if (column === 'so2_ratio') return 'Ratio of free to total SO2';
    if (column === 'chlorides_to_sulphates') return 'Chlorides to sulphates ratio';
    if (column === 'total_acidity_proxy') return 'Combined acidity measure';
    if (column === 'alcohol_x_sulphates') return 'Interaction feature';
    if (column === 'density_centered') return 'Normalized density values';
    if (column === 'high_acidity_flag') return 'Binary acidity classification';
    
    // Binned features
    if (column.endsWith('_bin')) {
      const baseColumn = column.replace('_bin', '');
      return `Categorical bins for ${baseColumn.replace(/_/g, ' ')}`;
    }
    
    // Original columns - generic description
    return column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  
  // Dynamically generate formula for engineered/binned columns
  const getColumnFormula = (column: string): string => {
    if (column === 'so2_ratio') return 'free_sulfur_dioxide / (total_sulfur_dioxide + 1e-9)';
    if (column === 'chlorides_to_sulphates') return 'chlorides / (sulphates + 1e-9)';
    if (column === 'total_acidity_proxy') return 'fixed_acidity + volatile_acidity + citric_acid';
    if (column === 'alcohol_x_sulphates') return 'alcohol × sulphates';
    if (column === 'density_centered') return 'density - median(density)';
    if (column === 'high_acidity_flag') return '1 if fixed_acidity > median, else 0';
    if (column === 'quality_bin') return 'low (≤5), medium (5-6), high (>6)';
    if (column === 'alcohol_bin') return 'very_low (≤10), low (10-12), medium (12-14), high (>14)';
    return '-';
  };

  // Enhanced stats with metadata
  const enhancedStats = useMemo(() => {
    // Get sample values for each column (inside useMemo to ensure fresh data)
    const getSampleValues = (column: string) => {
      const values = data.slice(0, 3).map(row => row[column]);
      return values.map(v => 
        typeof v === 'number' ? v.toFixed(2) : String(v)
      ).join(', ');
    };

    return stats.map(stat => ({
      ...stat,
      source: getColumnSource(stat.column),
      formula: getColumnFormula(stat.column),
      description: getColumnDescription(stat.column),
      sampleValues: getSampleValues(stat.column)
    }));
  }, [stats, data]);

  // Filter stats based on source
  const filteredStats = useMemo(() => {
    if (sourceFilter === 'all') return enhancedStats;
    return enhancedStats.filter(stat => stat.source.toLowerCase() === sourceFilter);
  }, [enhancedStats, sourceFilter]);

  // Sort stats
  const sortedStats = useMemo(() => {
    const sorted = [...filteredStats].sort((a, b) => {
      let aVal = a[sortColumn as keyof typeof a];
      let bVal = b[sortColumn as keyof typeof b];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredStats, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    const exportData = enhancedStats.map(stat => ({
      Column: stat.column,
      Source: stat.source,
      Type: stat.dataType,
      'Formula/Description': stat.formula !== '-' ? stat.formula : stat.description,
      'Non-Null': stat.nonNullCount,
      'Unique': stat.uniqueCount,
      'Min': stat.min,
      'Max': stat.max,
      'Mean': stat.mean,
      'Sample Values': stat.sampleValues
    }));
    exportToCsv(exportData, 'data_dictionary.csv');
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'Original': return '#dbeafe';
      case 'Engineered': return '#d1fae5';
      case 'Binned': return '#e0e7ff';
      default: return '#f3f4f6';
    }
  };

  const originalCount = enhancedStats.filter(s => s.source === 'Original').length;
  const engineeredCount = enhancedStats.filter(s => s.source === 'Engineered').length;
  const binnedCount = enhancedStats.filter(s => s.source === 'Binned').length;

  if (data.length === 0) {
    return <p>Load data to generate a data dictionary.</p>;
  }

  return (
    <div>
      {/* Header with summary and filters */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Data Dictionary: {enhancedStats.length} Columns</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>
            {originalCount} original + {engineeredCount} engineered + {binnedCount} binned
          </p>
        </div>
        <button onClick={handleExport} style={{ backgroundColor: '#10b981' }}>
          Export as CSV
        </button>
      </div>

      {/* Filter buttons */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setSourceFilter('all')}
          style={{ 
            backgroundColor: sourceFilter === 'all' ? '#3b82f6' : '#e5e7eb',
            color: sourceFilter === 'all' ? 'white' : '#1f2937'
          }}
        >
          Show All ({enhancedStats.length})
        </button>
        <button 
          onClick={() => setSourceFilter('original')}
          style={{ 
            backgroundColor: sourceFilter === 'original' ? '#3b82f6' : '#e5e7eb',
            color: sourceFilter === 'original' ? 'white' : '#1f2937'
          }}
        >
          Original ({originalCount})
        </button>
        <button 
          onClick={() => setSourceFilter('engineered')}
          style={{ 
            backgroundColor: sourceFilter === 'engineered' ? '#3b82f6' : '#e5e7eb',
            color: sourceFilter === 'engineered' ? 'white' : '#1f2937'
          }}
        >
          Engineered ({engineeredCount})
        </button>
        <button 
          onClick={() => setSourceFilter('binned')}
          style={{ 
            backgroundColor: sourceFilter === 'binned' ? '#3b82f6' : '#e5e7eb',
            color: sourceFilter === 'binned' ? 'white' : '#1f2937'
          }}
        >
          Binned ({binnedCount})
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th onClick={() => handleSort('column')} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', cursor: 'pointer' }}>
                Column {sortColumn === 'column' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('source')} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', cursor: 'pointer' }}>
                Source {sortColumn === 'source' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('dataType')} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', cursor: 'pointer' }}>
                Type {sortColumn === 'dataType' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Formula/Description</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Sample Values</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Non-Null</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Unique</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map(stat => (
              <tr key={stat.column} style={{ backgroundColor: getSourceColor(stat.source) }}>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '500' }}>{stat.column}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    backgroundColor: stat.source === 'Original' ? '#3b82f6' : stat.source === 'Engineered' ? '#10b981' : '#6366f1',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {stat.source}
                  </span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.dataType}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  {stat.formula !== '-' ? stat.formula : stat.description}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '8px', fontSize: '0.75rem' }}>{stat.sampleValues}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.nonNullCount}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{stat.uniqueCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataDictionary;
