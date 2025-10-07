import { useState } from 'react';
import './index.css';
import DataImport from './components/DataImport';
import DataTable from './components/DataTable';
import Visualizations from './components/Visualizations';
import DataDictionary from './components/DataDictionary';
import ExportSection from './components/ExportSection';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SuccessMessage from './components/SuccessMessage';
import CleaningSummary from './components/CleaningSummary';
import { cleanAndMerge, engineerFeatures } from './utils/dataProcessing';
import { fetchOpenMLData } from './utils/openmlApi';

function App() {
  const [cleanedData, setCleanedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cleaningSummary, setCleaningSummary] = useState<any>({});
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');

  const handleRefresh = () => {
    setCleanedData([]);
    setLoading(false);
    setError(null);
    setSuccess(null);
    setCleaningSummary({});
    setId1('');
    setId2('');
  };

  const summaryItems = [
    { key: 'initialRows1', title: 'Initial Rows (Dataset 1)' },
    { key: 'initialRows2', title: 'Initial Rows (Dataset 2)' },
    { key: 'commonColumns', title: 'Common Columns Found' },
    { key: 'duplicatesRemoved', title: 'Duplicates Removed' },
    { key: 'missingValuesFilled', title: 'Missing Values Filled' },
    { key: 'finalRows', title: 'Final Rows' },
    { key: 'finalColumns', title: 'Final Columns' },
  ];

  const handleDataLoaded = async (source: 'openml' | 'csv', data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCleanedData([]);
    setCleaningSummary({});

    try {
      let data1, data2;
      if (source === 'openml') {
        data1 = await fetchOpenMLData(data.id1);
        data2 = await fetchOpenMLData(data.id2);
      } else {
        data1 = data.data1;
        data2 = data.data2;
      }

      const handleProgress = (summaryStep: any) => {
        setCleaningSummary((prev: any) => ({ ...prev, [summaryStep.key]: summaryStep.value }));
      };

      const { data: processedData } = await cleanAndMerge(data1, data2, handleProgress);
      const engineeredData = engineerFeatures(processedData);
      handleProgress({ key: 'finalColumns', value: engineeredData.length > 0 ? Object.keys(engineeredData[0]).length : 0 });

      setCleanedData(engineeredData);
      setSuccess(`Successfully loaded and processed data. Found ${engineeredData.length} rows.`);
    } catch (err) {
      setError('Failed to load or process data.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', color: '#3b82f6' }}>Data Wrangler</h1>
        <p style={{ fontSize: '1.25rem', color: '#666' }}>Your one-stop solution for cleaning and analyzing data.</p>
        <button onClick={handleRefresh} style={{ marginTop: '1rem', backgroundColor: '#6b7280' }}>Start Over</button>
      </header>

      <main>
        <div className="card">
          <h2>Data Import</h2>
          <DataImport 
            onDataLoaded={handleDataLoaded} 
            loading={loading} 
            id1={id1}
            id2={id2}
            setId1={setId1}
            setId2={setId2}
          />
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}
        </div>

        {Object.keys(cleaningSummary).length > 0 && (
          <div className="card">
            <h2>Cleaning Summary</h2>
            <CleaningSummary items={summaryItems} data={cleaningSummary} />
          </div>
        )}

        <div className="card">
          <h2>Data Preview</h2>
          <DataTable data={cleanedData} />
        </div>

        <div className="card">
          <h2>Visualizations</h2>
          <Visualizations data={cleanedData} />
        </div>

        <div className="card">
          <h2>Data Dictionary</h2>
          <DataDictionary data={cleanedData} />
        </div>

        <div className="card">
          <h2>Export Data</h2>
          <ExportSection data={cleanedData} />
        </div>
      </main>
    </div>
  );
}

export default App;
