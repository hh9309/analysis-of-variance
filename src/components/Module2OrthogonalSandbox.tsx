import React, { useState } from "react";
import { Sliders, RefreshCw, Trophy, TrendingUp, Sparkles, Edit2, Check, ArrowDownUp, AlertCircle, ShieldCheck, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Factor, ExperimentRun, OrthogonalArrayDef, RangeAnalysisResult } from "../types";
import { calculateRangeAnalysis, calculateAnova, checkDataValidity } from "../utils/mathAnova";
import { STANDARD_ORTHOGONAL_ARRAYS } from "../data/standardTables";
import { AnovaVisualCharts } from "./AnovaVisualCharts";

interface Module2Props {
  currentArray: OrthogonalArrayDef;
  setCurrentArray: (arr: OrthogonalArrayDef) => void;
  factors: Factor[];
  setFactors: React.Dispatch<React.SetStateAction<Factor[]>>;
  runs: ExperimentRun[];
  setRuns: React.Dispatch<React.SetStateAction<ExperimentRun[]>>;
  targetMetricName: string;
  setTargetMetricName: (name: string) => void;
  goal: "maximize" | "minimize";
  setGoal: (goal: "maximize" | "minimize") => void;
  rangeResult: RangeAnalysisResult;
  onNavigateToAnova: () => void;
}

export const Module2OrthogonalSandbox: React.FC<Module2Props> = ({
  currentArray,
  setCurrentArray,
  factors,
  setFactors,
  runs,
  setRuns,
  targetMetricName,
  setTargetMetricName,
  goal,
  setGoal,
  rangeResult,
  onNavigateToAnova
}) => {
  const [editingFactorIdx, setEditingFactorIdx] = useState<number | null>(null);

  // Compute data validity check based on variance & standard deviation Z-score rules
  const validityReport = checkDataValidity(runs);
  const outlierSet = new Set(validityReport.outlierRuns.map((o) => o.runIndex));

  // Handle cell data input change
  const handleValueChange = (runIdx: number, valStr: string) => {
    const val = parseFloat(valStr);
    setRuns((prev) =>
      prev.map((r) => (r.runIndex === runIdx ? { ...r, value: isNaN(val) ? 0 : val } : r))
    );
  };

  // Switch array preset
  const handleSelectArray = (arrayId: string) => {
    const found = STANDARD_ORTHOGONAL_ARRAYS.find((a) => a.id === arrayId);
    if (!found) return;

    setCurrentArray(found);
    // Rebuild default factors
    const newFactors: Factor[] = found.levelsPerFactor.map((levelsCount, idx) => {
      const code = String.fromCharCode(65 + idx);
      const levelArr = Array.from({ length: levelsCount }, (_, i) => i + 1);
      return {
        id: `f_${idx}`,
        code,
        name: `因素 ${code}`,
        levels: levelArr
      };
    });
    setFactors(newFactors);

    // Rebuild default runs with dummy initial data
    const newRuns: ExperimentRun[] = found.matrix.map((row, idx) => {
      const fLevels: Record<string, number> = {};
      newFactors.forEach((f, fIdx) => {
        fLevels[f.code] = row[fIdx] || 1;
      });
      return {
        runIndex: idx + 1,
        factorLevels: fLevels,
        value: Number((80 + Math.sin(idx + 1) * 10 + idx * 1.5).toFixed(1))
      };
    });
    setRuns(newRuns);
  };

  // Color generator for factor lines
  const factorColors = ["#4f46e5", "#059669", "#d97706", "#dc2626", "#2563eb", "#7c3aed", "#0891b2"];

  return (
    <div className="space-y-6">
      {/* Title & Controls Bar Slice */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Sliders className="w-3.5 h-3.5" />
            模块 2 · 交互拟合沙盒 (Orthogonal Sandbox)
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            正交试验数据录入、极差分析与主效应动效拟合
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            实时响应输入数据，自动迭代计算 level 均值 $k_i$ 与极差 $R$，同步更新主效应图与最佳方案。
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Goal Selector Segmented Button */}
          <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 border border-slate-200/60">
            <button
              onClick={() => setGoal("maximize")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1 ${
                goal === "maximize"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>指标最大化 (如产率)</span>
            </button>
            <button
              onClick={() => setGoal("minimize")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1 ${
                goal === "minimize"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-amber-600" />
              <span>指标最小化 (如粗糙度)</span>
            </button>
          </div>

          <button
            onClick={onNavigateToAnova}
            className="px-4 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all shadow-xs flex items-center space-x-1.5"
          >
            <span>进入方差分析 (ANOVA)</span>
          </button>
        </div>
      </div>

      {/* Sliced Layout: Left Data Grid, Right Main Effect Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Grid: Orthogonal Matrix Data Input (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                正交试验矩阵与结果录入
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {currentArray.name}
                </span>
              </h3>
            </div>

            {/* Change Table dropdown */}
            <select
              value={currentArray.id}
              onChange={(e) => handleSelectArray(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STANDARD_ORTHOGONAL_ARRAYS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.runs} 次)
                </option>
              ))}
            </select>
          </div>

          {/* Metric Name Input */}
          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-xs">
            <span className="font-medium text-slate-700 shrink-0">响应指标名称:</span>
            <input
              type="text"
              value={targetMetricName}
              onChange={(e) => setTargetMetricName(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-900 font-semibold text-xs focus:outline-none focus:border-indigo-500 w-full"
              placeholder="如：合成产率 (%)"
            />
          </div>

          {/* Interactive Sliced Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-3 font-semibold text-slate-600 text-center w-12 border-r border-slate-200">
                    号
                  </th>
                  {factors.map((f, idx) => (
                    <th key={f.code} className="py-2.5 px-3 font-semibold border-r border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-700 font-bold">{f.code}</span>
                        <input
                          type="text"
                          value={f.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setFactors((prev) =>
                              prev.map((item) => (item.code === f.code ? { ...item, name: newName } : item))
                            );
                          }}
                          className="w-20 px-1 py-0.5 bg-white/80 border border-slate-200 rounded text-[11px] text-slate-800 focus:outline-none"
                        />
                      </div>
                    </th>
                  ))}
                  <th className="py-2.5 px-3 font-semibold text-slate-900 bg-indigo-50/80 text-right">
                    试验结果 {targetMetricName ? `(${targetMetricName})` : ""}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 bg-white">
                {runs.map((run) => {
                  const isOutlier = outlierSet.has(run.runIndex);
                  return (
                    <tr
                      key={run.runIndex}
                      className={`transition-colors ${
                        isOutlier ? "bg-amber-50/80 hover:bg-amber-100/80" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="py-2 px-3 text-center font-bold text-slate-500 bg-slate-50/50 border-r border-slate-200">
                        {run.runIndex}
                      </td>
                      {factors.map((f) => {
                        const lvl = run.factorLevels[f.code];
                        const levelVal = f.levels[lvl - 1];
                        return (
                          <td key={f.code} className="py-2 px-3 border-r border-slate-200">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-800 text-[11px]">
                              {f.code}
                              <sub>{lvl}</sub>
                              {levelVal !== undefined && levelVal !== lvl ? ` (${levelVal})` : ""}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-1.5 px-3 bg-indigo-50/30 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isOutlier && (
                            <span
                              className="text-amber-600 font-bold shrink-0"
                              title="智能提示：该试验数值偏离均值超过 2 倍标准差，请注意核查"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <input
                            type="number"
                            step="0.01"
                            value={run.value}
                            onChange={(e) => handleValueChange(run.runIndex, e.target.value)}
                            className={`w-24 text-right px-2.5 py-1 bg-white border rounded font-bold text-slate-900 text-xs shadow-2xs focus:outline-none ${
                              isOutlier ? "border-amber-400 focus:border-rose-500 ring-1 ring-amber-300" : "border-slate-300 focus:border-indigo-600"
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-400">
            提示：表格内直接修改数据数值，系统将实时更新右侧极差分析及主效应折线图。
          </p>

          {/* Smart Data Validity & Variance Rule Inspector Card */}
          <div
            className={`rounded-xl p-4 border transition-all space-y-3 ${
              validityReport.status === "error"
                ? "bg-rose-50/80 border-rose-200"
                : validityReport.status === "warning"
                ? "bg-amber-50/80 border-amber-200"
                : "bg-emerald-50/60 border-emerald-200/80"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5 border-slate-200/60">
              <div className="flex items-center space-x-2">
                {validityReport.status === "normal" ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                )}
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  数据有效性与波动智能检查 (方差规则)
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                <span className="px-2 py-0.5 rounded font-semibold bg-white border border-slate-200 text-slate-700">
                  均值 μ = {validityReport.mean.toFixed(2)}
                </span>
                <span className="px-2 py-0.5 rounded font-semibold bg-white border border-slate-200 text-slate-700">
                  标准差 σ = {validityReport.stdDev.toFixed(2)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    validityReport.cv > 35 ? "bg-amber-200 text-amber-900" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  变异系数 CV = {validityReport.cv.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {validityReport.suggestions.map((sug, sIdx) => (
                <div key={sIdx} className="flex items-start space-x-2 text-slate-800 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-indigo-600" />
                  <span>{sug}</span>
                </div>
              ))}

              {validityReport.outlierRuns.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-700 space-y-1.5">
                  <span className="font-bold text-rose-700 block">异常点偏离度明细 (Z-Score ≥ 2.0 法则)：</span>
                  {validityReport.outlierRuns.map((o) => (
                    <div
                      key={o.runIndex}
                      className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/90 px-2.5 py-1.5 rounded border border-slate-200/80 gap-1"
                    >
                      <span className="font-bold text-slate-900">试验号 #{o.runIndex} (实测值: {o.value})</span>
                      <span className="font-semibold text-rose-600">{o.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Grid: Range Analysis & Animated Main Effect Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Optimal Factor Combination & Ranking Summary Sliced Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm tracking-wide text-slate-100">极差分析 (Range Analysis) 结论</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-900/80 text-indigo-300 border border-indigo-700">
                {goal === "maximize" ? "目标: 最大化" : "目标: 最小化"}
              </span>
            </div>

            {/* Optimal Combination Tag */}
            <div className="bg-slate-800/90 rounded-lg p-3.5 border border-slate-700/80 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium block">理论推导最佳工艺条件组合：</span>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(rangeResult.optimalCombination).map(([code, optItem]) => {
                  const opt = optItem as { level: number; value: number | string };
                  return (
                    <span
                      key={code}
                      className="px-2.5 py-1 rounded bg-indigo-600/90 text-white font-bold text-xs shadow-xs"
                    >
                      {code}
                      <sub>{opt.level}</sub> = {opt.value}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Factor Importance Ranking */}
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block font-medium">
                各因子影响主次关系排序 (根据极差 R 大小)：
              </span>
              <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1">
                <span>{rangeResult.rankedFactorCodes.join("  >  ")}</span>
              </div>
            </div>
          </div>

          {/* Range Analysis Detail Table Slice */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              均值 $k_i$ 与 极差 $R$ 计算明细
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border border-slate-200 rounded">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-2 text-left border-r border-slate-200">因素/统计量</th>
                    {rangeResult.factors.map((f) => (
                      <th key={f.code} className="py-2 px-2 border-r border-slate-200">
                        {f.code} ({f.name})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {/* Mean k_i rows */}
                  {[1, 2, 3, 4].map((levelIdx) => {
                    const hasLevel = rangeResult.factors.some((f) => f.levelMeans[levelIdx] !== undefined);
                    if (!hasLevel) return null;
                    return (
                      <tr key={levelIdx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 text-left font-medium text-slate-600 bg-slate-50 border-r border-slate-200">
                          均值 $k_{levelIdx}$
                        </td>
                        {rangeResult.factors.map((f) => {
                          const meanVal = f.levelMeans[levelIdx];
                          const isBest = f.bestLevel === levelIdx;
                          return (
                            <td
                              key={f.code}
                              className={`py-1.5 px-2 border-r border-slate-200 ${
                                isBest ? "bg-emerald-50 font-bold text-emerald-700" : "text-slate-800"
                              }`}
                            >
                              {meanVal !== undefined ? meanVal.toFixed(2) : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* Range R Row */}
                  <tr className="bg-indigo-50/60 font-bold text-indigo-900 border-t border-indigo-200">
                    <td className="py-2 px-2 text-left border-r border-indigo-200">极差 $R$</td>
                    {rangeResult.factors.map((f) => (
                      <td key={f.code} className="py-2 px-2 border-r border-indigo-200 text-indigo-800 font-extrabold">
                        {f.rangeR.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Main Effect Line Chart (SVG Animation) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-xs text-slate-800">主效应趋势折线图 (Main Effect Chart)</h4>
              <span className="text-[10px] text-slate-400">折线斜率越大，表明该因素影响越显著</span>
            </div>

            <div className="h-48 w-full bg-slate-50/80 rounded-lg p-2 border border-slate-200/60 relative flex items-center justify-center">
              <svg viewBox="0 0 400 160" className="w-full h-full">
                {/* Grid lines */}
                <line x1="40" y1="20" x2="380" y2="20" stroke="#e2e8f0" strokeDasharray="3,3" />
                <line x1="40" y1="70" x2="380" y2="70" stroke="#e2e8f0" strokeDasharray="3,3" />
                <line x1="40" y1="120" x2="380" y2="120" stroke="#e2e8f0" strokeDasharray="3,3" />

                {/* Draw main effect lines for each factor */}
                {rangeResult.factors.map((f, fIdx) => {
                  const color = factorColors[fIdx % factorColors.length];
                  const levelKeys = Object.keys(f.levelMeans).map((k) => parseInt(k, 10));
                  if (levelKeys.length === 0) return null;

                  // Find min and max for chart scaling
                  let allMeans: number[] = [];
                  rangeResult.factors.forEach((rf) => {
                    Object.values(rf.levelMeans).forEach((m) => allMeans.push(Number(m)));
                  });
                  const globalMin = Math.min(...allMeans) * 0.95 || 0;
                  const globalMax = Math.max(...allMeans) * 1.05 || 100;
                  const rangeSpan = globalMax - globalMin || 1;

                  // X spacing
                  const points = levelKeys.map((lvl) => {
                    const x = 50 + (lvl - 1) * 110 + fIdx * 15;
                    const meanVal = f.levelMeans[lvl];
                    const y = 140 - ((meanVal - globalMin) / rangeSpan) * 110;
                    return { x, y, meanVal, lvl };
                  });

                  const pathD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

                  return (
                    <g key={f.code}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500"
                      />
                      {points.map((p) => (
                        <g key={p.lvl}>
                          <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke={color} strokeWidth="2" />
                          <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fill="#334155" fontWeight="bold">
                            {p.meanVal.toFixed(1)}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {rangeResult.factors.map((f, fIdx) => (
                <div key={f.code} className="flex items-center space-x-1.5 text-xs text-slate-700">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: factorColors[fIdx % factorColors.length] }}
                  />
                  <span className="font-medium">
                    {f.code}: {f.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Component (Heatmap & Contribution Rate) - Full Width at Page Bottom */}
      <AnovaVisualCharts
        anovaResult={calculateAnova(factors, runs)}
        rangeResult={rangeResult}
        factors={factors}
        runs={runs}
        targetMetricName={targetMetricName}
        defaultTab="response_heatmap"
      />
    </div>
  );
};
