import { useState, useMemo } from 'react';
import { summarizeAnalysis } from '../utils/columnAnalysis';
import type { ColumnAnalysis as ColumnAnalysisType } from '../utils/columnAnalysis';
import { exportToCsv } from '../utils/exportUtils';

type FilterType = 'all' | 'keep' | 'review' | 'drop';

interface ColumnAnalysisProps {
  analyses: ColumnAnalysisType[];
  onDropColumns?: (columnsToDrop: string[]) => void;
}

const ColumnAnalysis = ({ analyses, onDropColumns }: ColumnAnalysisProps) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortColumn, setSortColumn] = useState<string>('column');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());

  if (analyses.length === 0) {
    return <p>No column analysis available. Load data to analyze columns.</p>;
  }

  const summary = summarizeAnalysis(analyses);

  // Filter analyses
  const filteredAnalyses = useMemo(() => {
    if (filter === 'all') return analyses;
    if (filter === 'keep') {
      return analyses.filter(a => 
        a.recommendation.startsWith('Keep') && 
        !a.recommendation.includes('beware')
      );
    }
    if (filter === 'review') {
      return analyses.filter(a => a.recommendation.includes('beware'));
    }
    if (filter === 'drop') {
      return analyses.filter(a => 
        a.recommendation.includes('Dropping') || 
        a.recommendation.includes('Consider Dropping')
      );
    }
    return analyses;
  }, [analyses, filter]);

  // Sort analyses
  const sortedAnalyses = useMemo(() => {
    const sorted = [...filteredAnalyses].sort((a, b) => {
      let aVal = a[sortColumn as keyof ColumnAnalysisType];
      let bVal = b[sortColumn as keyof ColumnAnalysisType];
      
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredAnalyses, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const toggleRow = (column: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(column)) {
      newExpanded.delete(column);
    } else {
      newExpanded.add(column);
    }
    setExpandedRows(newExpanded);
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.startsWith('Keep') && !recommendation.includes('beware')) {
      return '#d1fae5'; // Green
    }
    if (recommendation.includes('beware')) {
      return '#fef3c7'; // Yellow
    }
    return '#fee2e2'; // Red
  };

  const getRecommendationBadgeColor = (recommendation: string) => {
    if (recommendation.startsWith('Keep') && !recommendation.includes('beware')) {
      return { bg: '#10b981', text: 'white' };
    }
    if (recommendation.includes('beware')) {
      return { bg: '#f59e0b', text: 'white' };
    }
    return { bg: '#ef4444', text: 'white' };
  };

  const handleExport = () => {
    const exportData = analyses.map(a => ({
      Column: a.column,
      'Data Type': a.dataType,
      'Unique Values': a.uniqueValues,
      'Non-Null Count': a.nonNullCount,
      'Null Count': a.nullCount,
      Recommendation: a.recommendation,
      Details: a.details,
      'Sample Values': a.sampleValues.join(', ')
    }));
    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCsv(exportData, `column_analysis_${timestamp}.csv`);
  };

  return (
    <div>
      {/* Summary Header */}
      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>Column Analysis: {summary.totalColumns} columns analyzed</h3>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
          <div>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>{summary.keepColumns}</span> columns recommended to keep
          </div>
          <div>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{summary.reviewColumns}</span> columns to review (moderate cardinality)
          </div>
          <div>
            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{summary.dropColumns}</span> columns to consider dropping (high cardinality or IDs)
          </div>
        </div>
      </div>

      {/* Filter and Export Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setFilter('all')}
            style={{ 
              backgroundColor: filter === 'all' ? '#3b82f6' : '#e5e7eb',
              color: filter === 'all' ? 'white' : '#1f2937'
            }}
          >
            Show All ({summary.totalColumns})
          </button>
          <button 
            onClick={() => setFilter('keep')}
            style={{ 
              backgroundColor: filter === 'keep' ? '#10b981' : '#e5e7eb',
              color: filter === 'keep' ? 'white' : '#1f2937'
            }}
          >
            Keep ({summary.keepColumns})
          </button>
          <button 
            onClick={() => setFilter('review')}
            style={{ 
              backgroundColor: filter === 'review' ? '#f59e0b' : '#e5e7eb',
              color: filter === 'review' ? 'white' : '#1f2937'
            }}
          >
            Review ({summary.reviewColumns})
          </button>
          <button 
            onClick={() => setFilter('drop')}
            style={{ 
              backgroundColor: filter === 'drop' ? '#ef4444' : '#e5e7eb',
              color: filter === 'drop' ? 'white' : '#1f2937'
            }}
          >
            Drop ({summary.dropColumns})
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleExport} style={{ backgroundColor: '#8b5cf6' }}>
            Export Analysis
          </button>
          {selectedColumns.size > 0 && onDropColumns && (
            <button 
              onClick={() => {
                onDropColumns(Array.from(selectedColumns));
                setSelectedColumns(new Set());
              }}
              style={{ backgroundColor: '#ef4444', color: 'white' }}
            >
              Drop Selected ({selectedColumns.size}) & Reprocess
            </button>
          )}
        </div>
      </div>

      {/* Analysis Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'center', width: '50px' }}>
                Drop?
              </th>
              <th onClick={() => handleSort('column')} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', cursor: 'pointer', textAlign: 'left' }}>
                Column Name {sortColumn === 'column' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('dataType')} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', cursor: 'pointer', textAlign: 'left' }}>
                Type {sortColumn === 'dataType' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('uniqueValues')} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', cursor: 'pointer', textAlign: 'left' }}>
                Unique {sortColumn === 'uniqueValues' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('nullCount')} style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', cursor: 'pointer', textAlign: 'left' }}>
                Nulls {sortColumn === 'nullCount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'left' }}>
                Recommendation
              </th>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2', textAlign: 'center' }}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAnalyses.map(analysis => {
              const colors = getRecommendationBadgeColor(analysis.recommendation);
              const isExpanded = expandedRows.has(analysis.column);
              
              const shouldShowCheckbox = analysis.recommendation.includes('Dropping') || 
                                          analysis.recommendation.includes('Consider Dropping');
              
              return (
                <tr key={analysis.column} style={{ backgroundColor: getRecommendationColor(analysis.recommendation) }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {shouldShowCheckbox && (
                      <input
                        type="checkbox"
                        checked={selectedColumns.has(analysis.column)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedColumns);
                          if (e.target.checked) {
                            newSelected.add(analysis.column);
                          } else {
                            newSelected.delete(analysis.column);
                          }
                          setSelectedColumns(newSelected);
                        }}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    )}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', fontWeight: '500' }}>
                    {analysis.column}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: analysis.dataType === 'numeric' ? '#dbeafe' : '#fce7f3',
                      color: analysis.dataType === 'numeric' ? '#1e40af' : '#9f1239',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {analysis.dataType}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {analysis.uniqueValues.toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {analysis.nullCount}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      display: 'inline-block'
                    }}>
                      {analysis.recommendation}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => toggleRow(analysis.column)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      {isExpanded ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded Details */}
      {Array.from(expandedRows).map(column => {
        const analysis = analyses.find(a => a.column === column);
        if (!analysis) return null;
        
        return (
          <div key={column} style={{ 
            marginTop: '0.5rem', 
            padding: '1rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Details for: {column}</h4>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>{analysis.details}</p>
            <div style={{ fontSize: '0.875rem' }}>
              <strong>Sample Values:</strong> {analysis.sampleValues.join(', ')}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ColumnAnalysis;
