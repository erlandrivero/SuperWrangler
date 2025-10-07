export interface ColumnAnalysis {
  column: string;
  dataType: string;
  uniqueValues: number;
  nonNullCount: number;
  nullCount: number;
  recommendation: string;
  details: string;
  sampleValues: string[];
}

export function analyzeColumns(data: any[], threshold: number = 50): ColumnAnalysis[] {
  if (!data || data.length === 0) return [];

  const columns = Object.keys(data[0]);
  const analyses: ColumnAnalysis[] = [];

  columns.forEach(column => {
    // Get all values for this column
    const values = data.map(row => row[column]);
    
    // Count nulls
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = values.length - nonNullValues.length;
    const nonNullCount = nonNullValues.length;
    
    // Count unique values
    const uniqueSet = new Set(nonNullValues);
    const uniqueValues = uniqueSet.size;
    
    // Detect data type
    const isNumeric = nonNullValues.every(v => typeof v === 'number' || !isNaN(Number(v)));
    const dataType = isNumeric ? 'numeric' : 'categorical';
    
    // Get sample values (first 3 unique)
    const sampleValues = Array.from(uniqueSet).slice(0, 3).map(v => String(v));
    
    // Make recommendation
    let recommendation = '';
    let details = '';
    
    if (dataType === 'numeric') {
      if (uniqueValues === 2) {
        recommendation = 'Keep (Binary numeric)';
        details = 'Binary numeric column with 2 unique values. Suitable for modeling.';
      } else if (uniqueValues <= 10) {
        recommendation = 'Keep (Ordinal numeric)';
        details = `Numeric column with ${uniqueValues} unique values. May represent ordinal/categorical data.`;
      } else {
        recommendation = 'Keep (Continuous numeric)';
        details = `Continuous numeric column with ${uniqueValues} unique values. Good for modeling.`;
      }
    } else {
      // Categorical
      if (uniqueValues === 2) {
        recommendation = 'Keep (Binary category)';
        details = 'Binary categorical column. Perfect for encoding as 0/1.';
      } else if (uniqueValues <= threshold) {
        if (uniqueValues <= 10) {
          recommendation = 'Keep (Low cardinality)';
          details = `Categorical with ${uniqueValues} categories. Good for one-hot encoding.`;
        } else {
          recommendation = 'Keep but beware of dimensionality';
          details = `Categorical with ${uniqueValues} categories. One-hot encoding will create ${uniqueValues} columns. Consider target encoding or grouping rare categories.`;
        }
      } else {
        recommendation = 'Consider Dropping or Encoding Differently';
        details = `High cardinality categorical with ${uniqueValues} unique values. Too many categories for standard one-hot encoding. Consider: (1) dropping if it's an ID column, (2) target encoding, (3) grouping rare categories, or (4) using embeddings.`;
      }
    }
    
    // Special case: Check if it looks like an ID column
    const columnLower = column.toLowerCase();
    if ((columnLower.includes('id') || columnLower.includes('key')) && uniqueValues > data.length * 0.9) {
      recommendation = 'Consider Dropping (ID column)';
      details = `Appears to be an ID column with ${uniqueValues} unique values (${((uniqueValues / data.length) * 100).toFixed(1)}% of rows). ID columns typically don't provide predictive value and should be dropped.`;
    }
    
    analyses.push({
      column,
      dataType,
      uniqueValues,
      nonNullCount,
      nullCount,
      recommendation,
      details,
      sampleValues
    });
  });

  return analyses;
}

export function summarizeAnalysis(analyses: ColumnAnalysis[]): {
  totalColumns: number;
  keepColumns: number;
  reviewColumns: number;
  dropColumns: number;
} {
  return {
    totalColumns: analyses.length,
    keepColumns: analyses.filter(a => 
      a.recommendation.startsWith('Keep') && 
      !a.recommendation.includes('beware')
    ).length,
    reviewColumns: analyses.filter(a => 
      a.recommendation.includes('beware')
    ).length,
    dropColumns: analyses.filter(a => 
      a.recommendation.includes('Dropping') || 
      a.recommendation.includes('Consider Dropping')
    ).length
  };
}
