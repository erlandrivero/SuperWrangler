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
    
    // Look for common target column names
    const targetNames = ['target', 'label', 'class', 'churn', 'quality', 'outcome', 'y'];
    detectedColumn = columns.find(col => 
      targetNames.some(name => col.toLowerCase().includes(name))
    );
    
    // If not found, find column with lowest unique count (likely categorical target)
    if (!detectedColumn) {
      const columnStats = columns.map(col => ({
        column: col,
        uniqueCount: new Set(data.map(row => row[col])).size
      }));
      
      // Filter to columns with reasonable number of classes (2-20)
      const candidates = columnStats.filter(s => s.uniqueCount >= 2 && s.uniqueCount <= 20);
      
      if (candidates.length > 0) {
        // Sort by unique count and pick the one with fewest unique values
        candidates.sort((a, b) => a.uniqueCount - b.uniqueCount);
        detectedColumn = candidates[0].column;
      }
    }
  }
  
  if (!detectedColumn) return null;
  
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
