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
import ProcessingLog from './components/ProcessingLog';
import ColumnAnalysis from './components/ColumnAnalysis';
import BalanceCheck from './components/BalanceCheck';
import { cleanAndMerge, cleanSingleDataset, engineerFeatures, encodeCategoricalColumns, addBinnedColumns } from './utils/dataProcessing';
import { fetchOpenMLData } from './utils/openmlApi';
import { analyzeColumns } from './utils/columnAnalysis';
import { checkBalance } from './utils/statistics';
import type { ColumnAnalysis as ColumnAnalysisType } from './utils/columnAnalysis';
import type { BalanceReport } from './utils/statistics';

interface LogEntry {
  step: number;
  name: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
  details: string;
  metrics?: { before?: string; after?: string };
}

function App() {
  const [cleanedData, setCleanedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cleaningSummary, setCleaningSummary] = useState<any>({});
  const [processingLogs, setProcessingLogs] = useState<LogEntry[]>([]);
  const [columnAnalyses, setColumnAnalyses] = useState<ColumnAnalysisType[]>([]);
  const [balanceReport, setBalanceReport] = useState<BalanceReport | null>(null);
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const handleRefresh = () => {
    setCleanedData([]);
    setLoading(false);
    setError(null);
    setSuccess(null);
    setCleaningSummary({});
    setProcessingLogs([]);
    setColumnAnalyses([]);
    setBalanceReport(null);
    setId1('');
    setId2('');
    setResetKey(prev => prev + 1); // Force DataImport to remount
  };

  // Dynamic summary items based on processing mode
  const getSummaryItems = () => {
    const isSingleMode = cleaningSummary.processingMode === 'single';
    
    if (isSingleMode) {
      return [
        { key: 'initialRows1', title: 'Initial Rows' },
        { key: 'commonColumns', title: 'Total Columns' },
        { key: 'duplicatesRemoved', title: 'Duplicates Removed' },
        { key: 'missingValuesFilled', title: 'Missing Values Filled' },
        { key: 'binnedColumnsCreated', title: 'Binned Columns' },
        { key: 'finalRows', title: 'Final Rows' },
        { key: 'finalColumns', title: 'Final Columns' },
      ];
    } else {
      return [
        { key: 'initialRows1', title: 'Initial Rows (DS 1)' },
        { key: 'initialRows2', title: 'Initial Rows (DS 2)' },
        { key: 'commonColumns', title: 'Common Columns' },
        { key: 'duplicatesRemoved', title: 'Duplicates Removed' },
        { key: 'missingValuesFilled', title: 'Missing Values Filled' },
        { key: 'binnedColumnsCreated', title: 'Binned Columns' },
        { key: 'finalRows', title: 'Final Rows' },
        { key: 'finalColumns', title: 'Final Columns' },
      ];
    }
  };

  const handleDataLoaded = async (source: 'openml' | 'csv', data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setCleanedData([]);
    setCleaningSummary({});
    setProcessingLogs([]);
    setColumnAnalyses([]);
    setBalanceReport(null);
    
    const logs: LogEntry[] = [];
    const addLog = (name: string, details: string, metrics?: { before?: string; after?: string }) => {
      logs.push({
        step: logs.length + 1,
        name,
        timestamp: new Date().toLocaleTimeString(),
        status: 'success',
        details,
        metrics
      });
      setProcessingLogs([...logs]);
    };

    try {
      let data1, data2;
      const isSingleDataset = (source === 'openml' && !data.id2) || (source === 'csv' && !data.data2);
      
      if (source === 'openml') {
        data1 = await fetchOpenMLData(data.id1);
        addLog('Loaded Dataset 1', `Fetched dataset ${data.id1} from OpenML`, { after: `${data1.length} rows` });
        if (data.id2) {
          data2 = await fetchOpenMLData(data.id2);
          addLog('Loaded Dataset 2', `Fetched dataset ${data.id2} from OpenML`, { after: `${data2.length} rows` });
        }
      } else {
        data1 = data.data1;
        addLog('Loaded Dataset 1', `Loaded from CSV file`, { after: `${data1.length} rows` });
        if (data.data2) {
          data2 = data.data2;
          addLog('Loaded Dataset 2', `Loaded from CSV file`, { after: `${data2.length} rows` });
        }
      }

      // Run column analysis on RAW data (before cleaning)
      const rawDataForAnalysis = isSingleDataset ? data1 : [...data1, ...data2];
      const analyses = analyzeColumns(rawDataForAnalysis);
      setColumnAnalyses(analyses);
      addLog('Analyzed Columns', `Analyzed ${analyses.length} columns for encoding recommendations`, { 
        after: `${analyses.filter(a => a.recommendation.startsWith('Keep')).length} columns recommended to keep` 
      });

      const handleProgress = (summaryStep: any) => {
        setCleaningSummary((prev: any) => ({ ...prev, [summaryStep.key]: summaryStep.value }));
      };

      let processedData, commonColumns;

      if (isSingleDataset) {
        // Single dataset workflow
        addLog('Normalized Column Names', 'Standardized all column names to lowercase with underscores', { after: 'All columns normalized' });
        
        const result = await cleanSingleDataset(data1, handleProgress);
        processedData = result.data;
        commonColumns = result.commonColumns;
        
        addLog('Converted to Numeric', 'Converted all numeric columns to proper number types', { after: 'All numeric columns converted' });
        addLog('Removed Duplicates', 'Eliminated exact duplicate rows', { 
          before: `${data1.length} rows`, 
          after: `${processedData.length} rows` 
        });
        addLog('Filled Missing Values', 'Imputed missing values using column medians', { after: 'All missing values filled' });
      } else {
        // Two dataset workflow (existing)
        addLog('Normalized Column Names', 'Standardized all column names to lowercase with underscores', { after: 'All columns normalized' });

        const result = await cleanAndMerge(data1, data2, handleProgress);
        processedData = result.data;
        commonColumns = result.commonColumns;
        
        addLog('Found Common Columns', `Identified columns present in both datasets`, { after: `${commonColumns?.length || 0} common columns` });
        addLog('Aligned Datasets', 'Filtered both datasets to common columns only', { before: 'Different structures', after: 'Aligned structure' });
        addLog('Converted to Numeric', 'Converted all numeric columns to proper number types', { after: 'All numeric columns converted' });
        addLog('Removed Duplicates', 'Eliminated exact duplicate rows from merged dataset', { 
          before: `${data1.length + data2.length} rows`, 
          after: `${processedData.length} rows (${data1.length + data2.length - processedData.length} removed)` 
        });
        addLog('Filled Missing Values', 'Imputed missing values using column medians', { after: 'All missing values filled' });
      }
      
      // Check class balance on ORIGINAL cleaned data (before any transformations)
      console.log('Checking balance on processedData. First 5 rows of type column:', 
                  processedData.slice(0, 5).map(r => r.type));
      console.log('Unique type values:', [...new Set(processedData.map(r => r.type))]);
      
      const balanceCheck = checkBalance(processedData);
      if (balanceCheck) {
        setBalanceReport(balanceCheck);
        addLog('Checked Class Balance', `Analyzed target column: ${balanceCheck.targetColumn}`, { 
          after: `${balanceCheck.isBalanced ? 'Balanced' : 'Imbalanced'} (ratio: ${balanceCheck.imbalanceRatio.toFixed(1)}:1)` 
        });
      }
      
      const featureResult = engineerFeatures(processedData);
      const engineeredData = featureResult.data;
      
      if (featureResult.featuresCreated.length > 0) {
        const featureList = featureResult.featuresCreated.slice(0, 5).join(', ') + 
                           (featureResult.featuresCreated.length > 5 ? `, ... (${featureResult.featuresCreated.length - 5} more)` : '');
        addLog('Engineered Features', `Created ${featureResult.featuresCreated.length} features automatically: ${featureList}`, { after: `${featureResult.featuresCreated.length} features created` });
        handleProgress({ key: 'engineeredFeatures', value: featureResult.featuresCreated.length });
        handleProgress({ key: 'featureType', value: featureResult.featureType || 'generic' });
      } else if (featureResult.skippedReason) {
        addLog('Feature Engineering Skipped', featureResult.skippedReason, { after: 'No features created' });
        handleProgress({ key: 'engineeredFeatures', value: 0 });
        handleProgress({ key: 'featureType', value: 'none' });
        handleProgress({ key: 'featureSkipReason', value: featureResult.skippedReason });
      }
      
      // Encode categorical columns
      const encodingResult = encodeCategoricalColumns(engineeredData);
      const encodedData = encodingResult.data;
      const { encodedColumns, encodingMaps } = encodingResult;
      
      if (encodedColumns.length > 0) {
        const encodingDetails = encodedColumns.map(col => {
          const map = encodingMaps[col];
          const mappingStr = Object.entries(map).map(([key, val]) => `${key}→${val}`).join(', ');
          return `${col}: ${mappingStr}`;
        }).join('; ');
        
        addLog('Encoded Categorical Columns', `Converted ${encodedColumns.length} categorical columns to numeric`, { 
          after: encodingDetails
        });
      }
      
      // Add binned columns
      const binningResult = addBinnedColumns(encodedData);
      const binnedData = binningResult.data;
      const { qualityBinCounts, alcoholBinCounts, binConfigs } = binningResult;
      
      if (binConfigs.length > 0) {
        const binDetails = binConfigs.map(c => `${c.column}_bin (${c.labels.join('/')})`).join(', ');
        addLog('Created Binned Columns', `Added ${binConfigs.length} binned column(s) using quartile-based binning: ${binDetails}`, { after: `${binConfigs.length} binned columns created` });
        handleProgress({ key: 'binnedColumnsCreated', value: binConfigs.length });
      } else {
        addLog('Binning Skipped', 'No suitable numeric columns found for binning (need 10-100 unique values)', { after: 'No bins created' });
        handleProgress({ key: 'binnedColumnsCreated', value: 0 });
      }
      
      // Store bin distributions in summary for display
      setCleaningSummary((prev: any) => ({ 
        ...prev, 
        qualityBinCounts, 
        alcoholBinCounts 
      }));
      
      handleProgress({ key: 'finalColumns', value: binnedData.length > 0 ? Object.keys(binnedData[0]).length : 0 });

      addLog('Processing Complete', `Final dataset ready for analysis`, { 
        after: `${binnedData.length} rows × ${Object.keys(binnedData[0] || {}).length} columns` 
      });

      setCleanedData(binnedData);
      const mode = isSingleDataset ? 'Single dataset' : 'Merged datasets';
      setSuccess(`Successfully loaded and processed data (${mode}). Found ${binnedData.length} rows with ${Object.keys(binnedData[0] || {}).length} columns.`);
    } catch (err) {
      console.error('Error during data processing:', err);
      
      let errorMessage = 'Failed to load or process data.';
      
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Network error: Unable to fetch data from OpenML. Please check your internet connection.';
        } else if (err.message.includes('404')) {
          errorMessage = 'Dataset not found: The OpenML dataset ID does not exist. Please verify the ID and try again.';
        } else if (err.message.includes('parse') || err.message.includes('JSON')) {
          errorMessage = 'Data format error: Unable to parse the dataset. The data may be corrupted or in an unexpected format.';
        } else if (err.message.includes('empty')) {
          errorMessage = 'Empty dataset: The dataset contains no data. Please try a different dataset.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      addLog('Processing Failed', errorMessage, { after: 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '0.5rem' }}>
          🦸 SuperWrangler
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#666', marginBottom: '0.5rem' }}>
          Universal Data Cleaning & Analysis Platform
        </p>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>
          Works with ANY dataset • Single or Dual Dataset Support • Smart Feature Detection
        </p>
        <button onClick={handleRefresh} style={{ marginTop: '1rem', backgroundColor: '#6b7280' }}>
          🔄 Start Over
        </button>
      </header>

      <main>
        <div className="card">
          <h2>📥 Data Import</h2>
          <DataImport 
            key={resetKey}
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

        {columnAnalyses.length > 0 && (
          <div className="card">
            <h2>🔍 Column Analysis</h2>
            <ColumnAnalysis 
              analyses={columnAnalyses} 
              onDropColumns={(columnsToDrop) => {
                // Drop columns and reprocess
                if (cleanedData.length > 0) {
                  const filteredData = cleanedData.map(row => {
                    const newRow = { ...row };
                    // Delete columns - match by lowercase to handle case sensitivity
                    columnsToDrop.forEach(colToDrop => {
                      const colLower = colToDrop.toLowerCase();
                      Object.keys(newRow).forEach(key => {
                        if (key.toLowerCase() === colLower) {
                          delete newRow[key];
                        }
                      });
                    });
                    return newRow;
                  });
                  
                  setCleanedData(filteredData);
                  
                  // Add log entry
                  const newLog: LogEntry = {
                    step: processingLogs.length + 1,
                    name: 'Dropped Columns',
                    details: `Removed ${columnsToDrop.length} columns: ${columnsToDrop.join(', ')}`,
                    timestamp: new Date().toISOString(),
                    status: 'success',
                    metrics: {
                      before: `${Object.keys(cleanedData[0] || {}).length} columns`,
                      after: `${Object.keys(filteredData[0] || {}).length} columns`
                    }
                  };
                  setProcessingLogs([...processingLogs, newLog]);
                  
                  // Update summary
                  setCleaningSummary((prev: any) => ({
                    ...prev,
                    finalColumns: Object.keys(filteredData[0] || {}).length
                  }));
                  
                  // Re-run column analysis on filtered data
                  const newAnalyses = analyzeColumns(filteredData);
                  setColumnAnalyses(newAnalyses);
                  
                  // Re-run balance check
                  const newBalance = checkBalance(filteredData);
                  setBalanceReport(newBalance);
                }
              }}
            />
          </div>
        )}

        {Object.keys(cleaningSummary).length > 0 && (
          <div className="card">
            <h2>✨ Cleaning Summary</h2>
            <CleaningSummary items={getSummaryItems()} data={cleaningSummary} />
            
            {balanceReport && (
              <div style={{ marginTop: '1.5rem' }}>
                <BalanceCheck report={balanceReport} />
              </div>
            )}
          </div>
        )}

        {processingLogs.length > 0 && (
          <ProcessingLog logs={processingLogs} />
        )}

        <div className="card">
          <h2>📊 Data Preview</h2>
          <DataTable data={cleanedData} />
        </div>

        <div className="card">
          <h2>📊 Visualizations</h2>
          <Visualizations data={cleanedData} />
        </div>

        <div className="card">
          <h2>📖 Data Dictionary</h2>
          <DataDictionary data={cleanedData} />
        </div>

        <div className="card">
          <h2>📦 Export Data</h2>
          <ExportSection data={cleanedData} summary={cleaningSummary} processingLogs={processingLogs} />
        </div>
      </main>
    </div>
  );
}

export default App;
