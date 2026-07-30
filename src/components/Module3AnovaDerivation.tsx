import React, { useState } from "react";
import { Calculator, CheckCircle2, HelpCircle, ArrowRight, Activity, Award, BarChart3, AlertCircle, Sparkles, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from "recharts";
import { AnovaResult, Factor, ExperimentRun } from "../types";
import { AnovaVisualCharts } from "./AnovaVisualCharts";

interface Module3Props {
  anovaResult: AnovaResult;
  factors: Factor[];
  runs: ExperimentRun[];
  targetMetricName: string;
}

// Helper to calculate F-Crit critical threshold values based on df1 and df2
function getFCritValues(df1: number, df2: number) {
  if (df1 === 1) {
    if (df2 <= 2) return { f05: 18.51, f01: 98.5 };
    if (df2 <= 4) return { f05: 7.71, f01: 21.2 };
    if (df2 <= 6) return { f05: 5.99, f01: 13.75 };
    return { f05: 4.96, f01: 10.04 };
  }
  if (df1 === 2) {
    if (df2 <= 2) return { f05: 19.0, f01: 99.0 };
    if (df2 <= 4) return { f05: 6.94, f01: 18.0 };
    if (df2 <= 6) return { f05: 5.14, f01: 10.92 };
    return { f05: 4.26, f01: 8.02 };
  }
  if (df1 === 3) {
    if (df2 <= 2) return { f05: 19.16, f01: 99.17 };
    if (df2 <= 4) return { f05: 6.59, f01: 16.69 };
    if (df2 <= 6) return { f05: 4.76, f01: 9.78 };
    return { f05: 3.86, f01: 6.99 };
  }
  return { f05: 5.14, f01: 10.92 };
}

export const Module3AnovaDerivation: React.FC<Module3Props> = ({
  anovaResult,
  factors,
  runs,
  targetMetricName
}) => {
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [selectedFactorCode, setSelectedFactorCode] = useState<string>(
    anovaResult.factors[0]?.code || "A"
  );
  const [significanceAlpha, setSignificanceAlpha] = useState<number>(0.05);

  const selectedAnovaItem =
    anovaResult.factors.find((f) => f.code === selectedFactorCode) || anovaResult.factors[0];

  // Calculated values for step breakdown
  const N = runs.length;
  const T = runs.reduce((acc, r) => acc + (r.value || 0), 0);
  const CT = (T * T) / (N || 1);

  // SVG F-distribution curve generator
  const df1 = selectedAnovaItem?.df || 2;
  const df2 = anovaResult.errorDf || 4;
  const fValue = selectedAnovaItem?.fVal || 1.0;
  const pValue = selectedAnovaItem?.pVal || 0.5;

  // Approximate Critical F value at alpha 0.05
  const fcrit = df1 === 2 && df2 === 4 ? 6.94 : df1 === 3 && df2 === 4 ? 6.59 : 5.14;

  return (
    <div className="space-y-6">
      {/* Title Slice */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          <Calculator className="w-3.5 h-3.5" />
          模块 3 · ANOVA 逐步推导 (Step-by-Step ANOVA)
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
          单/多因素方差分析公式推导与 F 检验曲线拟合
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          方差分析（ANOVA）将总变异（SS_T）分解为各因素引起的变异与随机误差（SS_e），通过 F 统计量确定因素影响的显著性。
        </p>
      </div>

      {/* 4 Step Deduction Tabs */}
      <div className="bg-white rounded-xl p-2 border border-slate-200/80 shadow-xs flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
        {[
          { step: 1, title: "1. 离差平方和分解 SS" },
          { step: 2, title: "2. 自由度 df 分配" },
          { step: 3, title: "3. 均方 MS 与 F 比值" },
          { step: 4, title: "4. F 检验拒绝域与 p 值" }
        ].map((item) => (
          <button
            key={item.step}
            onClick={() => setActiveStepTab(item.step)}
            className={`flex-1 min-w-[180px] py-2.5 px-3 rounded-lg text-xs font-bold transition-all text-center border ${
              activeStepTab === item.step
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Step Breakdown Cards */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        {activeStepTab === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              步骤 1：离差平方和（Sum of Squares, SS）推导
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              根据方差可加性原理，总平方和 SS_T 分解为各因素主效应平方和 SS_A, SS_B, ... 及随机误差平方和 SS_e：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">矫正系数 (CT)</span>
                <div className="p-2 bg-white rounded border border-slate-200 text-indigo-700 font-bold">
                  CT = T² / N = ({T.toFixed(1)})² / {N} = {CT.toFixed(3)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">总平方和 (SS_T)</span>
                <div className="p-2 bg-white rounded border border-slate-200 text-indigo-700 font-bold">
                  SS_T = Σy² - CT = {anovaResult.totalSs.toFixed(3)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">误差平方和 (SS_e)</span>
                <div className="p-2 bg-white rounded border border-slate-200 text-emerald-700 font-bold">
                  SS_e = SS_T - ΣSS_因子 = {anovaResult.errorSs.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStepTab === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">步骤 2：自由度（Degrees of Freedom, df）分配</h3>
            <p className="text-xs text-slate-600">
              自由度反映独立信息数量。总自由度 df_T = N - 1；单个因素自由度 df_A = r_A - 1（r_A 为水平数）；误差自由度 df_e = df_T - Σdf_因子。
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">总试验次数 N</span>
                <span className="font-extrabold text-slate-900 text-base">{N}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">总自由度 df_T</span>
                <span className="font-extrabold text-slate-900 text-base">{anovaResult.totalDf}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">各因子自由度之和</span>
                <span className="font-extrabold text-indigo-600 text-base">
                  {anovaResult.totalDf - anovaResult.errorDf}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">误差自由度 df_e</span>
                <span className="font-extrabold text-emerald-600 text-base">{anovaResult.errorDf}</span>
              </div>
            </div>
          </div>
        )}

        {activeStepTab === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">步骤 3：均方（Mean Square, MS）与 F 统计量推导</h3>
            <p className="text-xs text-slate-600">
              均方 MS = SS / df；因子 F 统计量 F = MS_因子 / MS_e。若 F &gt; 1 明显，说明因素主效应变异显著超过系统误差。
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border border-slate-200 rounded-lg">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-left">变异来源 Source</th>
                    <th className="py-2.5 px-3">平方和 SS</th>
                    <th className="py-2.5 px-3">自由度 df</th>
                    <th className="py-2.5 px-3">均方 MS</th>
                    <th className="py-2.5 px-3">F 值</th>
                    <th className="py-2.5 px-3">p 值</th>
                    <th className="py-2.5 px-3 text-right">显著性判定</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {anovaResult.factors.map((f) => (
                    <tr key={f.code} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-bold text-slate-900">
                        因素 {f.code} ({f.name})
                      </td>
                      <td className="py-2 px-3">{f.ss.toFixed(3)}</td>
                      <td className="py-2 px-3">{f.df}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">{f.ms.toFixed(3)}</td>
                      <td className="py-2 px-3 font-bold text-indigo-700">{f.fVal.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{f.pVal < 0.001 ? "< 0.001" : f.pVal.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right font-bold">
                        {f.significant === "highly_sig" && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                            极显著 (p &lt; 0.01) **
                          </span>
                        )}
                        {f.significant === "significant" && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 border border-blue-300">
                            显著 (p &lt; 0.05) *
                          </span>
                        )}
                        {f.significant === "not_sig" && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            不显著 (p ≥ 0.05)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/80 font-medium">
                    <td className="py-2 px-3 text-left text-slate-600">误差 Residual Error</td>
                    <td className="py-2 px-3">{anovaResult.errorSs.toFixed(3)}</td>
                    <td className="py-2 px-3">{anovaResult.errorDf}</td>
                    <td className="py-2 px-3">{anovaResult.errorMs.toFixed(3)}</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3 text-right text-slate-400">基准误差</td>
                  </tr>
                  <tr className="bg-slate-100 font-bold border-t border-slate-300">
                    <td className="py-2.5 px-3 text-left text-slate-900">总和 Total</td>
                    <td className="py-2.5 px-3">{anovaResult.totalSs.toFixed(3)}</td>
                    <td className="py-2.5 px-3">{anovaResult.totalDf}</td>
                    <td className="py-2.5 px-3">-</td>
                    <td className="py-2.5 px-3">-</td>
                    <td className="py-2.5 px-3">-</td>
                    <td className="py-2.5 px-3 text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeStepTab === 4 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  步骤 4：F 分布概率密度曲线与动态拒绝域渲染
                </h3>
                <p className="text-xs text-slate-500">
                  选择具体因素以查看对应 F({df1}, {df2}) 的理论概率密度分布与拒绝域。
                </p>
              </div>

              {/* Factor Selection Dropdown & Alpha Toggle */}
              <div className="flex items-center space-x-2">
                <select
                  value={selectedFactorCode}
                  onChange={(e) => setSelectedFactorCode(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  {anovaResult.factors.map((f) => (
                    <option key={f.code} value={f.code}>
                      因素 {f.code} ({f.name})
                    </option>
                  ))}
                </select>

                <div className="bg-slate-100 p-1 rounded-lg flex space-x-1 text-xs">
                  <button
                    onClick={() => setSignificanceAlpha(0.05)}
                    className={`px-2 py-1 rounded font-medium ${
                      significanceAlpha === 0.05 ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                  >
                    α = 0.05
                  </button>
                  <button
                    onClick={() => setSignificanceAlpha(0.01)}
                    className={`px-2 py-1 rounded font-medium ${
                      significanceAlpha === 0.01 ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600"
                    }`}
                  >
                    α = 0.01
                  </button>
                </div>
              </div>
            </div>

            {/* F Distribution SVG Chart */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>
                  F 检验分布：F({df1}, {df2})
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  计算得出 F = {fValue.toFixed(3)} (p = {pValue < 0.001 ? "< 0.001" : pValue.toFixed(4)})
                </span>
              </div>

              <div className="h-56 w-full relative">
                <svg viewBox="0 0 500 200" className="w-full h-full">
                  {/* F distribution probability density curve rendering */}
                  {(() => {
                    const points: { x: number; y: number; f: number }[] = [];
                    for (let xPixel = 30; xPixel <= 480; xPixel += 2) {
                      const fValCur = ((xPixel - 30) / 450) * 12; // 0 to 12 F scale
                      const num = Math.pow(Math.max(0.001, fValCur), df1 / 2 - 1);
                      const den = Math.pow(1 + (df1 / df2) * fValCur, (df1 + df2) / 2);
                      const pdf = (num / den) * 1.5;
                      const yPixel = 180 - Math.min(160, pdf * 100);
                      points.push({ x: xPixel, y: yPixel, f: fValCur });
                    }

                    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

                    // Rejection region shading (F > fcrit)
                    const critX = 30 + (fcrit / 12) * 450;
                    const rejPoints = points.filter((p) => p.x >= critX);
                    const rejD =
                      rejPoints.length > 0
                        ? `M ${critX} 180 L ${critX} ${rejPoints[0].y} ` +
                          rejPoints.map((p) => `L ${p.x} ${p.y}`).join(" ") +
                          ` L 480 180 Z`
                        : "";

                    // User calculated F marker
                    const userFX = 30 + (Math.min(11.8, fValue) / 12) * 450;

                    return (
                      <g>
                        {/* Rejection Area Shade */}
                        {rejD && <path d={rejD} fill="#ef4444" opacity="0.35" />}

                        {/* Density Curve */}
                        <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth="2.5" />

                        {/* Baseline */}
                        <line x1="30" y1="180" x2="480" y2="180" stroke="#475569" strokeWidth="1.5" />

                        {/* Critical Value Line */}
                        <line x1={critX} y1="20" x2={critX} y2="180" stroke="#f87171" strokeWidth="2" strokeDasharray="4,4" />
                        <text x={critX - 5} y="15" fill="#f87171" fontSize="10" textAnchor="end" fontWeight="bold">
                          临界值 F_α = {fcrit.toFixed(2)}
                        </text>

                        {/* User F Value Line */}
                        <line x1={userFX} y1="20" x2={userFX} y2="180" stroke="#34d399" strokeWidth="2.5" />
                        <circle cx={userFX} cy="180" r="5" fill="#34d399" />
                        <text x={userFX + 6} y="35" fill="#34d399" fontSize="11" fontWeight="extrabold">
                          实测 F = {fValue.toFixed(2)}
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800 pt-2">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-2.5 h-2.5 bg-red-500/50 rounded" /> 红色区域为拒绝域 (拒绝 H_0 原假设)
                </span>
                <span className="text-emerald-400">
                  {fValue >= fcrit ? "实测 F 处于拒绝域：显著拒绝原假设！" : "实测 F 未进入拒绝域：暂无显著差异"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recharts Bar Chart: Factor F-Value vs F-Crit Comparison */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              Recharts 可视化直观判读
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              各因素 F 统计量与 F-Crit (F₀.₀₅ / F₀.₀₁) 临界值柱状对比
            </h3>
            <p className="text-xs text-slate-500">
              直观标识柱高超过临界线 F₀.₀₅ (显著, p &lt; 0.05) 或 F₀.₀₁ (极显著, p &lt; 0.01) 的核心因素。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-3 h-3 bg-emerald-500 rounded-xs" /> 极显著因素 (p &lt; 0.01) **
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-3 h-3 bg-blue-500 rounded-xs" /> 显著因素 (p &lt; 0.05) *
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="w-3 h-3 bg-slate-400 rounded-xs" /> 不显著因素
            </span>
          </div>
        </div>

        {/* Recharts BarChart Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={anovaResult.factors.map((f) => {
                const { f05, f01 } = getFCritValues(f.df || 2, anovaResult.errorDf || 4);
                const isHighlySig = f.fVal >= f01 || f.significant === "highly_sig";
                const isSig = (f.fVal >= f05 && f.fVal < f01) || f.significant === "significant";

                let sigLabel = "不显著 (p ≥ 0.05)";
                let barColor = "#94a3b8"; // slate-400
                if (isHighlySig) {
                  sigLabel = "极显著 (p < 0.01) **";
                  barColor = "#10b981"; // emerald-500
                } else if (isSig) {
                  sigLabel = "显著 (p < 0.05) *";
                  barColor = "#3b82f6"; // blue-500
                }

                return {
                  code: f.code,
                  name: f.name,
                  displayName: `因素 ${f.code} (${f.name})`,
                  fVal: Number(f.fVal.toFixed(3)),
                  fCrit05: f05,
                  fCrit01: f01,
                  pVal: f.pVal,
                  sigLabel,
                  barColor,
                  isHighlySig,
                  isSig
                };
              })}
              margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="displayName"
                tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={{ stroke: "#cbd5e1" }}
                label={{ value: "F 统计量", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#64748b" } }}
              />
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-2 border border-slate-700/80">
                        <div className="font-bold text-sm text-indigo-300 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
                          <span>{data.displayName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              data.isHighlySig
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : data.isSig
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {data.sigLabel}
                          </span>
                        </div>

                        <div className="space-y-1 font-mono">
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-400">实测 F 统计量:</span>
                            <span className="font-bold text-emerald-400 text-sm">{data.fVal}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-400">临界值 F₀.₀₅ (α=0.05):</span>
                            <span className="font-bold text-amber-400">{data.fCrit05}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6">
                            <span className="text-slate-400">临界值 F₀.₀₁ (α=0.01):</span>
                            <span className="font-bold text-rose-400">{data.fCrit01}</span>
                          </div>
                          <div className="flex items-center justify-between gap-6 pt-1 border-t border-slate-800/80">
                            <span className="text-slate-400">p 概率值:</span>
                            <span className="font-bold text-indigo-300">
                              {data.pVal < 0.001 ? "< 0.001" : data.pVal.toFixed(4)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }} />
              <Bar dataKey="fVal" name="实测 F 统计量 (F-Calculated)" radius={[6, 6, 0, 0]} barSize={36}>
                {anovaResult.factors.map((f, index) => {
                  const { f05, f01 } = getFCritValues(f.df || 2, anovaResult.errorDf || 4);
                  const isHighlySig = f.fVal >= f01 || f.significant === "highly_sig";
                  const isSig = (f.fVal >= f05 && f.fVal < f01) || f.significant === "significant";
                  const fill = isHighlySig ? "#10b981" : isSig ? "#3b82f6" : "#94a3b8";
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
              <Bar dataKey="fCrit05" name="临界门槛 F₀.₀₅ (α=0.05)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} />
              <Bar dataKey="fCrit01" name="极显著门槛 F₀.₀₁ (α=0.01)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Significance Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {anovaResult.factors.map((f) => {
            const { f05, f01 } = getFCritValues(f.df || 2, anovaResult.errorDf || 4);
            const isHighlySig = f.fVal >= f01 || f.significant === "highly_sig";
            const isSig = (f.fVal >= f05 && f.fVal < f01) || f.significant === "significant";

            return (
              <div
                key={f.code}
                className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                  isHighlySig
                    ? "bg-emerald-50/60 border-emerald-200"
                    : isSig
                    ? "bg-blue-50/60 border-blue-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    因素 {f.code} ({f.name})
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                      isHighlySig
                        ? "bg-emerald-200/80 text-emerald-900"
                        : isSig
                        ? "bg-blue-200/80 text-blue-900"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {isHighlySig ? "极显著 **" : isSig ? "显著 *" : "不显著"}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>F 值:</span>
                    <span className="font-bold text-slate-900">{f.fVal.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>F₀.₀₅:</span>
                    <span>{f05}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Visual Charts (Response Heatmap, Contribution Rate, etc.) */}
      <AnovaVisualCharts
        anovaResult={anovaResult}
        factors={factors}
        runs={runs}
        targetMetricName={targetMetricName}
        defaultTab="response_heatmap"
      />
    </div>
  );
};
