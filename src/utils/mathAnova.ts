import {
  Factor,
  ExperimentRun,
  RangeAnalysisResult,
  RangeAnalysisFactorResult,
  AnovaResult,
  AnovaFactorItem,
  QQPoint,
  InteractionPair
} from "../types";

/**
 * Calculates Range Analysis (极差分析)
 */
export function calculateRangeAnalysis(
  factors: Factor[],
  runs: ExperimentRun[],
  goal: "maximize" | "minimize" = "maximize"
): RangeAnalysisResult {
  const totalRuns = runs.length;
  if (totalRuns === 0) {
    return {
      factors: [],
      rankedFactorCodes: [],
      optimalCombination: {},
      goal,
      overallMean: 0
    };
  }

  const overallSum = runs.reduce((acc, r) => acc + (r.value || 0), 0);
  const overallMean = overallSum / totalRuns;

  const factorResults: RangeAnalysisFactorResult[] = factors.map((factor) => {
    const levelSums: Record<number, number> = {};
    const levelCounts: Record<number, number> = {};
    const levelMeans: Record<number, number> = {};

    // Initialize level indices (1-indexed based on levels array length)
    factor.levels.forEach((_, idx) => {
      const levelIdx = idx + 1;
      levelSums[levelIdx] = 0;
      levelCounts[levelIdx] = 0;
    });

    runs.forEach((run) => {
      const lvl = run.factorLevels[factor.code];
      if (lvl) {
        levelSums[lvl] = (levelSums[lvl] || 0) + (run.value || 0);
        levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
      }
    });

    let maxK = -Infinity;
    let minK = Infinity;
    let bestLvl = 1;

    Object.keys(levelSums).forEach((lvlStr) => {
      const lvl = parseInt(lvlStr, 10);
      const count = levelCounts[lvl] || 1;
      const mean = levelSums[lvl] / count;
      levelMeans[lvl] = mean;

      if (mean > maxK) maxK = mean;
      if (mean < minK) minK = mean;
    });

    // Find best level index based on goal
    let targetMean = goal === "maximize" ? -Infinity : Infinity;
    Object.keys(levelMeans).forEach((lvlStr) => {
      const lvl = parseInt(lvlStr, 10);
      const mean = levelMeans[lvl];
      if (goal === "maximize") {
        if (mean > targetMean) {
          targetMean = mean;
          bestLvl = lvl;
        }
      } else {
        if (mean < targetMean) {
          targetMean = mean;
          bestLvl = lvl;
        }
      }
    });

    const rangeR = maxK - minK;
    const bestLevelVal = factor.levels[bestLvl - 1] ?? bestLvl;

    return {
      code: factor.code,
      name: factor.name,
      levelSums,
      levelMeans,
      levelCounts,
      rangeR,
      bestLevel: bestLvl,
      bestLevelValue: bestLevelVal
    };
  });

  // Rank factor codes by range R descending
  const rankedFactorCodes = [...factorResults]
    .sort((a, b) => b.rangeR - a.rangeR)
    .map((f) => f.code);

  const optimalCombination: Record<string, { level: number; value: number | string }> = {};
  factorResults.forEach((f) => {
    optimalCombination[f.code] = {
      level: f.bestLevel,
      value: f.bestLevelValue
    };
  });

  return {
    factors: factorResults,
    rankedFactorCodes,
    optimalCombination,
    goal,
    overallMean
  };
}

/**
 * Approximates incomplete Beta function for F-distribution p-value calculation
 */
function betaInc(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Simple series approximation for Beta cdf
  let sum = 0;
  let term = 1 / a;
  sum += term;
  for (let i = 1; i < 200; i++) {
    term *= ((i - b) * x) / i;
    const add = term / (a + i);
    sum += add;
    if (Math.abs(add) < 1e-10) break;
  }

  // Multiply by scaling factor x^a * (1-x)^b / B(a,b)
  // Simple stirling/gamma approximation for log Beta
  const lgamma = (z: number) => {
    // Lanczos approximation
    const p = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167228333,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
    z -= 1;
    let xVal = p[0];
    for (let i = 1; i < 9; i++) xVal += p[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(xVal);
  };

  const logBeta = lgamma(a) + lgamma(b) - lgamma(a + b);
  const factor = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta);
  return Math.min(1, Math.max(0, factor * sum));
}

/**
 * Calculates F distribution right-tail probability p-value P(F_df1,df2 > f)
 */
export function calculateFProbability(fVal: number, df1: number, df2: number): number {
  if (fVal <= 0 || df1 <= 0 || df2 <= 0 || isNaN(fVal)) return 1;
  const x = (df1 * fVal) / (df1 * fVal + df2);
  const pLeft = betaInc(df1 / 2, df2 / 2, x);
  return Math.max(0, Math.min(1, 1 - pLeft));
}

/**
 * Calculates ANOVA Table (方差分析表)
 */
export function calculateAnova(
  factors: Factor[],
  runs: ExperimentRun[]
): AnovaResult {
  const N = runs.length;
  if (N === 0) {
    return {
      factors: [],
      errorSs: 0,
      errorDf: 0,
      errorMs: 0,
      totalSs: 0,
      totalDf: 0,
      grandMean: 0,
      count: 0
    };
  }

  const grandTotal = runs.reduce((sum, r) => sum + (r.value || 0), 0);
  const grandMean = grandTotal / N;
  const CT = (grandTotal * grandTotal) / N;

  const sumSquaresTotal = runs.reduce((sum, r) => sum + (r.value || 0) ** 2, 0);
  const totalSs = sumSquaresTotal - CT;
  const totalDf = N - 1;

  let sumFactorSs = 0;
  let sumFactorDf = 0;

  const factorItems: AnovaFactorItem[] = factors.map((factor) => {
    const levelSums: Record<number, number> = {};
    const levelCounts: Record<number, number> = {};

    factor.levels.forEach((_, idx) => {
      const levelIdx = idx + 1;
      levelSums[levelIdx] = 0;
      levelCounts[levelIdx] = 0;
    });

    runs.forEach((run) => {
      const lvl = run.factorLevels[factor.code];
      if (lvl) {
        levelSums[lvl] = (levelSums[lvl] || 0) + (run.value || 0);
        levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
      }
    });

    let sumK2overN = 0;
    let activeLevelsCount = 0;

    Object.keys(levelSums).forEach((lvlStr) => {
      const lvl = parseInt(lvlStr, 10);
      const count = levelCounts[lvl] || 0;
      if (count > 0) {
        activeLevelsCount++;
        sumK2overN += (levelSums[lvl] ** 2) / count;
      }
    });

    const ss = Math.max(0, sumK2overN - CT);
    const df = Math.max(1, activeLevelsCount - 1);
    const ms = ss / df;

    sumFactorSs += ss;
    sumFactorDf += df;

    return {
      code: factor.code,
      name: factor.name,
      ss,
      df,
      ms,
      fVal: 0,
      pVal: 1,
      significant: "not_sig"
    };
  });

  // Remaining SS is Error
  let errorSs = Math.max(0, totalSs - sumFactorSs);
  let errorDf = Math.max(1, totalDf - sumFactorDf);

  // If errorDf is 0 or errorSs is 0 (exact fit), handle smoothly
  if (errorDf <= 0) errorDf = 1;
  const errorMs = errorSs > 0 ? errorSs / errorDf : 0.0001;

  // Compute F and p-values
  factorItems.forEach((f) => {
    if (errorMs > 0) {
      f.fVal = f.ms / errorMs;
      f.pVal = calculateFProbability(f.fVal, f.df, errorDf);

      if (f.pVal < 0.01) {
        f.significant = "highly_sig";
      } else if (f.pVal < 0.05) {
        f.significant = "significant";
      } else {
        f.significant = "not_sig";
      }
    } else {
      f.fVal = 0;
      f.pVal = 1;
      f.significant = "not_sig";
    }
  });

  return {
    factors: factorItems,
    errorSs,
    errorDf,
    errorMs,
    totalSs,
    totalDf,
    grandMean,
    count: N
  };
}

/**
 * Computes Residuals and Q-Q Plot data
 */
export function calculateResidualsAndQQ(
  factors: Factor[],
  runs: ExperimentRun[],
  rangeRes: RangeAnalysisResult
): { qqPoints: QQPoint[]; residuals: number[]; fittedValues: number[]; residualStdDev: number } {
  if (runs.length === 0) {
    return { qqPoints: [], residuals: [], fittedValues: [], residualStdDev: 0 };
  }

  const grandMean = rangeRes.overallMean;

  // Additive model predicted values: y_hat = grandMean + sum_j (k_{j, lvl} - grandMean)
  const fittedValues: number[] = [];
  const residuals: number[] = [];

  runs.forEach((run) => {
    let yHat = grandMean;
    factors.forEach((f) => {
      const fRes = rangeRes.factors.find((fr) => fr.code === f.code);
      if (fRes) {
        const lvl = run.factorLevels[f.code];
        const kVal = fRes.levelMeans[lvl] ?? grandMean;
        yHat += kVal - grandMean;
      }
    });

    fittedValues.push(yHat);
    residuals.push((run.value || 0) - yHat);
  });

  const meanResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const variance =
    residuals.reduce((a, b) => a + (b - meanResidual) ** 2, 0) / (residuals.length || 1);
  const residualStdDev = Math.sqrt(variance) || 1;

  // Sort residuals to calculate normal quantiles
  const sortedResiduals = [...residuals].sort((a, b) => a - b);
  const n = sortedResiduals.length;

  const qqPoints: QQPoint[] = sortedResiduals.map((r, i) => {
    // Blom's plotting position: p = (i + 1 - 0.375) / (n + 0.25)
    const p = (i + 1 - 0.375) / (n + 0.25);
    // Approximate inverse standard normal cdf (Beasley-Springer-Moro or simple approximation)
    const q = approxNormalQuantile(p);

    return {
      theoreticalQuantile: q,
      sampleResidual: r,
      standardizedResidual: r / residualStdDev
    };
  });

  return {
    qqPoints,
    residuals,
    fittedValues,
    residualStdDev
  };
}

/**
 * Standard Normal Quantile Approximation
 */
function approxNormalQuantile(p: number): number {
  if (p <= 0) return -3.5;
  if (p >= 1) return 3.5;
  const q = p - 0.5;
  if (Math.abs(q) <= 0.42) {
    const r = q * q;
    return (
      q *
      (((-25.44106049637 * r + 41.39119773534) * r - 18.61500062529) * r + 2.50662823884) /
      ((((3.13082909833 * r - 21.06224101826) * r + 31.3082909833) * r - 16.29783935275) * r + 1)
    );
  } else {
    let r = p < 0.5 ? p : 1 - p;
    r = Math.sqrt(-Math.log(r));
    let x =
      ((((2.32121276858 * r + 4.85014127135) * r - 2.29796476964) * r - 2.78718931138) * r +
        0.18108871344) /
      (((1.48851587268 * r + 3.0615923188) * r + 0.93815398555) * r + 1);
    return p < 0.5 ? -x : x;
  }
}

/**
 * Calculates Factor Pair Interaction Means (A x B)
 */
export function calculateInteraction(
  factorA: Factor,
  factorB: Factor,
  runs: ExperimentRun[]
): InteractionPair {
  const interactionMeans: Record<string, number> = {};
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};

  factorA.levels.forEach((_, idxA) => {
    const lvlA = idxA + 1;
    factorB.levels.forEach((_, idxB) => {
      const lvlB = idxB + 1;
      const key = `${lvlA}_${lvlB}`;
      sums[key] = 0;
      counts[key] = 0;
    });
  });

  runs.forEach((run) => {
    const lvlA = run.factorLevels[factorA.code];
    const lvlB = run.factorLevels[factorB.code];
    if (lvlA && lvlB) {
      const key = `${lvlA}_${lvlB}`;
      sums[key] = (sums[key] || 0) + (run.value || 0);
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  let maxSlopeDiff = 0;
  // Calculate means
  Object.keys(sums).forEach((key) => {
    const c = counts[key] || 1;
    interactionMeans[key] = sums[key] / c;
  });

  // Simple heuristic check if lines cross or have conflicting slopes
  let hasInteraction = false;
  if (factorA.levels.length >= 2 && factorB.levels.length >= 2) {
    const slopeLvl1 =
      (interactionMeans[`2_1`] || 0) - (interactionMeans[`1_1`] || 0);
    const slopeLvl2 =
      (interactionMeans[`2_2`] || 0) - (interactionMeans[`1_2`] || 0);
    if (slopeLvl1 * slopeLvl2 < 0 || Math.abs(slopeLvl1 - slopeLvl2) > 2.0) {
      hasInteraction = true;
    }
  }

  return {
    factorA: factorA.code,
    factorB: factorB.code,
    interactionMeans,
    hasInteraction
  };
}

export interface DataValidityReport {
  mean: number;
  variance: number;
  stdDev: number;
  cv: number; // Coefficient of Variation %
  outlierRuns: {
    runIndex: number;
    value: number;
    zScore: number;
    deviationFromMean: number;
    reason: string;
  }[];
  status: "normal" | "warning" | "error";
  suggestions: string[];
}

/**
 * Checks data validity using variance and Z-score outlier detection rules
 */
export function checkDataValidity(runs: ExperimentRun[]): DataValidityReport {
  const values = runs.map((r) => r.value || 0);
  const n = values.length;
  if (n === 0) {
    return {
      mean: 0,
      variance: 0,
      stdDev: 0,
      cv: 0,
      outlierRuns: [],
      status: "normal",
      suggestions: ["请输入有效的试验数据。"]
    };
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const sumSqDiff = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const variance = n > 1 ? sumSqDiff / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  const outlierRuns: DataValidityReport["outlierRuns"] = [];

  runs.forEach((r) => {
    const val = r.value || 0;
    const diff = Math.abs(val - mean);
    const zScore = stdDev > 0 ? diff / stdDev : 0;

    // Standard Deviation 2.0-sigma outlier detection
    if (stdDev > 0 && zScore >= 2.0) {
      outlierRuns.push({
        runIndex: r.runIndex,
        value: val,
        zScore,
        deviationFromMean: val - mean,
        reason: `试验值 ${val} 偏离总体均值 (${mean.toFixed(2)}) 达 ${zScore.toFixed(2)} 倍标准差 (Z-Score ≥ 2.0)`
      });
    }
  });

  const suggestions: string[] = [];
  let status: "normal" | "warning" | "error" = "normal";

  if (outlierRuns.length > 0) {
    status = outlierRuns.some((o) => o.zScore >= 2.5) ? "error" : "warning";
    suggestions.push(
      `智能规则预警：检测到 ${outlierRuns.length} 组试验数据偏离标准差界限。涉及试验号：${outlierRuns
        .map((o) => `#${o.runIndex}`)
        .join(", ")}。`
    );
    suggestions.push("检查建议 1：请核对键盘录入是否有误（如多填/少填 0，小数点错位或遗漏负号）。");
    suggestions.push("检查建议 2：核查该试验号对应的实验环境（如是否有温湿度骤变、仪器离群或试剂失效）。");
  } else if (cv > 35) {
    status = "warning";
    suggestions.push(`智能规则提醒：变异系数 CV = ${cv.toFixed(1)}% (> 35%)，表示整体试验响应值分散度较高。`);
    suggestions.push("检查建议：建议增加平行重复试验，防止系统波动掩盖因素的主要效应。");
  } else {
    suggestions.push(`数据质量良好：变异系数 CV = ${cv.toFixed(1)}%，无极端离群点 (Z < 2.0)。`);
    suggestions.push("符合方差分析齐性与平稳性分布要求，可以放心进行极差与 ANOVA 推导。");
  }

  return {
    mean,
    variance,
    stdDev,
    cv,
    outlierRuns,
    status,
    suggestions
  };
}
