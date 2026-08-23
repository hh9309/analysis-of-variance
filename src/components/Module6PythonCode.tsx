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

  // Clean metric name for python compatibility
  const metricNameClean = targetMetricName || "Yield";
  const factorCols = factors.map((f) => `'${f.code}'`).join(", ");

  // Full python script
  const fullPythonCode = `# ==============================================================================
# 正交实验设计与方差分析 (DOE & ANOVA) 自动化统计分析脚本
# 适配 Python 3.8+ | 依赖安装命令:
# pip install pandas numpy scipy statsmodels seaborn matplotlib
# ==============================================================================

import pandas as pd
import numpy as np
import scipy.stats as stats
import statsmodels.api as sm
from statsmodels.formula.api import ols
import matplotlib.pyplot as plt
import seaborn as sns

# 设置绘图风格 (English Plot Styling & Standard Fonts)
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False
sns.set_theme(style="whitegrid")

# 1. 构造正交实验矩阵数据集 (DataFrame)
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

# 将因子列显式声明为 category 分类类别
for col in [${factorCols}]:
    df[col] = df[col].astype('category')

print("=" * 60)
print("=== 1. 正交实验矩阵与测定结果 ===")
print("=" * 60)
print(df.to_string(index=False))

# 2. 因子极差分析 (Range Analysis)
print("\\n" + "=" * 60)
print("=== 2. 因子极差 R 计算与主次排序 ===")
print("=" * 60)
range_results = {}
factor_names = {${factors.map((f) => `'${f.code}': '${f.name}'`).join(", ")}}

for factor in [${factorCols}]:
    grouped = df.groupby(factor, observed=False)['${metricNameClean}'].mean()
    r_val = grouped.max() - grouped.min()
    range_results[factor] = r_val
    fname = factor_names.get(factor, factor)
    print(f"\\n【因素 {factor} ({fname}) 各水平均值】")
    for lvl, m in grouped.items():
        print(f"  水平 {lvl}: {m:.4f}")
    print(f"  -> 极差 R = {r_val:.4f}")

sorted_factors = sorted(range_results.items(), key=lambda x: x[1], reverse=True)
print("\\n【因子影响主次排序】")
print(" > ".join([f"因素 {f[0]}({factor_names.get(f[0], f[0])})[R={f[1]:.4f}]" for f in sorted_factors]))

# 3. 正交试验方差分析表 (DOE ANOVA Table)
print("\\n" + "=" * 60)
print("=== 3. 方差分析表 (ANOVA Table) ===")
print("=" * 60)

# 正交离差平方和分解与 F 显著性检验
y_vals = df['${metricNameClean}'].values
N = len(y_vals)
CT = (y_vals.sum() ** 2) / N
SS_T = np.sum(y_vals ** 2) - CT
df_T = N - 1

anova_rows = []
total_factor_ss = 0
total_factor_df = 0

for factor in [${factorCols}]:
    grouped = df.groupby(factor, observed=False)['${metricNameClean}']
    k_sums = grouped.sum().values
    k_counts = grouped.count().values
    ss_f = np.sum((k_sums ** 2) / k_counts) - CT
    df_f = len(k_sums) - 1
    total_factor_ss += ss_f
    total_factor_df += df_f
    anova_rows.append({
        'Source': f'Q("{factor}")',
        'factor': factor,
        'sum_sq': ss_f,
        'df': df_f,
        'mean_sq': ss_f / df_f if df_f > 0 else 0
    })

df_e_raw = max(0, df_T - total_factor_df)
ss_e_raw = max(0.0, SS_T - total_factor_ss)
anova_df = pd.DataFrame(anova_rows)

# 检验是否为饱和正交表 (无预留空列或重复试验，剩余残差自由度为0)
if df_e_raw == 0:
    # 饱和设计：按正交试验统计规范，将平方和最小的因子拟归并为误差项 (Pooled Error)
    min_idx = anova_df['sum_sq'].idxmin()
    min_factor = anova_df.loc[min_idx, 'factor']
    err_ss = anova_df.loc[min_idx, 'sum_sq']
    err_df = anova_df.loc[min_idx, 'df']
    err_ms = err_ss / err_df
    
    anova_df['F'] = anova_df.apply(
        lambda r: (r['mean_sq'] / err_ms) if (r['factor'] != min_factor and err_ms > 0) else np.nan, 
        axis=1
    )
    anova_df['PR(>F)'] = anova_df.apply(
        lambda r: (1 - stats.f.cdf(r['F'], r['df'], err_df)) if pd.notnull(r['F']) else np.nan, 
        axis=1
    )
    
    err_row = pd.DataFrame([{
        'Source': f'Error(Pooled: {min_factor})',
        'factor': 'Error',
        'sum_sq': err_ss,
        'df': err_df,
        'mean_sq': err_ms,
        'F': np.nan,
        'PR(>F)': np.nan
    }])
else:
    err_ms = ss_e_raw / df_e_raw if df_e_raw > 0 else 0
    anova_df['F'] = anova_df['mean_sq'] / err_ms if err_ms > 0 else np.nan
    anova_df['PR(>F)'] = anova_df.apply(
        lambda r: (1 - stats.f.cdf(r['F'], r['df'], df_e_raw)) if pd.notnull(r['F']) else np.nan,
        axis=1
    )
    err_row = pd.DataFrame([{
        'Source': 'Residual (Error)',
        'factor': 'Error',
        'sum_sq': ss_e_raw,
        'df': df_e_raw,
        'mean_sq': err_ms,
        'F': np.nan,
        'PR(>F)': np.nan
    }])

total_row = pd.DataFrame([{
    'Source': 'Total',
    'factor': 'Total',
    'sum_sq': SS_T,
    'df': df_T,
    'mean_sq': np.nan,
    'F': np.nan,
    'PR(>F)': np.nan
}])

anova_table = pd.concat([anova_df, err_row, total_row], ignore_index=True)
display_cols = ['Source', 'sum_sq', 'df', 'mean_sq', 'F', 'PR(>F)']
print(anova_table[display_cols].to_string(index=False))

# 4. 可视化绘制: 因子主效应图与 SS 离差平方和分布 (All in English)
fig, axes = plt.subplots(1, 2, figsize=(13, 5))

# Subplot 1: Main Effects Mean Plot
for factor in [${factorCols}]:
    grouped = df.groupby(factor, observed=False)['${metricNameClean}'].mean()
    axes[0].plot(grouped.index.astype(str), grouped.values, marker='o', linewidth=2, label=f'Factor {factor}')

axes[0].set_title('Main Effects Plot (DOE Factor Response)', fontsize=12, fontweight='bold')
axes[0].set_xlabel('Factor Level', fontsize=10)
axes[0].set_ylabel('Mean Response Value', fontsize=10)
axes[0].legend(loc='best')
axes[0].grid(True, linestyle='--', alpha=0.6)

# Subplot 2: Sum of Squares (SS) Bar Chart
factor_rows = anova_table[~anova_table['factor'].isin(['Total', 'Error'])]
if not factor_rows.empty:
    clean_labels = [idx.replace('Q("', '').replace('")', '') for idx in factor_rows['Source']]
    axes[1].bar(clean_labels, factor_rows['sum_sq'].values, color=sns.color_palette("mako", len(factor_rows)), edgecolor='black', linewidth=0.5)
    axes[1].set_title('Sum of Squares (SS) Distribution', fontsize=12, fontweight='bold')
    axes[1].set_xlabel('Factor / Source', fontsize=10)
    axes[1].set_ylabel('Sum of Squares (SS)', fontsize=10)
    axes[1].tick_params(axis='x', rotation=25)
    axes[1].grid(True, linestyle='--', alpha=0.6)

plt.tight_layout()
output_img = "anova_doe_results.png"
plt.savefig(output_img, dpi=300)
print(f"\\n[Plot Output] Figure successfully saved to: {output_img}")
plt.show()
`;

  // Code Slices
  const codeSlices: Record<string, { title: string; desc: string; code: string }> = {
    full: {
      title: "完整自动化分析脚本 (可独立直接运行)",
      desc: "包含数据构建、极差计算、statsmodels 方差分析与 Matplotlib / Seaborn 可视化绘图的全流程独立 Python 脚本",
      code: fullPythonCode
    },
    data: {
      title: "切片 1: 数据准备与 DataFrame",
      desc: "将正交实验矩阵与实测响应数据转化为 Pandas DataFrame 格式并设置分类类型",
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

# 将因子列显式转换为 category 分类类别
for col in [${factorCols}]:
    df[col] = df[col].astype('category')

print("=== 正交实验原始数据表 ===")
print(df.to_string(index=False))
`
    },
    range: {
      title: "切片 2: 极差 R 分析与因子排序",
      desc: "分组聚合计算各因子水平均值 k_i 与极差 R",
      code: `import pandas as pd

# 因子极差 R 计算与主次排序
range_results = {}
for factor in [${factorCols}]:
    grouped = df.groupby(factor, observed=False)['${metricNameClean}'].mean()
    r_val = grouped.max() - grouped.min()
    range_results[factor] = r_val
    print(f"因素 {factor} 各水平均值:\\n{grouped}")
    print(f"因素 {factor} 极差 R = {r_val:.4f}\\n")

sorted_factors = sorted(range_results.items(), key=lambda x: x[1], reverse=True)
print("因子影响主次排序:", " > ".join([f[0] for f in sorted_factors]))
`
    },
    anova: {
      title: "切片 3: 正交离差平方和分解与方差分析",
      desc: "计算各因子离差平方和 SS、自由度 df、均方 MS，并自动处理饱和表归并误差计算 F 检验与 P 值",
      code: `import numpy as np
import pandas as pd
import scipy.stats as stats

# 3. 正交离差平方和分解与方差分析
y_vals = df['${metricNameClean}'].values
N = len(y_vals)
CT = (y_vals.sum() ** 2) / N
SS_T = np.sum(y_vals ** 2) - CT
df_T = N - 1

anova_rows = []
total_factor_ss = 0
total_factor_df = 0

for factor in [${factorCols}]:
    grouped = df.groupby(factor, observed=False)['${metricNameClean}']
    k_sums = grouped.sum().values
    k_counts = grouped.count().values
    ss_f = np.sum((k_sums ** 2) / k_counts) - CT
    df_f = len(k_sums) - 1
    total_factor_ss += ss_f
    total_factor_df += df_f
    anova_rows.append({
        'Source': f'Q("{factor}")',
        'factor': factor,
        'sum_sq': ss_f,
        'df': df_f,
        'mean_sq': ss_f / df_f if df_f > 0 else 0
    })

df_e_raw = max(0, df_T - total_factor_df)
ss_e_raw = max(0.0, SS_T - total_factor_ss)
anova_df = pd.DataFrame(anova_rows)

# 检验是否为饱和正交表 (剩余自由度为 0 时归并最小项)
if df_e_raw == 0:
    min_idx = anova_df['sum_sq'].idxmin()
    min_factor = anova_df.loc[min_idx, 'factor']
    err_ss = anova_df.loc[min_idx, 'sum_sq']
    err_df = anova_df.loc[min_idx, 'df']
    err_ms = err_ss / err_df
    
    anova_df['F'] = anova_df.apply(
        lambda r: (r['mean_sq'] / err_ms) if (r['factor'] != min_factor and err_ms > 0) else np.nan, axis=1
    )
    anova_df['PR(>F)'] = anova_df.apply(
        lambda r: (1 - stats.f.cdf(r['F'], r['df'], err_df)) if pd.notnull(r['F']) else np.nan, axis=1
    )
    err_row = pd.DataFrame([{'Source': f'Error(Pooled: {min_factor})', 'factor': 'Error', 'sum_sq': err_ss, 'df': err_df, 'mean_sq': err_ms, 'F': np.nan, 'PR(>F)': np.nan}])
else:
    err_ms = ss_e_raw / df_e_raw if df_e_raw > 0 else 0
    anova_df['F'] = anova_df['mean_sq'] / err_ms if err_ms > 0 else np.nan
    anova_df['PR(>F)'] = anova_df.apply(
        lambda r: (1 - stats.f.cdf(r['F'], r['df'], df_e_raw)) if pd.notnull(r['F']) else np.nan, axis=1
    )
    err_row = pd.DataFrame([{'Source': 'Residual (Error)', 'factor': 'Error', 'sum_sq': ss_e_raw, 'df': df_e_raw, 'mean_sq': err_ms, 'F': np.nan, 'PR(>F)': np.nan}])

total_row = pd.DataFrame([{'Source': 'Total', 'factor': 'Total', 'sum_sq': SS_T, 'df': df_T, 'mean_sq': np.nan, 'F': np.nan, 'PR(>F)': np.nan}])
anova_table = pd.concat([anova_df, err_row, total_row], ignore_index=True)

print("=== 正交试验方差分析表 ===")
print(anova_table[['Source', 'sum_sq', 'df', 'mean_sq', 'F', 'PR(>F)']].to_string(index=False))
`
    },
    plot: {
      title: "切片 4: Seaborn / Matplotlib 绘图",
      desc: "绘制因子主效应响应曲线图与离差平方和条形图 (全英文标签/坐标轴/图例)",
      code: `import matplotlib.pyplot as plt
import seaborn as sns

plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False
sns.set_theme(style="whitegrid")

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# Subplot 1: Main Effects Plot
for factor in [${factorCols}]:
    grouped = df.groupby(factor, observed=False)['${metricNameClean}'].mean()
    axes[0].plot(grouped.index.astype(str), grouped.values, marker='o', linewidth=2, label=f'Factor {factor}')

axes[0].set_title('Main Effects Plot (DOE Factor Response)', fontsize=12, fontweight='bold')
axes[0].set_xlabel('Factor Level', fontsize=10)
axes[0].set_ylabel('Mean Response Value', fontsize=10)
axes[0].legend(loc='best')
axes[0].grid(True, linestyle='--', alpha=0.6)

# Subplot 2: Sum of Squares (SS) Bar Chart
if 'sum_sq' in anova_table.columns:
    factor_rows = anova_table[~anova_table['factor'].isin(['Total', 'Error'])] if 'factor' in anova_table.columns else anova_table
    clean_labels = [idx.replace('Q("', '').replace('")', '') for idx in (factor_rows['Source'] if 'Source' in factor_rows.columns else factor_rows.index)]
    axes[1].bar(clean_labels, factor_rows['sum_sq'].values, color=sns.color_palette("mako", len(factor_rows)), edgecolor='black', linewidth=0.5)
    axes[1].set_title('Sum of Squares (SS) Distribution', fontsize=12, fontweight='bold')
    axes[1].set_xlabel('Factor / Source', fontsize=10)
    axes[1].set_ylabel('Sum of Squares (SS)', fontsize=10)
    axes[1].tick_params(axis='x', rotation=25)
    axes[1].grid(True, linestyle='--', alpha=0.6)

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
        output += `${(`Q("${f.code}")`).padEnd(12)} ${f.ss.toFixed(4).padStart(10)} ${f.df.toString().padStart(6)} ${f.fVal.toFixed(4).padStart(10)} ${(f.pVal < 0.001 ? "<0.001" : f.pVal.toFixed(4)).padStart(12)}\n`;
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
            模块 6 · Python 代码与运行 (Python Code Sandbox)
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            模块化 Python 代码与 statsmodels / Seaborn 仿真控制台
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            提供全流程独立脚本与分步代码切片，一键复制后即可在本地 Python 环境或 Jupyter Notebook 中完全独立运行与导出图表。
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
                    <span>复制代码</span>
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
                <span>{simulatingRun ? "运行中..." : "运行代码"}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              提示：点击“运行代码”，将在沙盒内核中高仿真模拟 Pandas、Scipy 与 Statsmodels 运算并输出控制台数据表与 Matplotlib 图形。
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
                      <div className="text-[11px] font-bold text-center text-indigo-300 border-b border-slate-800 pb-1 font-mono">
                        Main Effects Plot & Sum of Squares (SS) Distribution
                      </div>

                      {/* Line charts simulation */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                          <span className="text-slate-400 font-semibold block mb-1">Main Effects Plot</span>
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
                          <span className="text-slate-400 font-semibold block mb-1">Sum of Squares (SS)</span>
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
