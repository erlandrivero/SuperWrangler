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
  
  // Detect binned features
  const binnedFeatures = allColumns.filter(col => col.endsWith('_bin'));
  
  // Dynamically determine column source based on naming patterns
  const getColumnSource = (column: string): string => {
    // Binned features end with _bin
    if (binnedFeatures.includes(column)) return 'Binned';
    
    // Engineered features follow these patterns:
    // - Ratio features: col1_to_col2_ratio
    // - Interaction features: col1_x_col2
    // - Centered features: col_centered
    // - Binary flags: col_high_flag or col_low_flag
    if (column.includes('_to_') && column.endsWith('_ratio')) return 'Engineered';
    if (column.includes('_x_') && !column.endsWith('_bin')) return 'Engineered';
    if (column.endsWith('_centered')) return 'Engineered';
    if (column.endsWith('_high_flag') || column.endsWith('_low_flag')) return 'Engineered';
    
    return 'Original';
  };
  
  // Dynamically generate description
  const getColumnDescription = (column: string): string => {
    // Ratio features
    if (column.includes('_to_') && column.endsWith('_ratio')) {
      const parts = column.replace('_ratio', '').split('_to_');
      return `Ratio of ${parts[0].replace(/_/g, ' ')} to ${parts[1].replace(/_/g, ' ')}`;
    }
    
    // Interaction features
    if (column.includes('_x_')) {
      const parts = column.split('_x_');
      return `Interaction between ${parts[0].replace(/_/g, ' ')} and ${parts[1].replace(/_/g, ' ')}`;
    }
    
    // Centered features
    if (column.endsWith('_centered')) {
      const baseColumn = column.replace('_centered', '');
      return `Median-centered ${baseColumn.replace(/_/g, ' ')}`;
    }
    
    // Binary flags
    if (column.endsWith('_high_flag')) {
      const baseColumn = column.replace('_high_flag', '');
      return `Binary flag: ${baseColumn.replace(/_/g, ' ')} above median`;
    }
    if (column.endsWith('_low_flag')) {
      const baseColumn = column.replace('_low_flag', '');
      return `Binary flag: ${baseColumn.replace(/_/g, ' ')} below median`;
    }
    
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
    // Ratio features
    if (column.includes('_to_') && column.endsWith('_ratio')) {
      const parts = column.replace('_ratio', '').split('_to_');
      return `${parts[0]} / (${parts[1]} + 1e-9)`;
    }
    
    // Interaction features
    if (column.includes('_x_')) {
      const parts = column.split('_x_');
      return `${parts[0]} × ${parts[1]}`;
    }
    
    // Centered features
    if (column.endsWith('_centered')) {
      const baseColumn = column.replace('_centered', '');
      return `${baseColumn} - median(${baseColumn})`;
    }
    
    // Binary flags
    if (column.endsWith('_high_flag')) {
      const baseColumn = column.replace('_high_flag', '');
      return `1 if ${baseColumn} > median, else 0`;
    }
    if (column.endsWith('_low_flag')) {
      const baseColumn = column.replace('_low_flag', '');
      return `1 if ${baseColumn} < median, else 0`;
    }
    
    // Binned features - show actual bin values from the data
    if (column.endsWith('_bin')) {
      const uniqueValues = [...new Set(data.map(row => row[column]))].filter(v => v !== null && v !== undefined);
      if (uniqueValues.length > 0 && uniqueValues.length <= 10) {
        return uniqueValues.sort().join(', ');
      }
      return 'Categorical bins';
    }
    
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
