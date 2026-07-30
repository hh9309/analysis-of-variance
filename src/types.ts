/**
 * Types and interfaces for Orthogonal Design & ANOVA Intelligent Lab
 */

export interface Factor {
  id: string;
  name: string; // e.g. "温度 (°C)" or "Factor A"
  code: string; // e.g. "A", "B", "C"
  levels: (number | string)[]; // e.g. [150, 160, 170]
  unit?: string;
}

export interface OrthogonalArrayDef {
  id: string;
  name: string; // e.g. "L9 (3^4)"
  runs: number; // e.g. 9
  numFactors: number; // e.g. 4
  levelsPerFactor: number[]; // e.g. [3, 3, 3, 3]
  description: string;
  suitableFor: string;
  matrix: number[][]; // 1-indexed level indices (e.g. 1, 2, 3)
}

export interface ExperimentRun {
  runIndex: number; // 1-based
  factorLevels: Record<string, number>; // factor.code -> level index (1-based)
  value: number; // experimental result/yield
}

export interface RangeAnalysisFactorResult {
  code: string;
  name: string;
  levelSums: Record<number, number>; // level index (1-based) -> sum K_i
  levelMeans: Record<number, number>; // level index (1-based) -> mean k_i
  levelCounts: Record<number, number>; // count per level
  rangeR: number; // Max k_i - Min k_i
  bestLevel: number; // level index (1-based) giving max or min based on goal
  bestLevelValue: number | string;
}

export interface RangeAnalysisResult {
  factors: RangeAnalysisFactorResult[];
  rankedFactorCodes: string[]; // sorted by rangeR descending
  optimalCombination: Record<string, { level: number; value: number | string }>;
  goal: "maximize" | "minimize";
  overallMean: number;
}

export interface AnovaFactorItem {
  code: string;
  name: string;
  ss: number; // Sum of Squares SS_Factor
  df: number; // Degrees of Freedom
  ms: number; // Mean Square MS_Factor
  fVal: number; // F statistic
  pVal: number; // p-value
  significant: "highly_sig" | "significant" | "not_sig"; // p < 0.01, p < 0.05, or p >= 0.05
}

export interface AnovaResult {
  factors: AnovaFactorItem[];
  errorSs: number;
  errorDf: number;
  errorMs: number;
  totalSs: number;
  totalDf: number;
  grandMean: number;
  count: number;
}

export interface QQPoint {
  theoreticalQuantile: number;
  sampleResidual: number;
  standardizedResidual: number;
}

export interface InteractionPair {
  factorA: string; // code A
  factorB: string; // code B
  interactionMeans: Record<string, number>; // "levelA_levelB" -> mean value
  hasInteraction: boolean; // whether lines cross significantly
}

export interface ClassicCase {
  id: string;
  title: string;
  category: "chemical" | "industrial" | "biomedical";
  tag: string;
  description: string;
  targetMetric: string;
  targetGoal: "maximize" | "minimize";
  unit: string;
  arrayId: string;
  factors: Factor[];
  runsData: number[]; // response values for each run in matrix
  backgroundContext: string;
  engineeringTakeaways: string[];
}
