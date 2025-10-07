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
