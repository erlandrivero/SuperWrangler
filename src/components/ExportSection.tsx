import { useState } from 'react';
import { exportToCsv, exportToText, generateDataDictionaryMarkdown, generateSummaryReport, exportCompletePackage } from '../utils/exportUtils';
import { calculateColumnStats } from '../utils/statistics';

interface ExportSectionProps {
  data: any[];
  summary: any;
  processingLogs: any[];
  mlResults?: any;
}

const ExportSection = ({ data, summary, processingLogs, mlResults }: ExportSectionProps) => {
  const [exporting, setExporting] = useState(false);

  const handleExportData = () => {
    if (data.length > 0) {
      const timestamp = new Date().toISOString().slice(0, 10);
      exportToCsv(data, `cleaned_data_${timestamp}.csv`);
    }
  };

  const handleExportDictionary = (format: 'markdown' | 'csv') => {
    if (data.length === 0) return;
    
    const stats = calculateColumnStats(data);
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (format === 'markdown') {
      const markdown = generateDataDictionaryMarkdown(stats);
      exportToText(markdown, `data_dictionary_${timestamp}.md`);
    } else {
      exportToCsv(stats, `data_dictionary_${timestamp}.csv`);
    }
  };

  const handleExportSummary = () => {
    if (data.length === 0) return;
    
    const summaryReport = generateSummaryReport(data, summary);
    const timestamp = new Date().toISOString().slice(0, 10);
    exportToText(summaryReport, `summary_report_${timestamp}.txt`);
  };

  const handleExportCompletePackage = async () => {
    if (data.length === 0) return;
    
    setExporting(true);
    try {
      const stats = calculateColumnStats(data);
      await exportCompletePackage(data, stats, summary, processingLogs, mlResults);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to create export package. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const isDisabled = data.length === 0;

  return (
    <div>
      <p style={{ marginBottom: '1rem', color: '#666' }}>
        Export your cleaned data and documentation in various formats.
      </p>

      {/* Individual Export Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={handleExportData} 
          disabled={isDisabled}
          style={{ 
            backgroundColor: '#3b82f6',
            textAlign: 'left',
            padding: '0.75rem 1rem'
          }}
        >
          <strong>📊 Export Data (CSV)</strong>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.25rem' }}>
            Cleaned dataset with all {data.length > 0 ? Object.keys(data[0]).length : 0} columns
          </div>
        </button>

        <button 
          onClick={() => handleExportDictionary('markdown')} 
          disabled={isDisabled}
          style={{ 
            backgroundColor: '#8b5cf6',
            textAlign: 'left',
            padding: '0.75rem 1rem'
          }}
        >
          <strong>📝 Export Data Dictionary (Markdown)</strong>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.25rem' }}>
            Formatted table with column metadata and formulas
          </div>
        </button>

        <button 
          onClick={() => handleExportDictionary('csv')} 
          disabled={isDisabled}
          style={{ 
            backgroundColor: '#8b5cf6',
            textAlign: 'left',
            padding: '0.75rem 1rem'
          }}
        >
          <strong>📋 Export Data Dictionary (CSV)</strong>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.25rem' }}>
            Column documentation for Excel or spreadsheet tools
          </div>
        </button>

        <button 
          onClick={handleExportSummary} 
          disabled={isDisabled}
          style={{ 
            backgroundColor: '#f59e0b',
            textAlign: 'left',
            padding: '0.75rem 1rem'
          }}
        >
          <strong>📄 Export Summary Report (TXT)</strong>
          <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.25rem' }}>
            Comprehensive project summary with all metrics
          </div>
        </button>
      </div>

      {/* Complete Package Export */}
      <div style={{ 
        padding: '1.5rem', 
        backgroundColor: '#f0fdf4', 
        border: '2px solid #10b981', 
        borderRadius: '0.5rem',
        marginTop: '1rem'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#065f46' }}>
          📦 Complete Export Package
        </h3>
        <p style={{ margin: '0 0 1rem 0', color: '#047857', fontSize: '0.875rem' }}>
          Download everything in one ZIP file including:
        </p>
        <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem', color: '#065f46', fontSize: '0.875rem' }}>
          <li>Cleaned data CSV ({data.length} rows × {data.length > 0 ? Object.keys(data[0]).length : 0} columns)</li>
          <li>Data dictionary (Markdown format)</li>
          <li>Data dictionary (CSV format)</li>
          <li>Processing log with timestamps</li>
          <li>Summary report with all metrics</li>
          {mlResults && <li>ML results CSV ({mlResults.results.length} algorithms)</li>}
          {mlResults && <li>ML results detailed report</li>}
          <li>README file</li>
        </ul>
        <button 
          onClick={handleExportCompletePackage} 
          disabled={isDisabled || exporting}
          style={{ 
            backgroundColor: '#10b981',
            fontSize: '1rem',
            fontWeight: 'bold',
            padding: '0.75rem 1.5rem',
            width: '100%'
          }}
        >
          {exporting ? '⏳ Creating Package...' : '📥 Download Complete Package (ZIP)'}
        </button>
      </div>
    </div>
  );
};

export default ExportSection;
