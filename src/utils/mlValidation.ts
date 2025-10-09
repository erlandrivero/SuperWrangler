import type { MLTrainingData } from '../types/ml';

export interface ValidationResult {
  isValid: boolean;
  targetType: 'binary' | 'multiclass' | 'regression' | 'unknown';
  numClasses: number;
  classDistribution: { value: number; count: number; percentage: number }[];
  warnings: string[];
  recommendations: string[];
  compatibleAlgorithms: string[];
  incompatibleAlgorithms: { name: string; reason: string }[];
}

export function validateMLData(mlData: MLTrainingData): ValidationResult {
  const { target, featureNames } = mlData;
  
  // Analyze target variable
  const uniqueTargets = Array.from(new Set(target)).sort((a, b) => a - b);
  const numClasses = uniqueTargets.length;
  
  // Calculate class distribution
  const classCounts: Record<number, number> = {};
  target.forEach(val => {
    classCounts[val] = (classCounts[val] || 0) + 1;
  });
  
  const classDistribution = Object.entries(classCounts)
    .map(([value, count]) => ({
      value: Number(value),
      count,
      percentage: (count / target.length) * 100
    }))
    .sort((a, b) => b.count - a.count);
  
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let targetType: 'binary' | 'multiclass' | 'regression' | 'unknown' = 'unknown';
  let isValid = true;
  
  // Determine target type
  if (numClasses === 1) {
    targetType = 'unknown';
    isValid = false;
    warnings.push('Only 1 unique value in target - cannot train models');
    recommendations.push('Check if target column is correct');
  } else if (numClasses === 2) {
    targetType = 'binary';
    recommendations.push('Binary classification - all algorithms compatible');
  } else if (numClasses <= 10) {
    targetType = 'multiclass';
    recommendations.push(`${numClasses}-class classification - some algorithms may perform poorly`);
  } else if (numClasses <= 20) {
    targetType = 'multiclass';
    warnings.push(`${numClasses} classes detected - this is a challenging multi-class problem`);
    recommendations.push('Consider grouping classes or converting to binary');
  } else {
    targetType = 'regression';
    warnings.push(`${numClasses} unique values - this appears to be a REGRESSION problem, not classification`);
    recommendations.push('Use regression algorithms instead, or bin values into classes');
    isValid = false;
  }
  
  // Check for class imbalance
  if (classDistribution.length > 0) {
    const maxPercentage = classDistribution[0].percentage;
    const minPercentage = classDistribution[classDistribution.length - 1].percentage;
    const imbalanceRatio = maxPercentage / minPercentage;
    
    if (imbalanceRatio > 10) {
      warnings.push(`Severe class imbalance detected (${imbalanceRatio.toFixed(1)}:1 ratio)`);
      recommendations.push('Consider using SMOTE, class weights, or stratified sampling');
    } else if (imbalanceRatio > 3) {
      warnings.push(`Moderate class imbalance detected (${imbalanceRatio.toFixed(1)}:1 ratio)`);
    }
  }
  
  // Check feature count
  if (featureNames.length < 2) {
    warnings.push('Very few features - model performance may be limited');
  } else if (featureNames.length > 50) {
    warnings.push('Many features detected - training may be slow');
    recommendations.push('Consider feature selection or dimensionality reduction');
  }
  
  // Check dataset size
  if (target.length < 50) {
    warnings.push('Very small dataset - results may not be reliable');
    recommendations.push('Collect more data if possible');
  } else if (target.length > 10000) {
    warnings.push('Large dataset - training may take longer');
  }
  
  // Determine compatible algorithms
  const compatibleAlgorithms: string[] = [];
  const incompatibleAlgorithms: { name: string; reason: string }[] = [];
  
  if (targetType === 'binary') {
    // All algorithms work with binary
    compatibleAlgorithms.push(
      'Random Forest',
      'Decision Tree',
      'K-Nearest Neighbors',
      'Naive Bayes',
      'Logistic Regression',
      'Support Vector Machine',
      'Neural Network'
    );
  } else if (targetType === 'multiclass' && numClasses <= 10) {
    // Multi-class compatible algorithms
    compatibleAlgorithms.push(
      'Random Forest',
      'Decision Tree',
      'K-Nearest Neighbors',
      'Naive Bayes'
    );
    
    // These are binary-only in current implementation
    incompatibleAlgorithms.push(
      { name: 'Logistic Regression', reason: 'Binary classification only (current implementation)' },
      { name: 'Support Vector Machine', reason: 'Binary classification only (current implementation)' },
      { name: 'Neural Network', reason: 'Binary classification only (current implementation)' }
    );
  } else if (targetType === 'multiclass' && numClasses > 10) {
    // High multi-class - only robust algorithms
    compatibleAlgorithms.push(
      'Random Forest',
      'Decision Tree',
      'K-Nearest Neighbors'
    );
    
    incompatibleAlgorithms.push(
      { name: 'Naive Bayes', reason: 'Too many classes - performance will be poor' },
      { name: 'Logistic Regression', reason: 'Binary classification only' },
      { name: 'Support Vector Machine', reason: 'Binary classification only' },
      { name: 'Neural Network', reason: 'Binary classification only' }
    );
  } else {
    // Regression or unknown - no algorithms compatible
    isValid = false;
    incompatibleAlgorithms.push(
      { name: 'All algorithms', reason: 'Dataset is not suitable for classification' }
    );
  }
  
  return {
    isValid,
    targetType,
    numClasses,
    classDistribution,
    warnings,
    recommendations,
    compatibleAlgorithms,
    incompatibleAlgorithms
  };
}

export function shouldConvertToBinary(validation: ValidationResult): boolean {
  // Convert to binary if:
  // 1. Multi-class with 3-10 classes
  // 2. Values look like ratings (3-10 range)
  // 3. Would improve algorithm compatibility
  
  if (validation.targetType !== 'multiclass') return false;
  if (validation.numClasses < 3 || validation.numClasses > 10) return false;
  
  const values = validation.classDistribution.map(c => c.value);
  const allInRatingRange = values.every(v => v >= 3 && v <= 10);
  
  return allInRatingRange && validation.compatibleAlgorithms.length < 5;
}
