// Step 1: Normalize column names
export const normalizeColumns = (data: any[]) => {
  return data.map(row => {
    const newRow: { [key: string]: any } = {};
    for (const key in row) {
      const newKey = key
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/^_+|_+$/g, '');
      newRow[newKey] = row[key];
    }
    return newRow;
  });
};

// Step 2: Add a 'type' column
export const addTypeColumn = (data: any[], type: string) => {
  return data.map(row => ({ ...row, type }));
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
    if (data.length === 0) return { data, filledCount: 0 };
    const keys = Object.keys(data[0]);
    const numericKeys = keys.filter(key => typeof data[0][key] === 'number');
    const medians: { [key: string]: number } = {};

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
            }
        });
        return newRow;
    });
    return { data: processedData, filledCount };
};

export const engineerFeatures = (data: any[]) => {
  return data.map(row => {
    const newRow = { ...row };

    newRow.so2_ratio = (newRow.free_sulfur_dioxide / (newRow.total_sulfur_dioxide + 1e-9)) || 0;
    newRow.chlorides_to_sulphates = (newRow.chlorides / (newRow.sulphates + 1e-9)) || 0;
    newRow.total_acidity_proxy = newRow.fixed_acidity + newRow.volatile_acidity + newRow.citric_acid;
    newRow.alcohol_x_sulphates = newRow.alcohol * newRow.sulphates;

    const getMedian = (values: number[]) => {
      if (values.length === 0) return 0;
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };

    const densityMedian = getMedian(data.map(r => r.density).filter(v => v !== null));
    const fixedAcidityMedian = getMedian(data.map(r => r.fixed_acidity).filter(v => v !== null));

    newRow.density_centered = newRow.density - densityMedian;
    newRow.high_acidity_flag = newRow.fixed_acidity > fixedAcidityMedian ? 1 : 0;

    // Replace Infinity and NaN with 0
    for (const key in newRow) {
      if (newRow[key] === Infinity || isNaN(newRow[key])) {
        newRow[key] = 0;
      }
    }

    return newRow;
  });
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay

// Main pipeline function
export const cleanAndMerge = async (dataset1: any[], dataset2: any[], onProgress: (summaryStep: { key: string, value: number }) => void) => {
    onProgress({ key: 'initialRows1', value: dataset1.length }); await yieldToMain();
  onProgress({ key: 'initialRows2', value: dataset2.length }); await yieldToMain();
  let norm1 = normalizeColumns(dataset1);
  let norm2 = normalizeColumns(dataset2);

    norm1 = addTypeColumn(norm1, 'red');
  norm2 = addTypeColumn(norm2, 'white');

    const commonColumns = findCommonColumns(norm1, norm2);
  onProgress({ key: 'commonColumns', value: commonColumns.length }); await yieldToMain();

    const aligned1 = alignDatasets(norm1, commonColumns);
  const aligned2 = alignDatasets(norm2, commonColumns);

    let mergedData = [...aligned1, ...aligned2];

    mergedData = convertToNumeric(mergedData);

  const { data: uniqueData, removedCount } = removeDuplicates(mergedData);
  mergedData = uniqueData;
  onProgress({ key: 'duplicatesRemoved', value: removedCount }); await yieldToMain();

    const { data: filledData, filledCount } = fillMissingValues(mergedData);
  mergedData = filledData;
  onProgress({ key: 'missingValuesFilled', value: filledCount }); await yieldToMain();

  onProgress({ key: 'finalRows', value: mergedData.length }); await yieldToMain();
    return { data: mergedData };
};
