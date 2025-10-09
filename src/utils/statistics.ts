// A simple correlation calculation (Pearson correlation)
export const calculateCorrelationMatrix = (data: any[], columns: string[]) => {
  const matrix: { [key: string]: { [key: string]: number } } = {};
  for (const col1 of columns) {
    matrix[col1] = {};
    for (const col2 of columns) {
      if (col1 === col2) {
        matrix[col1][col2] = 1;
      } else {
        matrix[col1][col2] = calculateCorrelation(data, col1, col2);
      }
    }
  }
  return matrix;
};

export const calculateCorrelation = (data: any[], col1: string, col2: string) => {
    const values1 = data.map(d => d[col1]);
    const values2 = data.map(d => d[col2]);

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

    const stdDev1 = Math.sqrt(values1.map(x => Math.pow(x - mean1, 2)).reduce((a, b) => a + b, 0) / values1.length);
    const stdDev2 = Math.sqrt(values2.map(x => Math.pow(x - mean2, 2)).reduce((a, b) => a + b, 0) / values2.length);

    let covariance = 0;
    for (let i = 0; i < values1.length; i++) {
        covariance += (values1[i] - mean1) * (values2[i] - mean2);
    }
    covariance /= values1.length;

    return covariance / (stdDev1 * stdDev2);
};

export const calculateColumnStats = (data: any[]) => {
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  const stats = headers.map(header => {
    const values = data.map(row => row[header]).filter(v => v !== null && v !== undefined);
    const numericValues = values.map(Number).filter(v => !isNaN(v));

    const isNumeric = numericValues.length > values.length * 0.8; // Heuristic for numeric column

    let stat: any = {
      column: header,
      dataType: isNumeric ? 'numeric' : 'categorical',
      nonNullCount: values.length,
      uniqueCount: new Set(values).size,
      min: '-',
      max: '-',
      mean: '-'
    };

    if (isNumeric && numericValues.length > 0) {
      stat.min = Math.min(...numericValues).toFixed(2);
      stat.max = Math.max(...numericValues).toFixed(2);
      stat.mean = (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2);
    }

    return stat;
  });

  return stats;
};

export interface BalanceReport {
  targetColumn: string;
  classes: { value: string | number; count: number; percentage: number }[];
  isBalanced: boolean;
  imbalanceRatio: number;
  recommendation: string;
  status: 'balanced' | 'slightly_imbalanced' | 'imbalanced' | 'severely_imbalanced';
}

export function checkBalance(data: any[], targetColumn?: string): BalanceReport | null {
  if (!data || data.length === 0) return null;

  // Auto-detect target column if not provided
  let detectedColumn = targetColumn;
  
  if (!detectedColumn) {
    const columns = Object.keys(data[0]);
    
    // Look for common target column names (prioritize these)
    // Order matters - more specific names first
    const targetNames = ['quality', 'target', 'label', 'class', 'churn', 'outcome', 'classification', 'category', 'type', 'y'];
    
    // First, try exact matches (case-insensitive)
    detectedColumn = columns.find(col => 
      targetNames.some(name => col.toLowerCase() === name)
    );
    
    // If no exact match, try partial matches
    if (!detectedColumn) {
      detectedColumn = columns.find(col => 
        targetNames.some(name => col.toLowerCase().includes(name))
      );
    }
    
    // Log if found by name
    if (detectedColumn) {
      console.log(`✓ Auto-detected target column by name: "${detectedColumn}"`);
    }
    
    // If not found, use robust statistical detection
    if (!detectedColumn) {
      const columnStats = columns.map(col => {
        const values = data.map(row => row[col]);
        const uniqueValues = Array.from(new Set(values));
        const uniqueCount = uniqueValues.length;
        
        // Calculate various statistics
        const numericValues = values.filter(v => !isNaN(Number(v))).map(Number);
        const integerCount = numericValues.filter(v => Number.isInteger(v)).length;
        const hasDecimals = numericValues.some(v => !Number.isInteger(v));
        
        // Check if values look like IDs (sequential, unique for most rows)
        const isLikelyID = uniqueCount > data.length * 0.9 || 
                          col.toLowerCase().includes('id') ||
                          col.toLowerCase().includes('index');
        
        // Check value range (continuous variables often have wide ranges)
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const range = max - min;
        const avgGap = range / uniqueCount;
        
        // Continuous variables have small average gaps between unique values
        const isContinuous = hasDecimals && avgGap < 1 && uniqueCount > 20;
        
        // Calculate a "categorical score" (higher = more likely to be categorical target)
        let categoricalScore = 0;
        
        // Prefer 2-20 unique values (classification sweet spot)
        if (uniqueCount >= 2 && uniqueCount <= 20) categoricalScore += 100;
        else if (uniqueCount > 20 && uniqueCount <= 50) categoricalScore += 20;
        
        // Prefer integer values
        if (integerCount === numericValues.length) categoricalScore += 50;
        else if (integerCount > numericValues.length * 0.9) categoricalScore += 25;
        
        // Penalize ID-like columns
        if (isLikelyID) categoricalScore -= 200;
        
        // Penalize continuous variables
        if (isContinuous) categoricalScore -= 150;
        
        // Prefer columns with balanced distribution
        const valueCounts = uniqueValues.map(uv => values.filter(v => v === uv).length);
        const maxCount = Math.max(...valueCounts);
        const minCount = Math.min(...valueCounts);
        const balanceRatio = minCount / maxCount;
        if (balanceRatio > 0.1) categoricalScore += 30; // Reasonably balanced
        
        // Prefer columns that are not the first or last (often IDs or timestamps)
        const colIndex = columns.indexOf(col);
        if (colIndex > 0 && colIndex < columns.length - 1) categoricalScore += 10;
        
        return {
          column: col,
          uniqueCount,
          values: uniqueValues.slice(0, 20),
          categoricalScore,
          isLikelyID,
          isContinuous,
          hasDecimals
        };
      });
      
      // Sort by categorical score (highest first)
      columnStats.sort((a, b) => b.categoricalScore - a.categoricalScore);
      
      // Filter to only positive scores
      const candidates = columnStats.filter(s => s.categoricalScore > 0);
      
      if (candidates.length > 0) {
        detectedColumn = candidates[0].column;
        console.log(`✓ Auto-detected target column: "${detectedColumn}" (${candidates[0].uniqueCount} classes, score: ${candidates[0].categoricalScore})`);
        console.log(`  Other candidates: ${candidates.slice(1, 4).map(c => `${c.column}(${c.uniqueCount}, score:${c.categoricalScore})`).join(', ')}`);
        
        // Warn if score is low
        if (candidates[0].categoricalScore < 50) {
          console.warn(`⚠️ Low confidence in target detection. Consider manually specifying the target column.`);
        }
      } else {
        // No good candidates found
        console.warn(`⚠️ No suitable target column found. Dataset may not be suitable for classification.`);
        console.log(`  All columns: ${columnStats.map(c => `${c.column}(${c.uniqueCount}, ${c.isContinuous ? 'continuous' : 'discrete'})`).join(', ')}`);
      }
    }
  }
  
  if (!detectedColumn) {
    console.error('❌ Could not detect target column. Dataset may not be suitable for classification.');
    return null;
  }
  
  // Count values for each class
  const classCounts: { [key: string]: number } = {};
  data.forEach(row => {
    const value = String(row[detectedColumn]);
    classCounts[value] = (classCounts[value] || 0) + 1;
  });
  
  // Calculate percentages
  const classes = Object.entries(classCounts).map(([value, count]) => ({
    value,
    count,
    percentage: (count / data.length) * 100
  }));
  
  // Sort by count descending
  classes.sort((a, b) => b.count - a.count);
  
  // Calculate imbalance metrics
  const maxCount = classes[0].count;
  const minCount = classes[classes.length - 1].count;
  const maxPercentage = (maxCount / data.length) * 100;
  const imbalanceRatio = maxCount / minCount;
  
  // Determine balance status
  let isBalanced = false;
  let status: 'balanced' | 'slightly_imbalanced' | 'imbalanced' | 'severely_imbalanced';
  let recommendation = '';
  
  if (maxPercentage < 60) {
    isBalanced = true;
    status = 'balanced';
    recommendation = 'Dataset is balanced. No action needed.';
  } else if (maxPercentage < 70) {
    status = 'slightly_imbalanced';
    recommendation = 'Minor imbalance detected. Consider using stratified sampling when splitting train/test data.';
  } else if (maxPercentage < 85) {
    status = 'imbalanced';
    recommendation = 'Dataset is imbalanced. Recommended actions: (1) Use SMOTE or other oversampling techniques, (2) Apply class weights in your model, (3) Use stratified sampling.';
  } else {
    status = 'severely_imbalanced';
    recommendation = 'Dataset is severely imbalanced. Recommended actions: (1) Use advanced resampling techniques (SMOTE, ADASYN), (2) Apply class weights, (3) Consider ensemble methods, (4) Use appropriate evaluation metrics (F1, precision/recall instead of accuracy).';
  }
  
  return {
    targetColumn: detectedColumn,
    classes,
    isBalanced,
    imbalanceRatio,
    recommendation,
    status
  };
}
