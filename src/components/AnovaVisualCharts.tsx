import React, { useState } from "react";
import {
  BarChart3,
  PieChart,
  Grid,
  Zap,
  Info,
  Award,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowUpRight,
  Flame,
  Activity
} from "lucide-react";
import {
  AnovaResult,
  Factor,
  ExperimentRun,
  RangeAnalysisResult,
  InteractionPair
} from "../types";
import { calculateInteraction } from "../utils/mathAnova";

interface AnovaVisualChartsProps {
  anovaResult: AnovaResult;
  rangeResult?: RangeAnalysisResult;
  factors: Factor[];
  runs: ExperimentRun[];
  targetMetricName?: string;
  defaultTab?: "f_comparison" | "contribution" | "response_heatmap" | "interaction_heatmap";
}

export const AnovaVisualCharts: React.FC<AnovaVisualChartsProps> = ({
  anovaResult,
  rangeResult,
  factors,
  runs,
  targetMetricName = "指标",
  defaultTab = "f_comparison"
}) => {
  const [activeChartTab, setActiveChartTab] = useState<
    "f_comparison" | "contribution" | "response_heatmap" | "interaction_heatmap"
  >(defaultTab);

  // 1. Calculate Contribution Rates (贡献率 % = SS_factor / SS_total * 100%)
  const totalSs = anovaResult.totalSs || 1;
  const factorContributions = anovaResult.factors.map((f) => {
    const rate = Math.max(0, (f.ss / totalSs) * 100);
    return {
      code: f.code,
      name: f.name,
      ss: f.ss,
      rate,
      significant: f.significant
    };
  });
  const errorRate = Math.max(0, (anovaResult.errorSs / totalSs) * 100);

  // 2. F-Value vs F-Crit calculations
  const errorDf = anovaResult.errorDf || 1;
  const fComparisonData = anovaResult.factors.map((f) => {
    const df1 = f.df || 2;
    let fCrit05 = 5.14;
    let fCrit01 = 10.92;
    if (df1 === 2 && errorDf === 2) {
      fCrit05 = 19.0;
      fCrit01 = 99.0;
    } else if (df1 === 2 && errorDf === 4) {
      fCrit05 = 6.94;
      fCrit01 = 18.0;
    } else if (df1 === 3 && errorDf === 4) {
      fCrit05 = 6.59;
      fCrit01 = 16.69;
    }

    return {
      code: f.code,
      name: f.name,
      fVal: f.fVal,
      pVal: f.pVal,
      fCrit05,
      fCrit01,
      significant: f.significant
    };
  });

  // 3. Response Heatmap Matrix
  let minMean = Infinity;
  let maxMean = -Infinity;

  const responseMatrix = factors.map((factor) => {
    const fRes = rangeResult?.factors.find((fr) => fr.code === factor.code);
    const levelMeansList = factor.levels.map((lvlVal, idx) => {
      const lvlIdx = idx + 1;
      const mean = fRes?.levelMeans[lvlIdx] ?? 0;
      if (mean < minMean) minMean = mean;
      if (mean > maxMean) maxMean = mean;
      return {
        levelIdx: lvlIdx,
        levelVal: lvlVal,
        mean
      };
    });

    const bestLevelIdx = fRes?.bestLevel || 1;

    return {
      code: factor.code,
      name: factor.name,
      bestLevelIdx,
      levels: levelMeansList
    };
  });

  if (minMean === Infinity) {
    minMean = 0;
    maxMean = 100;
  }
  const meanRange = maxMean - minMean || 1;

  // 4. Interaction Pairs Matrix
  const interactionPairs: InteractionPair[] = [];
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const pair = calculateInteraction(factors[i], factors[j], runs);
      interactionPairs.push(pair);
    }
  }

  // Colors palette for contribution rate
  const COLORS = ["#4f46e5", "#059669", "#d97706", "#db2777", "#7c3aed", "#0891b2"];

  return (
    <div className="w-full bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6 mt-6">
      {/* Header & Tabs Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            高级图形诊断与可视化看板
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            正交方差显著性、贡献率与响应面热图分析
          </h3>
          <p className="text-xs text-slate-500">
            图表化直观呈现 F-统计量临界值对比、离差平方和贡献率、因子-水平均值响应热图与双因子交互作用。
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: "response_heatmap", label: "因素-水平响应热图", icon: Grid },
            { id: "f_comparison", label: "F-值显著性对比", icon: BarChart3 },
            { id: "contribution", label: "因素贡献率 %", icon: PieChart },
            { id: "interaction_heatmap", label: "因子交互作用热图", icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeChartTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChartTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-bold rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-xs border border-slate-200 ring-1 ring-indigo-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHART CONTENT PANELS */}

      {/* 1. ANOVA Significance Comparison (F-Value vs F-Crit) */}
      {activeChartTab === "f_comparison" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              实测 F 统计量 (F_calc) 与临界门槛 (F_0.05 / F_0.01) 对比
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> 极显著 (F &gt; F_0.01)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> 显著 (F &gt; F_0.05)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 bg-slate-300 rounded-sm" /> 不显著
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cards for each Factor */}
            <div className="lg:col-span-8 space-y-3.5">
              {fComparisonData.map((item) => {
                // Determine scale relative to F_0.05 for clear visual comparison
                const targetScale = Math.max(item.fVal, item.fCrit05 * 1.5, 10);
                const barWidthPercent = Math.min(100, (item.fVal / targetScale) * 100);
                const fCrit05Percent = (item.fCrit05 / targetScale) * 100;

                return (
                  <div
                    key={item.code}
                    className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-white font-bold rounded text-xs">
                          因素 {item.code}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-600">
                          F_calc = <b className="text-slate-900 text-sm">{item.fVal.toFixed(2)}</b>
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            item.significant === "highly_sig"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : item.significant === "significant"
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                              : "bg-slate-200 text-slate-700 border-slate-300"
                          }`}
                        >
                          {item.significant === "highly_sig"
                            ? "高度显著 (p < 0.01)"
                            : item.significant === "significant"
                            ? "显著 (p < 0.05)"
                            : "不显著"}
                        </span>
                      </div>
                    </div>

                    {/* Bar visualization */}
                    <div className="space-y-1">
                      <div className="relative h-7 bg-slate-200/80 rounded-lg overflow-hidden flex items-center p-0.5">
                        {/* F_calc Bar */}
                        <div
                          className={`h-full rounded-md transition-all duration-700 flex items-center justify-between px-3 text-xs font-extrabold text-white shadow-2xs ${
                            item.significant === "highly_sig"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600"
                              : item.significant === "significant"
                              ? "bg-gradient-to-r from-indigo-500 to-blue-600"
                              : "bg-slate-400"
                          }`}
                          style={{ width: `${Math.max(12, barWidthPercent)}%` }}
                        >
                          <span>F = {item.fVal.toFixed(2)}</span>
                        </div>

                        {/* F_0.05 Critical line */}
                        {fCrit05Percent <= 100 && (
                          <div
                            className="absolute top-0 bottom-0 border-r-2 border-dashed border-amber-500 z-10 flex items-center justify-end pr-1"
                            style={{ left: `${fCrit05Percent}%` }}
                          >
                            <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-1 rounded -mt-6 whitespace-nowrap shadow-xs">
                              F_0.05 = {item.fCrit05.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                        <span>0</span>
                        <span>临界门槛 F_0.05 = {item.fCrit05.toFixed(2)}</span>
                        <span>临界门槛 F_0.01 = {item.fCrit01.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Explanation box */}
            <div className="lg:col-span-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-xl border border-indigo-800 shadow-md space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2 text-indigo-300">
                <Award className="w-4 h-4 text-amber-400" />
                F 显著性判断读图指南
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                当实测计算出的 <b>F_calc</b> 大于统计学临界门槛 <b>F_0.05</b> 时，说明改变该因素水平所引起的实验效应变化远远超出了随机测量误差范围，在 95% 以上置信度下被证实具有显著影力。
              </p>
              <div className="p-3 bg-indigo-950/80 rounded-lg border border-indigo-700/60 text-xs space-y-1">
                <span className="text-slate-400 text-[11px] block">当前影响最大因素：</span>
                <span className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  因素 {fComparisonData.sort((a, b) => b.fVal - a.fVal)[0]?.code}:{" "}
                  {fComparisonData.sort((a, b) => b.fVal - a.fVal)[0]?.name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Factor Contribution Rate (%) */}
      {activeChartTab === "contribution" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              离差平方和占比 (Contribution Rate = SS_factor / SS_total)
            </span>
            <span className="text-slate-600 font-mono text-xs">
              总变异离差平方和 SS_T = <b>{totalSs.toFixed(2)}</b>
            </span>
          </div>

          <div className="space-y-4">
            {/* Visual Stacked Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-9 w-full bg-slate-100 rounded-xl flex overflow-hidden p-1 border border-slate-200 shadow-inner">
                {factorContributions.map((item, idx) => (
                  <div
                    key={item.code}
                    className="h-full flex items-center justify-center text-xs font-extrabold text-white transition-all duration-500 first:rounded-l-lg last:rounded-r-lg shadow-2xs"
                    style={{
                      width: `${Math.max(2, item.rate)}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }}
                    title={`因素 ${item.code} (${item.name}): ${item.rate.toFixed(1)}%`}
                  >
                    {item.rate >= 6 && `${item.code} (${item.rate.toFixed(1)}%)`}
                  </div>
                ))}
                {errorRate > 0 && (
                  <div
                    className="h-full bg-slate-400 flex items-center justify-center text-xs font-bold text-white transition-all duration-500 rounded-r-lg"
                    style={{ width: `${Math.max(2, errorRate)}%` }}
                    title={`残差误差 Error: ${errorRate.toFixed(1)}%`}
                  >
                    {errorRate >= 6 && `误差 (${errorRate.toFixed(1)}%)`}
                  </div>
                )}
              </div>
            </div>

            {/* Individual Factor Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {factorContributions.map((item, idx) => (
                <div
                  key={item.code}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      因素 {item.code}
                    </span>
                    <span className="font-bold text-sm text-indigo-700 font-mono">
                      {item.rate.toFixed(1)}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium truncate">{item.name}</p>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, item.rate)}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                    <span>SS = {item.ss.toFixed(2)}</span>
                    <span className="text-slate-700 font-semibold">
                      {item.rate > 50 ? "主导因子" : item.rate > 20 ? "显著影响" : "次要因子"}
                    </span>
                  </div>
                </div>
              ))}

              {/* Error Box */}
              <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0" />
                    随机残差 Error
                  </span>
                  <span className="font-bold text-sm text-slate-700 font-mono">
                    {errorRate.toFixed(1)}%
                  </span>
                </div>

                <p className="text-xs text-slate-500">试验不可控波动与杂质</p>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, errorRate)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                  <span>SS_e = {anovaResult.errorSs.toFixed(2)}</span>
                  <span>{errorRate < 15 ? "误差控制极佳" : "存在较大杂音"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Response Heatmap Matrix (Factor - Level Response) */}
      {activeChartTab === "response_heatmap" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-600" />
              因素-水平均值响应阵列热力图 (k_ij Mean Heatmap)
            </span>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
              ★ 标识为各因素单因子最佳响应水平
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3.5 px-4 text-left border-r border-slate-800 w-44">
                    因素名称 / 编码
                  </th>
                  {factors[0]?.levels.map((_, idx) => (
                    <th key={idx} className="py-3.5 px-4 border-r border-slate-800 min-w-[120px]">
                      水平 {idx + 1}
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center text-amber-300 min-w-[130px]">
                    最佳推荐水平
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {responseMatrix.map((fRow) => (
                  <tr key={fRow.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-left font-bold text-slate-900 bg-slate-50 border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                          {fRow.code}
                        </span>
                        <span>{fRow.name}</span>
                      </div>
                    </td>

                    {fRow.levels.map((lvl) => {
                      const isBest = lvl.levelIdx === fRow.bestLevelIdx;
                      const ratio = (lvl.mean - minMean) / meanRange;

                      return (
                        <td key={lvl.levelIdx} className="p-2 border-r border-slate-200">
                          <div
                            className={`p-3.5 rounded-xl font-mono transition-all flex flex-col items-center justify-center ${
                              isBest
                                ? "bg-indigo-600 text-white font-extrabold shadow-md ring-2 ring-indigo-400"
                                : ratio > 0.5
                                ? "bg-indigo-100 text-indigo-950 font-bold"
                                : "bg-slate-100 text-slate-700 font-medium"
                            }`}
                          >
                            <span className="text-base font-extrabold">{lvl.mean.toFixed(2)}</span>
                            <span className="text-[11px] opacity-80 mt-0.5 font-sans">
                              {lvl.levelVal}
                            </span>
                            {isBest && (
                              <span className="mt-1 px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-extrabold rounded-full shadow-2xs">
                                最佳 ★
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-4 font-bold text-indigo-900 bg-indigo-50/50">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs border border-indigo-200">
                        <span>{fRow.code}<sub>{fRow.bestLevelIdx}</sub></span>
                        <span>= {factors.find((f) => f.code === fRow.code)?.levels[fRow.bestLevelIdx - 1]}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Interaction Pairs Heatmap Matrix */}
      {activeChartTab === "interaction_heatmap" && (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              两因子交互效应 2-Way Response 交叉列联表
            </span>
            <span className="text-xs text-slate-500">
              用于研判两因子搭配时是否存在协同增效或非加性干扰
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {interactionPairs.map((pair) => {
              const factorA = factors.find((f) => f.code === pair.factorA);
              const factorB = factors.find((f) => f.code === pair.factorB);
              if (!factorA || !factorB) return null;

              return (
                <div
                  key={`${pair.factorA}_${pair.factorB}`}
                  className={`p-4 rounded-xl border space-y-3 transition-all ${
                    pair.hasInteraction
                      ? "bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/60 shadow-xs"
                      : "bg-slate-50/70 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">
                        交互组合：{pair.factorA} ({factorA.name}) × {pair.factorB} ({factorB.name})
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        pair.hasInteraction
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                    >
                      {pair.hasInteraction ? "存在明显交互" : "效应独立 (加性)"}
                    </span>
                  </div>

                  {/* 2-Way Contingency Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border border-slate-200 rounded-lg bg-white">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold">
                          <th className="py-2 px-2 text-left">
                            {pair.factorA} \ {pair.factorB}
                          </th>
                          {factorB.levels.map((lvlValB, idxB) => (
                            <th key={idxB} className="py-2 px-2">
                              {pair.factorB}<sub>{idxB + 1}</sub> ({lvlValB})
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {factorA.levels.map((lvlValA, idxA) => {
                          const lvlA = idxA + 1;
                          return (
                            <tr key={lvlA} className="hover:bg-slate-50">
                              <td className="py-2 px-2 text-left font-bold text-slate-800 bg-slate-50">
                                {pair.factorA}<sub>{lvlA}</sub> ({lvlValA})
                              </td>
                              {factorB.levels.map((_, idxB) => {
                                const lvlB = idxB + 1;
                                const meanVal = pair.interactionMeans[`${lvlA}_${lvlB}`] ?? 0;
                                return (
                                  <td key={lvlB} className="py-2 px-2 font-bold text-indigo-900">
                                    <div className="py-1 px-2 bg-indigo-50/80 rounded border border-indigo-100">
                                      {meanVal.toFixed(2)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
