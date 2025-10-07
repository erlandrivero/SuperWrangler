import { useState } from 'react';
import Papa from 'papaparse';

interface FileInfo {
  name: string;
  rows: number;
  columns: number;
  size: string;
}

const DataImport = ({ onDataLoaded, loading, id1, id2, setId1, setId2 }: { 
  onDataLoaded: (source: 'openml' | 'csv', data: any) => void, 
  loading: boolean, 
  id1: string, 
  id2: string, 
  setId1: (id: string) => void, 
  setId2: (id: string) => void 
}) => {
  const [mode, setMode] = useState('openml'); // 'openml' or 'csv'
  const [csvData1, setCsvData1] = useState<any[] | null>(null);
  const [csvData2, setCsvData2] = useState<any[] | null>(null);
  const [fileInfo1, setFileInfo1] = useState<FileInfo | null>(null);
  const [fileInfo2, setFileInfo2] = useState<FileInfo | null>(null);
  const [csvError, setCsvError] = useState<string>('');

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileChange = (file: File, datasetNumber: number) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setCsvError(`File must be a CSV file. Got: ${file.name}`);
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setCsvError(`File too large. Maximum size is 50MB. Got: ${formatFileSize(file.size)}`);
      return;
    }

    setCsvError('');

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header: string, index: number) => {
        // Handle empty or whitespace-only headers
        if (!header || header.trim() === '') {
          return `Unnamed_${index + 1}`;
        }
        return header;
      },
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          setCsvError(`Error parsing CSV: ${results.errors[0].message}`);
          return;
        }

        let data = results.data.filter((row: any) => Object.values(row).some(val => val !== null && val !== ''));
        
        if (data.length === 0) {
          setCsvError('CSV file is empty or contains no valid data');
          return;
        }

        // Don't normalize here - let the main processing pipeline handle it
        // Just count the columns as-is for the preview

        const columns = Object.keys(data[0] || {}).length;
        
        const fileInfo: FileInfo = {
          name: file.name,
          rows: data.length,
          columns: columns,
          size: formatFileSize(file.size)
        };

        if (datasetNumber === 1) {
          setCsvData1(data);
          setFileInfo1(fileInfo);
        } else {
          setCsvData2(data);
          setFileInfo2(fileInfo);
        }
      },
      error: (error) => {
        setCsvError(`Failed to parse CSV: ${error.message}`);
      }
    });
  };

  const handleLoadClick = () => {
    if (mode === 'openml') {
      onDataLoaded('openml', { id1, id2: id2 || null });
    } else {
      if (csvData1) {
        onDataLoaded('csv', { data1: csvData1, data2: csvData2 || null });
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => setMode('openml')} disabled={mode === 'openml'}>OpenML IDs</button>
        <button onClick={() => setMode('csv')} disabled={mode === 'csv'}>CSV Files</button>
      </div>

      {mode === 'openml' ? (
        <div>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            Enter one or two OpenML dataset IDs
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={id1}
              onChange={(e) => setId1(e.target.value)}
              placeholder="Dataset 1 ID (required)"
              disabled={loading}
              style={{ width: '100%' }}
            />
            <input
              type="text"
              value={id2}
              onChange={(e) => setId2(e.target.value)}
              placeholder="Dataset 2 ID (optional - leave empty for single dataset)"
              disabled={loading}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            Upload one CSV file (single dataset) or two CSV files (to merge). Max file size: 50MB
          </p>
          
          {csvError && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fee2e2', 
              border: '1px solid #ef4444', 
              borderRadius: '0.5rem', 
              marginBottom: '1rem',
              color: '#991b1b'
            }}>
              <strong>Error:</strong> {csvError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="button-like" style={{ marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
                📁 {fileInfo1 ? 'Change File 1' : 'Select Dataset 1 CSV (required)'}
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0], 1)} 
                  style={{ display: 'none' }} 
                />
              </label>
              {fileInfo1 && (
                <div style={{ 
                  padding: '0.5rem', 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #10b981', 
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#065f46' }}>✓ {fileInfo1.name}</div>
                  <div style={{ color: '#047857' }}>
                    {fileInfo1.rows.toLocaleString()} rows × {fileInfo1.columns} columns ({fileInfo1.size})
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="button-like" style={{ marginBottom: '0.5rem', display: 'block', textAlign: 'center' }}>
                📁 {fileInfo2 ? 'Change File 2' : 'Select Dataset 2 CSV (optional)'}
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0], 2)} 
                  style={{ display: 'none' }} 
                />
              </label>
              {fileInfo2 && (
                <div style={{ 
                  padding: '0.5rem', 
                  backgroundColor: '#f0fdf4', 
                  border: '1px solid #10b981', 
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#065f46' }}>✓ {fileInfo2.name}</div>
                  <div style={{ color: '#047857' }}>
                    {fileInfo2.rows.toLocaleString()} rows × {fileInfo2.columns} columns ({fileInfo2.size})
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleLoadClick} disabled={loading || (mode === 'openml' && !id1) || (mode === 'csv' && !csvData1)}>
        {loading ? 'Loading...' : 'Load & Process Data'}
      </button>
    </div>
  );
};

export default DataImport;
