// Step 1: Normalize column names and handle empty column names
export const normalizeColumns = (data: any[]) => {
  if (data.length === 0) return data;
  
  // First, get all unique column names from the first row to establish naming
  const firstRow = data[0];
  const columnMapping: { [oldKey: string]: string } = {};
  let unnamedCount = 0;
  
  for (const key in firstRow) {
    let newKey: string;
    
    // Handle empty or whitespace-only column names
    if (!key || key.trim() === '') {
      unnamedCount++;
      newKey = `unnamed_column_${unnamedCount}`;
    } else {
      newKey = key
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '');
      
      // If normalization resulted in empty string, give it a name
      if (!newKey) {
        unnamedCount++;
        newKey = `unnamed_column_${unnamedCount}`;
      }
    }
    
    columnMapping[key] = newKey;
  }
  
  // Apply the same mapping to all rows
  return data.map(row => {
    const newRow: { [key: string]: any } = {};
    for (const key in row) {
      const newKey = columnMapping[key] || key;
      newRow[newKey] = row[key];
    }
    return newRow;
  });
};

// Step 2: Add a 'dataset_source' column to track which dataset each row came from
export const addSourceColumn = (data: any[], source: string) => {
  // Always add 'dataset_source' column to track origin, never overwrite existing columns
  return data.map(row => ({ ...row, dataset_source: source }));
};

// Step 3: Find common columns
export const findCommonColumns = (data1: any[], data2: any[]) => {
  if (data1.length === 0 || data2.length === 0) return [];
  const keys1 = Object.keys(data1[0]);
  const keys2 = Object.keys(data2[0]);
  return keys1.filter(key => keys2.includes(key));
};

// Step 4: Align datasets to common columns
export const alignDatasets = (data: any[], commonColumns: string[]) => {
  return data.map(row => {
    const newRow: { [key: string]: any } = {};
    commonColumns.forEach(col => {
      newRow[col] = row[col];
    });
    return newRow;
  });
};

// Step 5: Convert columns to numeric
export const convertToNumeric = (data: any[]) => {
    if (data.length === 0) return [];
    const keys = Object.keys(data[0]);
    const numericKeys = keys.filter(key => key !== 'type');

    return data.map(row => {
        const newRow = { ...row };
        numericKeys.forEach(key => {
            const value = parseFloat(newRow[key]);
            newRow[key] = isNaN(value) ? null : value;
        });
        return newRow;
    });
};

// Step 6: Remove exact duplicate rows
export const removeDuplicates = (data: any[]) => {
  const seen = new Set();
  const initialCount = data.length;
  const cleanedData = data.filter(row => {
    const rowString = JSON.stringify(row);
    if (seen.has(rowString)) {
      return false;
    } else {
      seen.add(rowString);
      return true;
    }
  });
  return { data: cleanedData, removedCount: initialCount - cleanedData.length };
};

// Step 7: Fill missing values with column median
export const fillMissingValues = (data: any[]) => {
    if (data.length === 0) return { data, filledCount: 0, filledCounts: {} };
    const keys = Object.keys(data[0]);
    const numericKeys = keys.filter(key => typeof data[0][key] === 'number');
    const medians: { [key: string]: number } = {};
    const filledCounts: { [key: string]: number } = {};

    // Initialize counts
    numericKeys.forEach(key => {
        filledCounts[key] = 0;
    });

    numericKeys.forEach(key => {
        const values = data.map(row => row[key]).filter(v => v !== null) as number[];
        if (values.length === 0) {
            medians[key] = 0;
            return;
        }
        values.sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        medians[key] = values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    });

    let filledCount = 0;
    const processedData = data.map(row => {
        const newRow = { ...row };
        numericKeys.forEach(key => {
            if (newRow[key] === null) {
                newRow[key] = medians[key];
                filledCount++;
                filledCounts[key]++;
            }
        });
        return newRow;
    });
    return { data: processedData, filledCount, filledCounts };
};

export const engineerFeatures = (data: any[]): { 
  data: any[], 
  featuresCreated: string[],
  skippedReason?: string,
  featureType?: 'wine-specific' | 'generic' | 'none'
} => {
  if (!data || data.length === 0) {
    return { data, featuresCreated: [], skippedReason: 'No data to process', featureType: 'none' };
  }

  const featuresCreated: string[] = [];
  let engineeredData = [...data];
  
  // Get all numeric columns
  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined);
    return values.length > 0 && values.every(v => typeof v === 'number' || !isNaN(Number(v)));
  });
  
  if (numericColumns.length < 2) {
    return { 
      data, 
      featuresCreated: [], 
      skippedReason: 'Need at least 2 numeric columns for feature engineering',
      featureType: 'none'
    };
  }
  
  // Helper function to calculate median
  const getMedian = (values: number[]) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  
  // Calculate medians for all numeric columns
  const medians: { [key: string]: number } = {};
  numericColumns.forEach(col => {
    const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
    medians[col] = getMedian(values);
  });
  
  // 1. Create ratio features (for pairs of related columns)
  for (let i = 0; i < numericColumns.length && featuresCreated.length < 10; i++) {
    for (let j = i + 1; j < numericColumns.length && featuresCreated.length < 10; j++) {
      const col1 = numericColumns[i];
      const col2 = numericColumns[j];
      
      // Create ratio feature
      const ratioName = `${col1}_to_${col2}_ratio`;
      engineeredData = engineeredData.map(row => ({
        ...row,
        [ratioName]: (Number(row[col1]) / (Number(row[col2]) + 1e-9)) || 0
      }));
      featuresCreated.push(ratioName);
      
      // Limit to avoid too many features
      if (featuresCreated.length >= 10) break;
    }
  }
  
  // 2. Create interaction features (multiplication of top numeric columns)
  const topColumns = numericColumns.slice(0, Math.min(3, numericColumns.length));
  for (let i = 0; i < topColumns.length && featuresCreated.length < 15; i++) {
    for (let j = i + 1; j < topColumns.length && featuresCreated.length < 15; j++) {
      const col1 = topColumns[i];
      const col2 = topColumns[j];
      
      const interactionName = `${col1}_x_${col2}`;
      engineeredData = engineeredData.map(row => ({
        ...row,
        [interactionName]: Number(row[col1]) * Number(row[col2])
      }));
      featuresCreated.push(interactionName);
    }
  }
  
  // 3. Create centered features (subtract median) for top numeric columns
  topColumns.slice(0, 3).forEach(col => {
    if (featuresCreated.length >= 20) return;
    
    const centeredName = `${col}_centered`;
    const median = medians[col];
    engineeredData = engineeredData.map(row => ({
      ...row,
      [centeredName]: Number(row[col]) - median
    }));
    featuresCreated.push(centeredName);
  });
  
  // 4. Create binary flags (above/below median) for top numeric columns
  topColumns.slice(0, 2).forEach(col => {
    if (featuresCreated.length >= 25) return;
    
    const flagName = `${col}_high_flag`;
    const median = medians[col];
    engineeredData = engineeredData.map(row => ({
      ...row,
      [flagName]: Number(row[col]) > median ? 1 : 0
    }));
    featuresCreated.push(flagName);
  });
  
  // Clean up any Infinity or NaN values
  engineeredData = engineeredData.map(row => {
    const cleanRow = { ...row };
    for (const key in cleanRow) {
      if (cleanRow[key] === Infinity || cleanRow[key] === -Infinity || isNaN(cleanRow[key])) {
        cleanRow[key] = 0;
      }
    }
    return cleanRow;
  });
  
  return { 
    data: engineeredData, 
    featuresCreated, 
    featureType: 'generic' 
  };
};

// Step 7.5: Encode categorical columns
export const encodeCategoricalColumns = (data: any[]): {
  data: any[],
  encodedColumns: string[],
  encodingMaps: { [column: string]: { [value: string]: number } }
} => {
  if (!data || data.length === 0) {
    return { data, encodedColumns: [], encodingMaps: {} };
  }

  const encodedColumns: string[] = [];
  const encodingMaps: { [column: string]: { [value: string]: number } } = {};
  let encodedData = [...data];

  // Find all categorical columns
  const columns = Object.keys(data[0]);
  
  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    // Check if column is categorical (not numeric)
    const isNumeric = nonNullValues.every(v => typeof v === 'number' || !isNaN(Number(v)));
    
    if (!isNumeric && nonNullValues.length > 0) {
      // Get unique values
      const uniqueValues = Array.from(new Set(nonNullValues));
      
      // Only encode if it's low cardinality (≤ 10 unique values)
      if (uniqueValues.length <= 10) {
        // Create encoding map
        const encodingMap: { [value: string]: number } = {};
        uniqueValues.forEach((value, index) => {
          encodingMap[String(value)] = index;
        });
        
        // Apply encoding
        encodedData = encodedData.map(row => ({
          ...row,
          [column]: encodingMap[String(row[column])] !== undefined 
            ? encodingMap[String(row[column])] 
            : row[column]
        }));
        
        encodedColumns.push(column);
        encodingMaps[column] = encodingMap;
      }
    }
  });

  return { data: encodedData, encodedColumns, encodingMaps };
};

interface BinConfig {
  column: string;
  bins: number[];
  labels: string[];
}

// Step 8: Generic smart binning function
export const addBinnedColumns = (data: any[]): {
  data: any[],
  binConfigs: BinConfig[],
  columnsSkipped: string[],
  qualityBinCounts?: any,
  alcoholBinCounts?: any
} => {
  if (!data || data.length === 0) {
    return { data, binConfigs: [], columnsSkipped: [] };
  }

  const binConfigs: BinConfig[] = [];
  const columnsSkipped: string[] = [];
  let binnedData = [...data];

  // Automatically detect numeric columns suitable for binning
  const columns = Object.keys(data[0]);
  
  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
    
    // Check if column is numeric
    const isNumeric = values.every(v => typeof v === 'number' || !isNaN(Number(v)));
    
    if (isNumeric && values.length > 0) {
      const numericValues = values.map(v => Number(v));
      const uniqueCount = new Set(numericValues).size;
      
      // Only bin if there are enough unique values (between 10 and 100)
      // Too few = already categorical, too many = continuous is better
      if (uniqueCount >= 10 && uniqueCount <= 100) {
        // Calculate quartiles for automatic binning
        const sorted = [...numericValues].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q2 = sorted[Math.floor(sorted.length * 0.5)]; // median
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        
        binConfigs.push({
          column: column,
          bins: [-Infinity, q1, q2, q3, Infinity],
          labels: ['very_low', 'low', 'medium', 'high', 'very_high']
        });
      } else {
        columnsSkipped.push(column);
      }
    }
  });

  // Apply binning
  binConfigs.forEach(config => {
    const newColumnName = `${config.column}_bin`;
    binnedData = binnedData.map(row => ({
      ...row,
      [newColumnName]: applyBins(row[config.column], config.bins, config.labels)
    }));
  });

  return {
    data: binnedData,
    binConfigs,
    columnsSkipped,
    qualityBinCounts: undefined,
    alcoholBinCounts: undefined
  };
};

// Helper function to apply bins
const applyBins = (value: number, bins: number[], labels: string[]): string => {
  for (let i = 0; i < bins.length - 1; i++) {
    if (value > bins[i] && value <= bins[i + 1]) {
      return labels[i];
    }
  }
  return labels[labels.length - 1];
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay

// Single dataset pipeline function
export const cleanSingleDataset = async (dataset: any[], onProgress: (summaryStep: { key: string, value: any }) => void) => {
  // Validate input
  if (!dataset || !Array.isArray(dataset)) {
    throw new Error('Invalid dataset: Expected an array of data rows');
  }
  
  if (dataset.length === 0) {
    throw new Error('Dataset is empty: No rows to process');
  }
  
  if (!dataset[0] || typeof dataset[0] !== 'object') {
    throw new Error('Invalid dataset format: Rows must be objects with column names');
  }
  
  onProgress({ key: 'initialRows1', value: dataset.length }); await yieldToMain();
  onProgress({ key: 'processingMode', value: 'single' }); await yieldToMain();
  
  // Step 1: Normalize column names
  let processedData = normalizeColumns(dataset);
  onProgress({ key: 'commonColumns', value: Object.keys(processedData[0] || {}).length }); await yieldToMain();
  
  // Step 2: Convert to numeric
  processedData = convertToNumeric(processedData);
  
  // Step 3: Remove duplicates
  const { data: uniqueData, removedCount } = removeDuplicates(processedData);
  processedData = uniqueData;
  onProgress({ key: 'duplicatesRemoved', value: removedCount }); await yieldToMain();
  
  // Step 4: Fill missing values
  const { data: filledData, filledCount, filledCounts } = fillMissingValues(processedData);
  processedData = filledData;
  onProgress({ key: 'missingValuesFilled', value: filledCount }); await yieldToMain();
  onProgress({ key: 'filledCounts', value: filledCounts }); await yieldToMain();
  
  onProgress({ key: 'finalRows', value: processedData.length }); await yieldToMain();
  
  return { data: processedData, commonColumns: Object.keys(processedData[0] || {}) };
};

// Main pipeline function
export const cleanAndMerge = async (dataset1: any[], dataset2: any[], onProgress: (summaryStep: { key: string, value: any }) => void) => {
  // Validate inputs
  if (!dataset1 || !Array.isArray(dataset1) || dataset1.length === 0) {
    throw new Error('Invalid dataset 1: Expected a non-empty array of data rows');
  }
  
  if (!dataset2 || !Array.isArray(dataset2) || dataset2.length === 0) {
    throw new Error('Invalid dataset 2: Expected a non-empty array of data rows');
  }
  
  if (!dataset1[0] || typeof dataset1[0] !== 'object') {
    throw new Error('Invalid dataset 1 format: Rows must be objects with column names');
  }
  
  if (!dataset2[0] || typeof dataset2[0] !== 'object') {
    throw new Error('Invalid dataset 2 format: Rows must be objects with column names');
  }
  
  onProgress({ key: 'initialRows1', value: dataset1.length }); await yieldToMain();
  onProgress({ key: 'initialRows2', value: dataset2.length }); await yieldToMain();
  onProgress({ key: 'processingMode', value: 'merged' }); await yieldToMain();
  let norm1 = normalizeColumns(dataset1);
  let norm2 = normalizeColumns(dataset2);

  // Don't add any source/type column - preserve original data as-is

    const commonColumns = findCommonColumns(norm1, norm2);
  onProgress({ key: 'commonColumns', value: commonColumns.length }); await yieldToMain();
  onProgress({ key: 'commonColumnsList', value: commonColumns }); await yieldToMain();

    const aligned1 = alignDatasets(norm1, commonColumns);
  const aligned2 = alignDatasets(norm2, commonColumns);

    let mergedData = [...aligned1, ...aligned2];

    mergedData = convertToNumeric(mergedData);

  const { data: uniqueData, removedCount } = removeDuplicates(mergedData);
  mergedData = uniqueData;
  onProgress({ key: 'duplicatesRemoved', value: removedCount }); await yieldToMain();

    const { data: filledData, filledCount, filledCounts } = fillMissingValues(mergedData);
  mergedData = filledData;
  onProgress({ key: 'missingValuesFilled', value: filledCount }); await yieldToMain();
  onProgress({ key: 'filledCounts', value: filledCounts }); await yieldToMain();

  onProgress({ key: 'finalRows', value: mergedData.length }); await yieldToMain();
    return { data: mergedData, commonColumns };
};
