declare module 'ml-random-forest' {
  export class RandomForestClassifier {
    constructor(options?: {
      seed?: number;
      maxFeatures?: number;
      replacement?: boolean;
      nEstimators?: number;
    });
    train(features: number[][], labels: number[]): void;
    predict(features: number[][]): number[];
  }
}

declare module 'ml-cart' {
  export class DecisionTreeClassifier {
    constructor(options?: {
      gainFunction?: string;
      maxDepth?: number;
      minNumSamples?: number;
    });
    train(features: number[][], labels: number[]): void;
    predict(features: number[][]): number[];
  }
}

declare module 'ml-naivebayes' {
  export default class NaiveBayes {
    constructor();
    train(features: number[][], labels: number[]): void;
    predict(features: number[][]): number[];
  }
}

declare module 'ml-svm' {
  export class SVM {
    constructor(options?: {
      kernel?: string;
      C?: number;
      gamma?: number;
    });
    train(features: number[][], labels: number[]): void;
    predict(features: number[][]): number[];
  }
}
