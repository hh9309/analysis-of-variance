import React, { useState } from "react";
import { FileText, Printer, Download, Copy, Check, Sparkles, Award, TrendingUp, Cpu, CheckCircle2, AlertCircle } from "lucide-react";
import { Factor, ExperimentRun, RangeAnalysisResult, AnovaResult } from "../types";

interface Module8Props {
  title: string;
  selectedArrayName: string;
  targetMetricName: string;
  goal: "maximize" | "minimize";
  factors: Factor[];
  runs: ExperimentRun[];
  rangeResult: RangeAnalysisResult;
  anovaResult: AnovaResult;
  aiReport: string | null;
}

export const Module8ReportExport: React.FC<Module8Props> = ({
  title,
  selectedArrayName,
  targetMetricName,
  goal,
  factors,
  runs,
  rangeResult,
  anovaResult,
  aiReport
}) => {
  const [copiedMd, setCopiedMd] = useState<boolean>(false);

  // Fundamental statistics calculation
  const totalN = runs.length;
  const values = runs.map((r) => r.value);
  const meanY = values.length > 0 ? values.reduce((a, b) => a + b, 0) / totalN : 0;
  const minY = values.length > 0 ? Math.min(...values) : 0;
  const maxY = values.length > 0 ? Math.max(...values) : 0;
  const varianceY = values.length > 1
    ? values.reduce((sum, v) => sum + Math.pow(v - meanY, 2), 0) / (totalN - 1)
    : 0;
  const sdY = Math.sqrt(varianceY);

  // R-squared and Fit Quality
  const totalSs = anovaResult.totalSs || 1;
  const errorSs = anovaResult.errorSs || 0;
  const rSquared = Math.max(0, Math.min(1, (totalSs - errorSs) / totalSs));
  const totalDf = anovaResult.totalDf || 1;
  const totalMs = totalSs / totalDf;
  const adjRSquared = Math.max(0, 1 - (anovaResult.errorMs / (totalMs || 1)));

  // Additive model prediction formula
  let predictedOptimal = meanY;
  rangeResult.factors.forEach((f) => {
    const bestLvl = rangeResult.optimalCombination[f.code]?.level || f.bestLevel;
    const bestMean = f.levelMeans[bestLvl] ?? meanY;
    predictedOptimal += (bestMean - meanY);
  });
  const expectedGain = goal === "maximize" ? predictedOptimal - meanY : meanY - predictedOptimal;

  // Build full Markdown report with 7 detailed sections
  const generateFullMarkdown = () => {
    let md = `# ${title || "正交实验与方差分析报告"}\n\n`;
    md += `> **报告性质**: DOE 正交实验与方差分析 (ANOVA) 综合学术/工程分析报告\n`;
    md += `> **正交阵列**: ${selectedArrayName} | **响应指标**: ${targetMetricName || "指标"} (${goal === "maximize" ? "目标最大化" : "目标最小化"})\n`;
    md += `> **导出时间**: ${new Date().toLocaleString("zh-CN")}\n\n`;
    md += `---\n\n`;

    // Section 1: Overview & Schema
    md += `## 一、 实验项目概述与参数配置 (Project Overview & Schema)\n\n`;
    md += `本试验采用正交表 **${selectedArrayName}** 安排离散组合试验，旨在评估 **${factors.length}** 个核心工艺因素对响应指标 **${targetMetricName}** 的影响规律。\n\n`;
    md += `### 因素-水平控制参数配置表\n\n`;
    md += `| 因素编码 | 因素名称 | 水平 1 | 水平 2 | 水平 3 | 水平 4 |\n`;
    md += `| :---: | :--- | :---: | :---: | :---: | :---: |\n`;
    factors.forEach((f) => {
      const l1 = f.levels[0] !== undefined ? f.levels[0] : "-";
      const l2 = f.levels[1] !== undefined ? f.levels[1] : "-";
      const l3 = f.levels[2] !== undefined ? f.levels[2] : "-";
      const l4 = f.levels[3] !== undefined ? f.levels[3] : "-";
      md += `| **${f.code}** | ${f.name} | ${l1} | ${l2} | ${l3} | ${l4} |\n`;
    });
    md += `\n`;

    // Section 2: Orthogonal Design Matrix & Observed Data
    md += `## 二、 正交实验设计矩阵与原始测量数据 (DOE Matrix & Raw Data)\n\n`;
    md += `全表共包含 **${totalN}** 组标准离散实验。试样实测响应分布区间为 **[${minY.toFixed(2)}, ${maxY.toFixed(2)}]**，试验均值为 **${meanY.toFixed(2)}**，标准差为 **${sdY.toFixed(2)}**。\n\n`;
    md += `| 试验号 | ${factors.map((f) => `${f.code} (${f.name})`).join(" | ")} | 响应测定值 (${targetMetricName}) |\n`;
    md += `| :---: | ${factors.map(() => ":---:").join(" | ")} | :---: |\n`;
    runs.forEach((r) => {
      const fLevelsStr = factors
        .map((f) => `${f.code}_${r.factorLevels[f.code]}`)
        .join(" | ");
      md += `| **Run ${r.runIndex}** | ${fLevelsStr} | **${r.value.toFixed(2)}** |\n`;
    });
    md += `\n`;

    // Section 3: Range Analysis
    md += `## 三、 极差分析表与因子主次排序 (Range Analysis)\n\n`;
    md += `通过对各水平下的响应均值 $k_{ij}$ 进行离散归纳，得出各因素的极差 $R_j$ (Range)。极差越大，表明该因素水平变动对响应指标的诱发效应越显著。\n\n`;
    md += `| 统计量 | ${rangeResult.factors.map((f) => `${f.code} (${f.name})`).join(" | ")} |\n`;
    md += `| :--- | ${rangeResult.factors.map(() => ":---:").join(" | ")} |\n`;

    [1, 2, 3, 4].forEach((lvl) => {
      const hasLvl = rangeResult.factors.some((f) => f.levelMeans[lvl] !== undefined);
      if (hasLvl) {
        md += `| 均值 k_${lvl} | ${rangeResult.factors
          .map((f) => (f.levelMeans[lvl] !== undefined ? f.levelMeans[lvl].toFixed(2) : "-"))
          .join(" | ")} |\n`;
      }
    });

    md += `| **极差 R** | ${rangeResult.factors
      .map((f) => `**${f.rangeR.toFixed(2)}**`)
      .join(" | ")} |\n`;

    md += `\n`;
    md += `- **因子影响主次关系排序**: **${rangeResult.rankedFactorCodes.join(" > ")}**\n`;
    md += `- **推导最佳水平组合**: **${Object.entries(rangeResult.optimalCombination)
      .map(([k, v]) => `${k}${(v as { level: number }).level}`)
      .join(" ")}** (即：${Object.entries(rangeResult.optimalCombination)
      .map(([k, v]) => {
        const factor = factors.find((f) => f.code === k);
        const lvlIdx = (v as { level: number }).level;
        const val = factor?.levels[lvlIdx - 1] ?? "";
        return `${k}=${val}`;
      })
      .join(", ")})\n\n`;

    // Section 4: ANOVA Table & Significance Test
    md += `## 四、 方差分析表与显著性检验 (ANOVA Table & Significance)\n\n`;
    md += `为剔除试验测量杂音与随机误差对结论的干扰，引入方差分析 (ANOVA) 对离差平方和进行分解与 F 检验。\n\n`;
    md += `| 变异来源 Source | 平方和 SS | 自由度 df | 均方 MS | F 检验值 | p 值 | 显著性判定 | 贡献率 % |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    anovaResult.factors.forEach((f) => {
      const sigStr = f.pVal < 0.01 ? "极显著 (**)" : f.pVal < 0.05 ? "显著 (*)" : "不显著";
      const rate = Math.max(0, (f.ss / totalSs) * 100);
      md += `| **因素 ${f.code} (${f.name})** | ${f.ss.toFixed(3)} | ${f.df} | ${f.ms.toFixed(3)} | **${f.fVal.toFixed(3)}** | ${f.pVal < 0.001 ? "< 0.001" : f.pVal.toFixed(4)} | ${sigStr} | ${rate.toFixed(1)}% |\n`;
    });

    const errorRate = Math.max(0, (anovaResult.errorSs / totalSs) * 100);
    md += `| **随机残差 Residual Error** | ${anovaResult.errorSs.toFixed(3)} | ${anovaResult.errorDf} | ${anovaResult.errorMs.toFixed(3)} | - | - | - | ${errorRate.toFixed(1)}% |\n`;
    md += `| **总和 Total** | ${anovaResult.totalSs.toFixed(3)} | ${anovaResult.totalDf} | - | - | - | - | 100.0% |\n\n`;

    // Section 5: Fitting Model & Residual Analysis
    md += `## 五、 模型拟合优度与效应量分析 (Model Evaluation & Residuals)\n\n`;
    md += `对正交回归拟合模型的可靠性进行量化诊断：\n\n`;
    md += `- **决定系数 ($R^2$)**: **${(rSquared * 100).toFixed(2)}%** (${rSquared > 0.85 ? "模型解释力极强" : "模型解释力良好"})\n`;
    md += `- **调整后决定系数 (Adjusted $R^2$)**: **${(adjRSquared * 100).toFixed(2)}%**\n`;
    md += `- **随机残差贡献率 ($SS_e / SS_T$)**: **${errorRate.toFixed(2)}%** (${errorRate < 15 ? "试验环境噪音控制优异" : "存在部分未控干扰因素"})\n\n`;

    // Section 6: Optimal Prediction & Verification Plan
    md += `## 六、 最优工艺预测与验证实验规划 (Optimal Prediction & Validation)\n\n`;
    md += `根据正交可加性拟合模型 (Additive Process Model)，预测在最佳因子水平组合下的理论响应指标：\n\n`;
    md += `- **全表试验平均基准值 ($\bar{y}$)**: **${meanY.toFixed(2)}**\n`;
    md += `- **加性模型理论预测最优值 ($\hat{y}_{opt}$)**: **${predictedOptimal.toFixed(2)}**\n`;
    md += `- **预期优化增益量 ($\Delta y$)**: **${expectedGain >= 0 ? "+" : ""}${expectedGain.toFixed(2)}** (${goal === "maximize" ? "提升" : "降低"})\n\n`;
    md += `### 验证实验 (Verification Runs) 实施步骤：\n`;
    md += `1. **验证样品制备**: 采用推荐最佳组合 **${Object.entries(rangeResult.optimalCombination).map(([k, v]) => `${k}${(v as { level: number }).level}`).join(" ")}** 进行 3 次重复验证实验。\n`;
    md += `2. **容差判定条件**: 实测 3 次平均值应位于预测区间 **[${(predictedOptimal * 0.95).toFixed(2)}, ${(predictedOptimal * 1.05).toFixed(2)}]** 内。\n`;
    md += `3. **固化生产标准**: 若验证结果符合预期，将该参数组合写入 SOP 标准工艺卡并下发产线执行。\n\n`;

    // Section 7: AI Engineering Insights
    md += `## 七、 AI 智能工程方案与落地建议 (AI Engineering Insights)\n\n`;
    if (aiReport) {
      md += `${aiReport}\n`;
    } else {
      const topFactor = rangeResult.rankedFactorCodes[0];
      const topFactorName = factors.find((f) => f.code === topFactor)?.name || topFactor;
      md += `1. **核心控制点**: 本次 DOE 分析表明，**因素 ${topFactor} (${topFactorName})** 是决定 ${targetMetricName} 的最主导因子，极差 $R = ${rangeResult.factors.find((f) => f.code === topFactor)?.rangeR.toFixed(2)}$，需重点对该参数设定严格的闭环监控容差。\n`;
      md += `2. **工艺组合选择**: 建议优选 **${Object.entries(rangeResult.optimalCombination).map(([k, v]) => `${k}${(v as { level: number }).level}`).join(" ")}** 作为第一标段上线工艺。\n`;
      md += `3. **成本与稳健性权衡**: 对非显著因素，可优先选择成本更低或加工更容易的中间水平，以实现经济性与工程性能的协同双赢。\n`;
    }

    return md;
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(generateFullMarkdown());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMd = () => {
    const element = document.createElement("a");
    const file = new Blob([generateFullMarkdown()], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${title || "正交实验报告"}_DOE_ANOVA_Report.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title Header Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            <FileText className="w-3.5 h-3.5" />
            模块 8 · 报告导出 (Export Report)
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
            正交与 ANOVA 方差分析报告
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            包含正交矩阵、极差表、ANOVA 表、拟合优度、理论预测值与 AI 工程实施规划，支持一键打印/导出 PDF。
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleCopyMd}
            className="px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex items-center space-x-1 border border-slate-200"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMd ? "已复制 Markdown" : "复制 Markdown"}</span>
          </button>

          <button
            onClick={handleDownloadMd}
            className="px-3.5 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors flex items-center space-x-1 border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载 .md</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印 / 导出 PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Preview Container */}
      <div id="printable-report" className="bg-white rounded-xl p-8 border border-slate-200/80 shadow-xs space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
              正交实验设计与方差分析 (DOE & ANOVA) · 综合科研/工程报告
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{title || "正交实验与方差分析报告"}</h1>
            <p className="text-xs text-slate-500 mt-1">
              正交结构: <b>{selectedArrayName}</b> | 响应指标: <b>{targetMetricName}</b> ({goal === "maximize" ? "目标最大化" : "目标最小化"})
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <span>导出日期: {new Date().toLocaleDateString("zh-CN")}</span>
          </div>
        </div>

        {/* Section 1: Project Overview & Factors */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-l-4 border-slate-900 pl-2">
            一、 实验项目概述与参数配置 (Project Overview & Schema)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            本试验采用正交表 <b>{selectedArrayName}</b> 安排离散组合试验，旨在评估 <b>{factors.length}</b> 个核心工艺因素对响应指标 <b>{targetMetricName}</b> 的影响规律与交互效应。
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3 border-r border-slate-200 w-24">因素编码</th>
                  <th className="py-2 px-3 border-r border-slate-200 text-left">因素名称</th>
                  <th className="py-2 px-3 border-r border-slate-200">水平 1</th>
                  <th className="py-2 px-3 border-r border-slate-200">水平 2</th>
                  <th className="py-2 px-3 border-r border-slate-200">水平 3</th>
                  <th className="py-2 px-3">水平 4</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {factors.map((f) => (
                  <tr key={f.code} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-800 border-r border-slate-200">{f.code}</td>
                    <td className="py-2 px-3 text-left font-medium text-slate-900 border-r border-slate-200">{f.name}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono">{f.levels[0] ?? "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono">{f.levels[1] ?? "-"}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono">{f.levels[2] ?? "-"}</td>
                    <td className="py-2 px-3 font-mono">{f.levels[3] ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Orthogonal Array Matrix & Raw Data */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-l-4 border-slate-900 pl-2">
            二、 正交实验设计矩阵与原始测量数据 (DOE Matrix & Observed Data)
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span>总实验次数 N = <b>{totalN}</b></span>
            <span>响应平均值 Mean = <b>{meanY.toFixed(2)}</b></span>
            <span>响应极值区间 = <b>[{minY.toFixed(2)}, {maxY.toFixed(2)}]</b></span>
            <span>标准差 SD = <b>{sdY.toFixed(2)}</b></span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3 border-r border-slate-200">试验号</th>
                  {factors.map((f) => (
                    <th key={f.code} className="py-2 px-3 border-r border-slate-200">
                      {f.code} ({f.name})
                    </th>
                  ))}
                  <th className="py-2 px-3 text-right bg-indigo-50/50">测定结果 ({targetMetricName})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {runs.map((r) => (
                  <tr key={r.runIndex} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 font-bold text-slate-600 border-r border-slate-200">{r.runIndex}</td>
                    {factors.map((f) => {
                      const lvl = r.factorLevels[f.code];
                      return (
                        <td key={f.code} className="py-1.5 px-3 border-r border-slate-200 font-mono">
                          {f.code}_{lvl} ({f.levels[lvl - 1]})
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-3 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {r.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Range Analysis */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-l-4 border-slate-900 pl-2">
            三、 极差分析表与因子主次排序 (Range Analysis & Ranking)
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3 text-left border-r border-slate-200">统计量</th>
                  {rangeResult.factors.map((f) => (
                    <th key={f.code} className="py-2 px-3 border-r border-slate-200">
                      {f.code} ({f.name})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[1, 2, 3, 4].map((lvl) => {
                  const hasLvl = rangeResult.factors.some((f) => f.levelMeans[lvl] !== undefined);
                  if (!hasLvl) return null;
                  return (
                    <tr key={lvl}>
                      <td className="py-1.5 px-3 text-left font-medium text-slate-600 bg-slate-50 border-r border-slate-200">
                        均值 k_{lvl}
                      </td>
                      {rangeResult.factors.map((f) => (
                        <td key={f.code} className="py-1.5 px-3 border-r border-slate-200 font-mono">
                          {f.levelMeans[lvl] !== undefined ? f.levelMeans[lvl].toFixed(2) : "-"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr className="bg-indigo-50 font-bold text-indigo-900 border-t border-indigo-200">
                  <td className="py-2 px-3 text-left border-r border-indigo-200">极差 R</td>
                  {rangeResult.factors.map((f) => (
                    <td key={f.code} className="py-2 px-3 border-r border-indigo-200 font-extrabold">
                      {f.rangeR.toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">因子影响主次关系排序:</span>
              <span className="text-indigo-700 font-extrabold text-sm">{rangeResult.rankedFactorCodes.join(" > ")}</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">推荐最优工艺条件组合:</span>
              <span className="text-emerald-700 font-extrabold text-sm">
                {Object.entries(rangeResult.optimalCombination)
                  .map(([k, v]) => `${k}${(v as { level: number }).level}`)
                  .join(" ")}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: ANOVA Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-l-4 border-slate-900 pl-2">
            四、 方差分析表与显著性检验 (ANOVA Table & Significance)
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2 px-3 text-left border-r border-slate-200">变异来源 Source</th>
                  <th className="py-2 px-3">平方和 SS</th>
                  <th className="py-2 px-3">自由度 df</th>
                  <th className="py-2 px-3">均方 MS</th>
                  <th className="py-2 px-3">F 检验值</th>
                  <th className="py-2 px-3">p 值</th>
                  <th className="py-2 px-3">显著性判定</th>
                  <th className="py-2 px-3 text-right">离差贡献率 %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {anovaResult.factors.map((f) => {
                  const rate = Math.max(0, (f.ss / totalSs) * 100);
                  return (
                    <tr key={f.code}>
                      <td className="py-2 px-3 text-left font-bold text-slate-800">
                        因素 {f.code} ({f.name})
                      </td>
                      <td className="py-2 px-3 font-mono">{f.ss.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{f.df}</td>
                      <td className="py-2 px-3 font-mono">{f.ms.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700">{f.fVal.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{f.pVal < 0.001 ? "< 0.001" : f.pVal.toFixed(4)}</td>
                      <td className="py-2 px-3 font-bold">
                        {f.pVal < 0.01 ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">极显著 (**)</span>
                        ) : f.pVal < 0.05 ? (
                          <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">显著 (*)</span>
                        ) : (
                          <span className="text-slate-500">不显著</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{rate.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr className="bg-slate-50">
                  <td className="py-2 px-3 text-left text-slate-600">随机残差 Residual Error</td>
                  <td className="py-2 px-3 font-mono">{anovaResult.errorSs.toFixed(3)}</td>
                  <td className="py-2 px-3 font-mono">{anovaResult.errorDf}</td>
                  <td className="py-2 px-3 font-mono">{anovaResult.errorMs.toFixed(3)}</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-slate-400">试验基准噪音</td>
                  <td className="py-2 px-3 text-right font-mono text-slate-500">
                    {Math.max(0, (anovaResult.errorSs / totalSs) * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                  <td className="py-2 px-3 text-left">总和 Total</td>
                  <td className="py-2 px-3 font-mono">{anovaResult.totalSs.toFixed(3)}</td>
                  <td className="py-2 px-3 font-mono">{anovaResult.totalDf}</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3">-</td>
                  <td className="py-2 px-3 text-right font-mono">100.0%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Model Evaluation & Residual Diagnostics */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-l-4 border-slate-900 pl-2">
            五、 模型拟合优度与效应量诊断 (Model Diagnostics)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">决定系数 R²</span>
              <span className="text-lg font-black text-indigo-700 font-mono">{(rSquared * 100).toFixed(2)}%</span>
              <p className="text-[11px] text-slate-500 mt-0.5">模型对响应总变异的解释比例</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">调整后 R² (Adjusted R²)</span>
              <span className="text-lg font-black text-slate-800 font-mono">{(adjRSquared * 100).toFixed(2)}%</span>
              <p className="text-[11px] text-slate-500 mt-0.5">考虑自由度惩罚后的稳健拟合度</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 block">随机误差贡献率 (Error Ratio)</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {Math.max(0, (anovaResult.errorSs / totalSs) * 100).toFixed(2)}%
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">环境未控噪音影响程度评估</p>
            </div>
          </div>
        </div>

        {/* Section 6: Optimal Prediction & Verification Plan */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-sm border-l-4 border-slate-900 pl-2">
            六、 最优工艺理论预测与验证实验规划 (Optimal Prediction & Verification Plan)
          </h3>

          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-indigo-300 font-semibold block">加性表达理论预测最优响应值 (y_hat)</span>
                <span className="text-2xl font-black text-amber-300 font-mono">{predictedOptimal.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">对比均值基准改善量 (Delta)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {expectedGain >= 0 ? "+" : ""}{expectedGain.toFixed(2)} ({goal === "maximize" ? "提升" : "降低"})
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p><b>验证实验 SOP 实施要求：</b></p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                <li>根据推荐条件 <b>{Object.entries(rangeResult.optimalCombination).map(([k, v]) => `${k}${(v as { level: number }).level}`).join(" ")}</b> 进行 3 次平行试验。</li>
                <li>测定均值若落在 <b>[{(predictedOptimal * 0.95).toFixed(2)}, ${(predictedOptimal * 1.05).toFixed(2)}]</b> 容差区间，即可正式写入产线标准工艺指导书。</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 7: AI Engineering Insights */}
        <div className="space-y-3">
          <h3 className="font-bold text-indigo-900 text-sm border-l-4 border-indigo-600 pl-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            七、 AI 智能工程决策与产线调优建议 (AI Engineering Insights)
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed font-sans text-slate-800 whitespace-pre-line">
            {aiReport || (
              <div className="space-y-2">
                <p>1. <b>核心控制参数</b>: 极差分析与 ANOVA 显著性一致表明，因素 <b>{rangeResult.rankedFactorCodes[0]}</b> 为决定 {targetMetricName} 质量的关键影响因子，建议在生产过程控制 (SPC) 中设为重点监控项。</p>
                <p>2. <b>第一标段工艺组合</b>: 推荐优先部署方案 <b>{Object.entries(rangeResult.optimalCombination).map(([k, v]) => `${k}${(v as { level: number }).level}`).join(" ")}</b>。</p>
                <p>3. <b>降本调优潜力</b>: 对于显著性较低的副因子，可在保证产品质量合格的前提下，选择能耗或物料成本更低的水平配置。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
