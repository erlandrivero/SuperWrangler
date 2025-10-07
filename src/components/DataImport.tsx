import { useState } from 'react';
import Papa from 'papaparse';

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
  const [fileName1, setFileName1] = useState('');
  const [fileName2, setFileName2] = useState('');

  const handleFileChange = (file: File, datasetNumber: number) => {
    if (!file) return;

    if (datasetNumber === 1) setFileName1(file.name);
    if (datasetNumber === 2) setFileName2(file.name);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        if (datasetNumber === 1) setCsvData1(results.data);
        if (datasetNumber === 2) setCsvData2(results.data);
      },
    });
  };

  const handleLoadClick = () => {
    if (mode === 'openml') {
      onDataLoaded('openml', { id1, id2 });
    } else {
      if (csvData1 && csvData2) {
        onDataLoaded('csv', { data1: csvData1, data2: csvData2 });
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={id1}
            onChange={(e) => setId1(e.target.value)}
            placeholder="Dataset 1 ID"
            disabled={loading}
          />
          <input
            type="text"
            value={id2}
            onChange={(e) => setId2(e.target.value)}
            placeholder="Dataset 2 ID"
            disabled={loading}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <label>
            {fileName1 || 'Select Dataset 1 CSV'}
            <input type="file" accept=".csv" onChange={(e) => handleFileChange(e.target.files![0], 1)} style={{ display: 'none' }} />
          </label>
          <label>
            {fileName2 || 'Select Dataset 2 CSV'}
            <input type="file" accept=".csv" onChange={(e) => handleFileChange(e.target.files![0], 2)} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      <button onClick={handleLoadClick} disabled={loading || (mode === 'csv' && (!csvData1 || !csvData2))}>
        {loading ? 'Loading...' : 'Load & Process Data'}
      </button>
    </div>
  );
};

export default DataImport;
