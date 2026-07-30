import React, { useState } from "react";
import { Code, Copy, Check, Play, Terminal, Image as ImageIcon } from "lucide-react";
import { Factor, ExperimentRun, AnovaResult } from "../types";

interface Module6Props {
  factors: Factor[];
  runs: ExperimentRun[];
  targetMetricName: string;
  anovaResult: AnovaResult;
}

export const Module6PythonCode: React.FC<Module6Props> = ({
  factors,
  runs,
  targetMetricName,
  anovaResult
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeCodeSlice, setActiveCodeSlice] = useState<string>("full");
  const [anovaType, setAnovaType] = useState<number>(2);
  const [simulatingRun, setSimulatingRun] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [showSimulatedPlot, setShowSimulatedPlot] = useState<boolean>(false);

  const metricNameClean = targetMetricName || "Yield";
  const factorCols = factors.map((f) => `'${f.code}'`).join(", ");

  // Full python script
  const fullPythonCode = `# =========================================================
# 正交实验与方差分析 (DOE & ANOVA) 自动化 Python 统计分析脚本
# 适配 Python 3.8+ | 依赖库: pandas, statsmodels, seaborn, matplotlib
# =========================================================

import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.formula.api import ols
import matplotlib.pyplot as plt
import seaborn as sns

# 设置中文字体与绘图风格
plt.rcParams['font.sans-serif'] = ['SimHei', 'Arial Unicode MS', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False
sns.set_theme(style="whitegrid")

# 1. 构造正交实验矩阵数据集 (Data Frame)
data = {
${factors
  .map(
    (f) =>
      `    '${f.code}': [${runs.map((r) => `'${r.factorLevels[f.code]}'`).join(", ")}]`
  )
  .join(",\n")},
    '${metricNameClean}': [${runs.map((r) => r.value.toFixed(2)).join(", ")}]
}

df = pd.DataFrame(data)
print("=== 1. 正交实验矩阵与测定结果 ===")
print(df)

# 2. 因子极差分析 (Range Analysis)
print("\\n=== 2. 因子极差 R 计算与主次排序 ===")
range_results = {}
for factor in [${factorCols}]:
    grouped = df.groupby(factor)['${metricNameClean}'].mean()
    r_val = grouped.max() - grouped.min()
    range_results[factor] = r_val
    print(f"因素 {factor} 各水平均值:\\n{grouped}")
    print(f"因素 {factor} 极差 R = {r_val:.4f}\\n")

sorted_factors = sorted(range_results.items(), key=lambda x: x[1], reverse=True)
print("因子影响主次排序:", " > ".join([f[0] for f in sorted_factors]))

# 3. 拟合 OLS 模型并生成方差分析表 (ANOVA Type ${anovaType})
formula = '${metricNameClean} ~ ${factors.map((f) => `C(${f.code})`).join(" + ")}'
model = ols(formula, data=df).fit()
anova_table = sm.stats.anova_lm(model, typ=${anovaType})

print("\\n=== 3. 方差分析表 (ANOVA Table Type ${anovaType}) ===")
print(anova_table)

# 4. 可视化绘制: 因子主效应图与 SS 离差平方和贡献率
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# 图 1: 主效应均值折线图
for factor in [${factorCols}]:
    means = df.groupby(factor)['${metricNameClean}'].mean()
    axes[0].plot(means.index, means.values, marker='o', linewidth=2, label=f'Factor {factor}')

axes[0].set_title('正交因子主效应图 (Main Effects Plot)')
axes[0].set_xlabel('因子水平 (Factor Level)')
axes[0].set_ylabel('${metricNameClean} 均值')
axes[0].legend()

# 图 2: 方差贡献率条形图
ss_series = anova_table['sum_sq']
axes[1].bar(ss_series.index, ss_series.values, color=sns.color_palette("mako", len(ss_series)))
axes[1].set_title('离差平方和 (Sum of Squares SS) 分布')
axes[1].set_ylabel('SS 值')
plt.xticks(rotation=30)

plt.tight_layout()
plt.savefig("anova_doe_results.png", dpi=300)
plt.show()
`;

  // Code Slices
  const codeSlices: Record<string, { title: string; desc: string; code: string }> = {
    full: {
      title: "完整自动化分析脚本",
      desc: "包含数据构建、极差计算、statsmodels 方差分析与 Matplotlib 可视化绘图的全流程代码",
      code: fullPythonCode
    },
    data: {
      title: "切片 1: 数据准备与 DataFrame",
      desc: "将正交实验矩阵与实测响应数据转化为 Pandas DataFrame 格式",
      code: `import pandas as pd

# 正交实验原始数据表
data = {
${factors
  .map(
    (f) =>
      `    '${f.code}': [${runs.map((r) => `'${r.factorLevels[f.code]}'`).join(", ")}]`
  )
  .join(",\n")},
    '${metricNameClean}': [${runs.map((r) => r.value.toFixed(2)).join(", ")}]
}

df = pd.DataFrame(data)
print("=== 正交实验原始数据表 ===")
print(df.head(${runs.length}))
`
    },
    range: {
      title: "切片 2: 极差 R 分析与因子排序",
      desc: "分组聚合计算各因子水平均值 k_i 与极差 R",
      code: `import pandas as pd

# 分组计算极差 R
range_results = {}
for factor in [${factorCols}]:
    grouped = df.groupby(factor)['${metricNameClean}'].mean()
    r_val = grouped.max() - grouped.min()
    range_results[factor] = r_val
    print(f"因素 {factor} 各水平均值:\\n{grouped}")
    print(f"因素 {factor} 极差 R = {r_val:.4f}\\n")

sorted_factors = sorted(range_results.items(), key=lambda x: x[1], reverse=True)
print("因子影响主次排序:", " > ".join([f[0] for f in sorted_factors]))
`
    },
    anova: {
      title: "切片 3: statsmodels OLS 方差分析",
      desc: "使用 C(...) 分类变量因子拟合 OLS 模型并生成标准 ANOVA 表",
      code: `import statsmodels.api as sm
from statsmodels.formula.api import ols

# 拟合 OLS 模型 (Type ${anovaType} ANOVA)
formula = '${metricNameClean} ~ ${factors.map((f) => `C(${f.code})`).join(" + ")}'
model = ols(formula, data=df).fit()
anova_table = sm.stats.anova_lm(model, typ=${anovaType})

print("=== 方差分析表 (ANOVA Type ${anovaType}) ===")
print(anova_table)
`
    },
    plot: {
      title: "切片 4: Seaborn / Matplotlib 绘图",
      desc: "绘制因子主效应响应曲线图与离差平方和条形图",
      code: `import matplotlib.pyplot as plt
import seaborn as sns

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# 图 1: 主效应均值响应图
for factor in [${factorCols}]:
    means = df.groupby(factor)['${metricNameClean}'].mean()
    axes[0].plot(means.index, means.values, marker='o', linewidth=2, label=f'Factor {factor}')

axes[0].set_title('正交因子主效应图')
axes[0].set_ylabel('${metricNameClean} 均值')
axes[0].legend()

# 图 2: 方差贡献率
ss_series = anova_table['sum_sq']
axes[1].bar(ss_series.index, ss_series.values, color=sns.color_palette("mako", len(ss_series)))
axes[1].set_title('离差平方和 SS 分布')

plt.tight_layout()
plt.savefig("anova_doe_results.png", dpi=300)
plt.show()
`
    }
  };

  const handleCopy = () => {
    const activeCode = codeSlices[activeCodeSlice]?.code || fullPythonCode;
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateRun = () => {
    setSimulatingRun(true);
    setShowSimulatedPlot(false);

    setTimeout(() => {
      let output = `[Python 3.11.4 Kernel Executing...]\n`;
      output += `=== 1. 正交实验矩阵与测定结果 ===\n`;
      output += dfTableFormat(factors, runs, metricNameClean) + "\n\n";

      output += `=== 2. 各因子极差 R 计算结果 ===\n`;
      factors.forEach((f) => {
        output += `因素 ${f.code} 水平均值 k_i:\n`;
        f.levels.forEach((_, idx) => {
          const lvl = idx + 1;
          const matchingRuns = runs.filter((r) => r.factorLevels[f.code] === lvl);
          const mean =
            matchingRuns.reduce((sum, r) => sum + r.value, 0) / (matchingRuns.length || 1);
          output += `  水平 ${lvl}: ${mean.toFixed(2)}\n`;
        });
        const rangeR =
          Math.max(...f.levels.map((_, idx) => {
            const lvl = idx + 1;
            const matching = runs.filter((r) => r.factorLevels[f.code] === lvl);
            return matching.reduce((s, r) => s + r.value, 0) / (matching.length || 1);
          })) -
          Math.min(...f.levels.map((_, idx) => {
            const lvl = idx + 1;
            const matching = runs.filter((r) => r.factorLevels[f.code] === lvl);
            return matching.reduce((s, r) => s + r.value, 0) / (matching.length || 1);
          }));
        output += `因素 ${f.code} 极差 R = ${rangeR.toFixed(4)}\n\n`;
      });

      output += `=== 3. 方差分析表 (ANOVA Type ${anovaType}) ===\n`;
      output += `${"Source".padEnd(12)} ${"sum_sq".padStart(10)} ${"df".padStart(6)} ${"F".padStart(10)} ${"PR(>F)".padStart(12)}\n`;
      output += `${"-".repeat(55)}\n`;

      anovaResult.factors.forEach((f) => {
        output += `${("C(" + f.code + ")").padEnd(12)} ${f.ss.toFixed(4).padStart(10)} ${f.df.toString().padStart(6)} ${f.fVal.toFixed(4).padStart(10)} ${(f.pVal < 0.001 ? "<0.001" : f.pVal.toFixed(4)).padStart(12)}\n`;
      });
      output += `${"Residual".padEnd(12)} ${anovaResult.errorSs.toFixed(4).padStart(10)} ${anovaResult.errorDf.toString().padStart(6)} ${"NaN".padStart(10)} ${"NaN".padStart(12)}\n\n`;

      output += `[Matplotlib/Seaborn Graphics Rendered: 2 Subplots Generated]\n`;
      output += `Saved output image: 'anova_doe_results.png' (300 DPI)\n`;

      setTerminalOutput(output);
      setShowSimulatedPlot(true);
      setSimulatingRun(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
            <Code className="w-3.5 h-3.5" />
            模块 6 · Python 代码切片与运行 (Python Code Sandbox)
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            模块化 Python 代码切片与 statsmodels / Seaborn 仿真控制台
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            提供单步代码切片与在线控制台运行，完全客户端独立运行，可流畅部署至 GitHub Pages 与 Netlify。
          </p>
        </div>
      </div>

      {/* Code Slice Tabs Selector */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs">
        <div className="text-xs font-semibold text-slate-500 px-2 pb-2">代码功能切片选择 (Code Slices):</div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "full", label: "⚡ 完整全流程脚本", sliceName: "full" },
            { id: "data", label: "1. 数据构建 DataFrame", sliceName: "data" },
            { id: "range", label: "2. 极差分析 Groupby", sliceName: "range" },
            { id: "anova", label: "3. 方差分析 statsmodels", sliceName: "anova" },
            { id: "plot", label: "4. Seaborn 绘图可视化", sliceName: "plot" }
          ].map((slice) => {
            const isActive = activeCodeSlice === slice.sliceName;
            return (
              <button
                key={slice.id}
                onClick={() => setActiveCodeSlice(slice.sliceName)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {slice.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Code Viewer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-600" />
                {codeSlices[activeCodeSlice]?.title}
              </h3>
              <p className="text-[11px] text-slate-500">{codeSlices[activeCodeSlice]?.desc}</p>
            </div>

            <div className="flex items-center space-x-2">
              {activeCodeSlice === "anova" && (
                <div className="bg-slate-100 p-0.5 rounded flex text-xs">
                  {[1, 2, 3].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAnovaType(t)}
                      className={`px-2 py-0.5 rounded ${
                        anovaType === t ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-600"
                      }`}
                    >
                      Type {t}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center gap-1 border border-slate-200"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>已复制!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制切片</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800 max-h-[420px]">
              <code>{codeSlices[activeCodeSlice]?.code || fullPythonCode}</code>
            </pre>
          </div>
        </div>

        {/* Right: Live Execution Simulation Terminal & Visual Output (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-100">Python 浏览器沙盒终端</h3>
              </div>

              <button
                onClick={handleSimulateRun}
                disabled={simulatingRun}
                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-xs flex items-center space-x-1"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{simulatingRun ? "运行中..." : "运行当前 Python 切片"}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              提示：点击“运行当前 Python 切片”，将在沙盒内核中高仿真模拟 Pandas & Statsmodels 运算并输出控制台数据表与 Matplotlib 图形。
            </p>

            {terminalOutput ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>[STDOUT Output]</span>
                  <span className="text-emerald-400">Exit Code: 0 (Success)</span>
                </div>

                <pre className="p-3 bg-slate-950 text-emerald-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-[220px] border border-slate-800 leading-relaxed">
                  {terminalOutput}
                </pre>

                {/* Simulated Matplotlib Rendered Plot output */}
                {showSimulatedPlot && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Matplotlib 渲染图像输出 (anova_doe_results.png)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">300 DPI</span>
                    </div>

                    <div className="bg-slate-900 rounded p-3 text-slate-200 space-y-3 border border-slate-800">
                      <div className="text-[11px] font-bold text-center text-indigo-300 border-b border-slate-800 pb-1">
                        正交因子主效应与离差平方和 (SS) 响应曲线
                      </div>

                      {/* Line charts simulation */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">主效应响应图 (Main Effects)</span>
                          <div className="h-16 flex items-end justify-around border-b border-l border-slate-700 px-1 pt-1">
                            {factors.slice(0, 3).map((f, i) => (
                              <div key={f.code} className="flex flex-col items-center">
                                <div
                                  className="w-2 rounded-t bg-indigo-500"
                                  style={{ height: `${Math.min(100, (i + 1) * 18 + 15)}px` }}
                                ></div>
                                <span className="text-[8px] text-slate-400 mt-0.5">{f.code}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">离差 SS 分布 (Sum of Sq)</span>
                          <div className="h-16 flex items-end justify-around border-b border-l border-slate-700 px-1 pt-1">
                            {anovaResult.factors.slice(0, 3).map((f) => {
                              const ssPct = (f.ss / (anovaResult.totalSs || 1)) * 100;
                              return (
                                <div key={f.code} className="flex flex-col items-center">
                                  <div
                                    className="w-2 rounded-t bg-emerald-500"
                                    style={{ height: `${Math.min(48, Math.max(8, ssPct * 0.5))}px` }}
                                  ></div>
                                  <span className="text-[8px] text-slate-400 mt-0.5">{f.code}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-48 border border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                <Terminal className="w-8 h-8 opacity-40" />
                <span>等待运行指令... 点击上方“运行”获取控制台与图表输出</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700/80 text-[11px] text-slate-300">
            <strong>纯前端 0 后端部署说明:</strong>
            <br />
            项目全套功能（正交矩阵、ANOVA 极差、Python 仿真、PDF/Markdown 报告）均为客户端组件，完美支持直接推送到 <code>GitHub Pages</code> 或 <code>Netlify</code> 一键上线。
          </div>
        </div>
      </div>
    </div>
  );
};

function dfTableFormat(factors: Factor[], runs: ExperimentRun[], metric: string): string {
  let header = factors.map((f) => f.code.padStart(4)).join(" ") + "  " + metric.padStart(8);
  let rows = runs
    .slice(0, 6)
    .map(
      (r) =>
        factors.map((f) => String(r.factorLevels[f.code]).padStart(4)).join(" ") +
        "  " +
        r.value.toFixed(1).padStart(8)
    )
    .join("\n");
  return `${header}\n${rows}\n... (${runs.length} rows total)`;
}
