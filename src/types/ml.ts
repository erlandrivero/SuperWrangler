export interface MLResult {
  algorithm: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number | null;
  cvF1Mean: number;
  cvF1Std: number;
  trainingTime: number;
  predictionTime: number;
  trainScore: number;
  testScore: number;
  confusionMatrix: number[][];
  featureImportance?: { feature: string; importance: number }[];
  hyperparameters: Record<string, any>;
  status: 'success' | 'failed' | 'timeout';
  error?: string;
}

export interface MLTrainingData {
  features: number[][];
  target: number[];
  featureNames: string[];
  targetName: string;
}

export interface MLSummary {
  results: MLResult[];
  bestModel: MLResult;
  totalTime: number;
  successCount: number;
  failureCount: number;
}
