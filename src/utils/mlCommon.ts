import type { MLTrainingData } from '../types/ml';

export function prepareMLData(
  data: any[],
  targetColumn: string,
  excludeColumns: string[] = []
): MLTrainingData {
  if (!data || data.length === 0) {
    throw new Error('No data provided for ML training');
  }

  // Get all numeric columns except target and excluded
  const allColumns = Object.keys(data[0]);
  const featureNames = allColumns.filter(
    col => col !== targetColumn && 
    !excludeColumns.includes(col) &&
    typeof data[0][col] === 'number'
  );

  if (featureNames.length === 0) {
    throw new Error('No numeric features found for training');
  }

  // Extract features and target
  const features: number[][] = [];
  const target: number[] = [];

  for (const row of data) {
    // Skip rows with missing target
    if (row[targetColumn] === null || row[targetColumn] === undefined) {
      continue;
    }

    const featureRow = featureNames.map(col => {
      const val = row[col];
      return val === null || val === undefined ? 0 : Number(val);
    });

    features.push(featureRow);
    target.push(Number(row[targetColumn]));
  }

  // Check if we need to convert to binary for better performance
  const uniqueTargets = Array.from(new Set(target)).sort((a, b) => a - b);
  let processedTarget = target;
  
  // Log target info for debugging
  console.log(`Target column: ${targetColumn}`);
  console.log(`Number of classes: ${uniqueTargets.length}`);
  console.log(`Class values: ${uniqueTargets.slice(0, 10).join(', ')}${uniqueTargets.length > 10 ? '...' : ''}`);
  
  // Warn if too many classes (likely wrong target or regression problem)
  if (uniqueTargets.length > 20) {
    console.warn(`⚠️ WARNING: ${uniqueTargets.length} classes detected! This might be:`);
    console.warn(`  - Wrong target column (check if "${targetColumn}" is correct)`);
    console.warn(`  - Regression problem (continuous values, not classification)`);
    console.warn(`  - ID column mistaken as target`);
    console.warn(`Proceeding anyway, but results may be poor.`);
  }
  
  // If more than 2 classes and values look like ratings (3-10), convert to binary
  if (uniqueTargets.length > 2 && uniqueTargets.length <= 20 && uniqueTargets.every(v => v >= 3 && v <= 10)) {
    // Convert to binary: >= median is "high" (1), < median is "low" (0)
    const median = uniqueTargets[Math.floor(uniqueTargets.length / 2)];
    processedTarget = target.map(val => val >= median ? 1 : 0);
    console.log(`✓ Converted ${uniqueTargets.length}-class problem to binary (threshold: ${median})`);
    console.log(`  New distribution: 0=${processedTarget.filter(v => v === 0).length}, 1=${processedTarget.filter(v => v === 1).length}`);
  }

  return {
    features,
    target: processedTarget,
    featureNames,
    targetName: targetColumn
  };
}

export function trainTestSplit(
  features: number[][],
  target: number[],
  testSize: number = 0.25,
  randomState: number = 42
): {
  xTrain: number[][];
  xTest: number[][];
  yTrain: number[];
  yTest: number[];
} {
  const n = features.length;
  const testCount = Math.floor(n * testSize);
  
  // Create indices and shuffle with seed
  const indices = Array.from({ length: n }, (_, i) => i);
  
  // Simple seeded shuffle
  let seed = randomState;
  for (let i = indices.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const testIndices = indices.slice(0, testCount);
  const trainIndices = indices.slice(testCount);

  return {
    xTrain: trainIndices.map(i => features[i]),
    xTest: testIndices.map(i => features[i]),
    yTrain: trainIndices.map(i => target[i]),
    yTest: testIndices.map(i => target[i])
  };
}

export function calculateMetrics(
  yTrue: number[],
  yPred: number[],
  yProba: number[][] | null = null
): {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number | null;
} {
  const n = yTrue.length;
  
  // Get unique classes
  const classes = Array.from(new Set([...yTrue, ...yPred])).sort();
  
  // Calculate accuracy (works for both binary and multi-class)
  let correct = 0;
  for (let i = 0; i < n; i++) {
    if (yTrue[i] === yPred[i]) correct++;
  }
  const accuracy = correct / n;
  
  // For multi-class, calculate macro-averaged precision, recall, F1
  let totalPrecision = 0;
  let totalRecall = 0;
  let validClasses = 0;
  
  for (const cls of classes) {
    let tp = 0, fp = 0, fn = 0;
    
    for (let i = 0; i < n; i++) {
      if (yTrue[i] === cls && yPred[i] === cls) tp++;
      else if (yTrue[i] !== cls && yPred[i] === cls) fp++;
      else if (yTrue[i] === cls && yPred[i] !== cls) fn++;
    }
    
    const classPrecision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const classRecall = tp + fn > 0 ? tp / (tp + fn) : 0;
    
    if (tp + fp > 0 || tp + fn > 0) {
      totalPrecision += classPrecision;
      totalRecall += classRecall;
      validClasses++;
    }
  }
  
  const precision = validClasses > 0 ? totalPrecision / validClasses : 0;
  const recall = validClasses > 0 ? totalRecall / validClasses : 0;
  const f1Score = precision + recall > 0 
    ? 2 * (precision * recall) / (precision + recall) 
    : 0;

  // Calculate ROC-AUC if probabilities provided (binary only)
  let rocAuc: number | null = null;
  if (yProba && yProba.length > 0 && classes.length === 2) {
    rocAuc = calculateROCAUC(yTrue, yProba.map(p => p[1] || p[0]));
  }

  return { accuracy, precision, recall, f1Score, rocAuc };
}

function calculateROCAUC(yTrue: number[], yScores: number[]): number {
  // Simple ROC-AUC calculation
  const pairs: [number, number][] = yTrue.map((y, i) => [yScores[i], y]);
  pairs.sort((a, b) => b[0] - a[0]); // Sort by score descending

  let auc = 0;
  let positives = 0;
  let negatives = 0;

  for (const [, label] of pairs) {
    if (label === 1) {
      positives++;
    } else {
      auc += positives;
      negatives++;
    }
  }

  return positives * negatives > 0 ? auc / (positives * negatives) : 0.5;
}

export function createConfusionMatrix(yTrue: number[], yPred: number[]): number[][] {
  const classes = Array.from(new Set([...yTrue, ...yPred])).sort();
  const matrix: number[][] = Array(classes.length)
    .fill(0)
    .map(() => Array(classes.length).fill(0));

  for (let i = 0; i < yTrue.length; i++) {
    const trueIdx = classes.indexOf(yTrue[i]);
    const predIdx = classes.indexOf(yPred[i]);
    matrix[trueIdx][predIdx]++;
  }

  return matrix;
}

export function crossValidate(
  model: any,
  features: number[][],
  target: number[],
  nFolds: number = 5
): { mean: number; std: number } {
  const foldSize = Math.floor(features.length / nFolds);
  const scores: number[] = [];

  for (let i = 0; i < nFolds; i++) {
    const testStart = i * foldSize;
    const testEnd = i === nFolds - 1 ? features.length : (i + 1) * foldSize;

    const xTest = features.slice(testStart, testEnd);
    const yTest = target.slice(testStart, testEnd);
    const xTrain = [...features.slice(0, testStart), ...features.slice(testEnd)];
    const yTrain = [...target.slice(0, testStart), ...target.slice(testEnd)];

    // Clone and train model
    const foldModel = cloneModel(model);
    foldModel.train(xTrain, yTrain);
    const yPred = foldModel.predict(xTest);

    const metrics = calculateMetrics(yTest, yPred);
    scores.push(metrics.f1Score);
  }

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const std = Math.sqrt(variance);

  return { mean, std };
}

function cloneModel(model: any): any {
  // Simple model cloning - create new instance with same constructor
  return Object.create(Object.getPrototypeOf(model));
}
