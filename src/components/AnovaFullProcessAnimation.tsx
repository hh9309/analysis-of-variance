import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Calculator,
  Sparkles,
  ChevronRight,
  Table,
  BarChart3,
  TrendingUp,
  Award,
  Zap,
  Beaker
} from "lucide-react";

interface AnovaFullProcessAnimationProps {
  onLoadCaseToSandbox?: (arrayId: string) => void;
}

export const AnovaFullProcessAnimation: React.FC<AnovaFullProcessAnimationProps> = ({
  onLoadCaseToSandbox
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(3000); // ms per step

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= 5) {
            setIsPlaying(false);
            return 5;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed]);

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsPlaying(false);
  };

  // Sample Classic Data: 化工反应提纯产率 L9(3^4)
  const runsData = [
    { run: 1, A: 1, B: 1, C: 1, y: 82.5 },
    { run: 2, A: 1, B: 2, C: 2, y: 88.2 },
    { run: 3, A: 1, B: 3, C: 3, y: 84.1 },
    { run: 4, A: 2, B: 1, C: 2, y: 87.6 },
    { run: 5, A: 2, B: 2, C: 3, y: 93.8 },
    { run: 6, A: 2, B: 3, C: 1, y: 89.2 },
    { run: 7, A: 3, B: 1, C: 3, y: 91.0 },
    { run: 8, A: 3, B: 2, C: 1, y: 96.5 },
    { run: 9, A: 3, B: 3, C: 2, y: 92.3 }
  ];

  // Calculated Level Averages
  // Factor A: k1=(82.5+88.2+84.1)/3=84.93, k2=(87.6+93.8+89.2)/3=90.20, k3=(91.0+96.5+92.3)/3=93.27
  // Factor B: k1=(82.5+87.6+91.0)/3=87.03, k2=(88.2+93.8+96.5)/3=92.83, k3=(84.1+89.2+92.3)/3=88.53
  // Factor C: k1=(82.5+89.2+96.5)/3=89.40, k2=(88.2+87.6+92.3)/3=89.37, k3=(84.1+93.8+91.0)/3=89.63

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            经典实战案例全流程动画推导
          </div>
          <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <Beaker className="w-5 h-5 text-indigo-400" />
            高纯度化学合成提纯产率正交实验与 ANOVA 推演全景
          </h3>
          <p className="text-xs text-slate-400">
            精选 $L_9(3^4)$ 精细化工真实参数（温度 A、压力 B、催化剂 C），带您从正交矩阵导入逐步推演至方差分析假设检验结论。
          </p>
        </div>

        {/* Play / Pause & Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "暂停动画" : "播放全流程动画"}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
            title="重新播放"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setPlaybackSpeed(4000)}
              className={`px-2 py-0.5 rounded-md font-mono ${playbackSpeed === 4000 ? "bg-indigo-600 text-white font-bold" : "text-slate-400"}`}
            >
              1x
            </button>
            <button
              onClick={() => setPlaybackSpeed(2500)}
              className={`px-2 py-0.5 rounded-md font-mono ${playbackSpeed === 2500 ? "bg-indigo-600 text-white font-bold" : "text-slate-400"}`}
            >
              1.5x
            </button>
          </div>
        </div>
      </div>

      {/* 5 Progress Steps Nav */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { step: 1, name: "1. 矩阵导入", desc: "正交试验设计与测量" },
          { step: 2, name: "2. 水平均值与极差", desc: "K值、k均值与 R 排序" },
          { step: 3, name: "3. 平方和 SS", desc: "SST = SSA + SSB + SSe" },
          { step: 4, name: "4. MS 与 F 比", desc: "自由度与 F 统计量" },
          { step: 5, name: "5. F 检验结论", desc: "显著性拒绝域与配方" }
        ].map((item) => {
          const isActive = currentStep === item.step;
          const isDone = currentStep > item.step;
          return (
            <button
              key={item.step}
              onClick={() => {
                setCurrentStep(item.step);
                setIsPlaying(false);
              }}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                isActive
                  ? "bg-indigo-600/30 border-indigo-500 text-white ring-2 ring-indigo-500/40"
                  : isDone
                  ? "bg-slate-800/80 border-slate-700 text-indigo-300"
                  : "bg-slate-900/50 border-slate-800 text-slate-500 hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span>{item.name}</span>
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
              <p className="text-[10px] opacity-75 mt-0.5 truncate hidden sm:block">{item.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Animated Main Stage Canvas */}
      <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 min-h-[320px] flex flex-col justify-between space-y-4">
        {/* STEP 1: Orthogonal Design Matrix Import */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <Table className="w-4 h-4 text-indigo-400" />
                步骤 1：导入标准 $L_9(3^4)$ 正交表与提纯产率测量值
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                总试验号 N = 9 | 总产率和 T = 815.0% | 均值 ȳ = 89.44%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse font-mono">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <th className="py-1.5 px-2">试验号</th>
                      <th className="py-1.5 px-2 text-indigo-300">A: 温度 (°C)</th>
                      <th className="py-1.5 px-2 text-emerald-300">B: 压力 (MPa)</th>
                      <th className="py-1.5 px-2 text-amber-300">C: 催化剂 (wt%)</th>
                      <th className="py-1.5 px-2 text-sky-300 bg-indigo-950/60">产率 y (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {runsData.map((r, idx) => (
                      <tr
                        key={r.run}
                        className="hover:bg-slate-800/50 transition-all duration-300"
                        style={{
                          animation: `slideIn 0.3s ease-out ${idx * 0.08}s both`
                        }}
                      >
                        <td className="py-1.5 px-2 text-slate-400 font-bold">{r.run}</td>
                        <td className="py-1.5 px-2 text-slate-200">
                          A<sub>{r.A}</sub> ({r.A === 1 ? 120 : r.A === 2 ? 140 : 160})
                        </td>
                        <td className="py-1.5 px-2 text-slate-200">
                          B<sub>{r.B}</sub> ({r.B === 1 ? 1.2 : r.B === 2 ? 1.5 : 1.8})
                        </td>
                        <td className="py-1.5 px-2 text-slate-200">
                          C<sub>{r.C}</sub> ({r.C === 1 ? 0.5 : r.C === 2 ? 1.0 : 1.5})
                        </td>
                        <td className="py-1.5 px-2 font-bold text-sky-300 bg-indigo-950/40">
                          {r.y.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-center">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  正交特性导入解析
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  全面组合需尝试 $3^3 = 27$ 次试验。借助 $L_9(3^4)$ 标准正交表，仅需 9 次试验即能均匀分布于 3 维参数空间中，各因子水平出现频次完全均衡（各 3 次）。
                </p>
                <div className="p-2.5 bg-indigo-950/50 rounded-lg border border-indigo-800/50 text-[11px] text-indigo-200">
                  矫正项 CT = T²/N = 815.0²/9 = 73802.78
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Level Averages & Range Analysis */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                步骤 2：因子各水平均值 $k_i$ 计算与极差 $R$ 排序
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                极差主次排序: A (极差 8.34) &gt; B (极差 5.80) &gt; C (极差 0.26)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Factor A */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">因素 A: 反应温度 (°C)</span>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded font-bold text-[10px]">
                    极差 R_A = 8.34
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>水平 1 (120°C):</span>
                    <span>k<sub>A1</sub> = 84.93%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>水平 2 (140°C):</span>
                    <span>k<sub>A2</sub> = 90.20%</span>
                  </div>
                  <div className="flex justify-between text-indigo-300 font-bold bg-indigo-950/40 px-1 rounded">
                    <span>水平 3 (160°C) ★:</span>
                    <span>k<sub>A3</sub> = 93.27%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                </div>
              </div>

              {/* Factor B */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">因素 B: 反应压力 (MPa)</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded font-bold text-[10px]">
                    极差 R_B = 5.80
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>水平 1 (1.2MPa):</span>
                    <span>k<sub>B1</sub> = 87.03%</span>
                  </div>
                  <div className="flex justify-between text-emerald-300 font-bold bg-emerald-950/40 px-1 rounded">
                    <span>水平 2 (1.5MPa) ★:</span>
                    <span>k<sub>B2</sub> = 92.83%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>水平 3 (1.8MPa):</span>
                    <span>k<sub>B3</sub> = 88.53%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              {/* Factor C */}
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">因素 C: 催化剂 (wt%)</span>
                  <span className="px-2 py-0.5 bg-amber-950 text-amber-300 rounded font-bold text-[10px]">
                    极差 R_C = 0.26
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>水平 1 (0.5%):</span>
                    <span>k<sub>C1</sub> = 89.40%</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>水平 2 (1.0%):</span>
                    <span>k<sub>C2</sub> = 89.37%</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold bg-amber-950/40 px-1 rounded">
                    <span>水平 3 (1.5%) ★:</span>
                    <span>k<sub>C3</sub> = 89.63%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: "12%" }}></div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between text-slate-300">
              <span>极差直观推论：<b>因素 A (温度)</b> 对产率波动影响最大；<b>因素 C (催化剂)</b> 在此区间波动极小。</span>
              <span className="font-bold text-indigo-300">初步组合: A₃ B₂ C₃</span>
            </div>
          </div>
        )}

        {/* STEP 3: Sum of Squares SS Decomposition */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                步骤 3：变异离差平方和（Sum of Squares）定量分解
              </span>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                SS_T (138.82) = SS_A (91.46) + SS_B (32.14) + SS_C (0.10) + SS_e (15.12)
              </span>
            </div>

            {/* Visual Bar Stack */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>总离差平方和分解占比 (SS_T = 138.82)</span>
                <span>SS_A (65.9%) + SS_B (23.2%) + SS_e (10.9%)</span>
              </div>
              <div className="h-6 w-full bg-slate-800 rounded-lg flex overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-indigo-600 h-full text-[10px] font-bold text-white flex items-center justify-center transition-all duration-500"
                  style={{ width: "65.9%" }}
                  title="SS_A = 91.46"
                >
                  SS_A (91.46)
                </div>
                <div
                  className="bg-emerald-600 h-full text-[10px] font-bold text-white flex items-center justify-center transition-all duration-500"
                  style={{ width: "23.2%" }}
                  title="SS_B = 32.14"
                >
                  SS_B
                </div>
                <div
                  className="bg-amber-600 h-full text-[10px] font-bold text-white flex items-center justify-center transition-all duration-500"
                  style={{ width: "1%" }}
                  title="SS_C = 0.10"
                ></div>
                <div
                  className="bg-slate-500 h-full text-[10px] font-bold text-white flex items-center justify-center transition-all duration-500"
                  style={{ width: "10.9%" }}
                  title="SS_e = 15.12"
                >
                  SS_e
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-800/60 text-center">
                <span className="text-indigo-300 text-[10px] block font-sans">因素 A 离差 SS_A</span>
                <span className="text-base font-bold text-indigo-200">91.46</span>
              </div>
              <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-800/60 text-center">
                <span className="text-emerald-300 text-[10px] block font-sans">因素 B 离差 SS_B</span>
                <span className="text-base font-bold text-emerald-200">32.14</span>
              </div>
              <div className="p-3 bg-amber-950/40 rounded-lg border border-amber-800/60 text-center">
                <span className="text-amber-300 text-[10px] block font-sans">因素 C 离差 SS_C</span>
                <span className="text-base font-bold text-amber-200">0.10</span>
              </div>
              <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-center">
                <span className="text-slate-400 text-[10px] block font-sans">误差 离差 SS_e</span>
                <span className="text-base font-bold text-slate-200">15.12</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Degrees of Freedom df, Mean Square MS & F-Ratio */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                步骤 4：自由度 df 分配、均方 MS 与 F 检验统计量计算
              </span>
              <span className="text-[11px] text-sky-300 font-mono">
                F_A = MS_A / MS_e = 45.73 / 7.56 = 6.05 | F_B = 2.13
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                    <th className="py-2 px-3 text-left">变异来源 Source</th>
                    <th className="py-2 px-3">平方和 SS</th>
                    <th className="py-2 px-3">自由度 df</th>
                    <th className="py-2 px-3 text-indigo-300">均方 MS = SS/df</th>
                    <th className="py-2 px-3 text-emerald-300 font-bold">F 比值 = MS/MS_e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="bg-indigo-950/30">
                    <td className="py-2 px-3 text-left font-bold text-indigo-300">因素 A (温度)</td>
                    <td className="py-2 px-3">91.46</td>
                    <td className="py-2 px-3">2 (3-1)</td>
                    <td className="py-2 px-3 font-bold text-indigo-200">45.73</td>
                    <td className="py-2 px-3 font-extrabold text-emerald-400 bg-emerald-950/40">6.05</td>
                  </tr>
                  <tr className="bg-emerald-950/20">
                    <td className="py-2 px-3 text-left font-bold text-emerald-300">因素 B (压力)</td>
                    <td className="py-2 px-3">32.14</td>
                    <td className="py-2 px-3">2 (3-1)</td>
                    <td className="py-2 px-3 font-bold text-emerald-200">16.07</td>
                    <td className="py-2 px-3 font-bold text-emerald-300">2.13</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-left font-bold text-amber-300">因素 C (催化剂)</td>
                    <td className="py-2 px-3">0.10</td>
                    <td className="py-2 px-3">2 (3-1)</td>
                    <td className="py-2 px-3">0.05</td>
                    <td className="py-2 px-3 text-slate-400">0.01 (拟归入误差)</td>
                  </tr>
                  <tr className="bg-slate-900/80">
                    <td className="py-2 px-3 text-left text-slate-400">系统残差 Error</td>
                    <td className="py-2 px-3">15.12</td>
                    <td className="py-2 px-3">2</td>
                    <td className="py-2 px-3 font-bold text-slate-300">7.56</td>
                    <td className="py-2 px-3 text-slate-500">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 5: F-Distribution Hypothesis Testing & Final Conclusion */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                步骤 5：F 检验临界值比较、拒绝域判定与最优工艺落地
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                结论：因素 A 显著；推荐最优参数组合 A₃ B₂ C₃ (预估产率 &gt; 96.5%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* SVG F Curve */}
              <div className="md:col-span-7 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>F 分布曲线 F(2, 2)</span>
                  <span className="text-red-400 font-bold">临界值 F_0.05(2,2) = 19.00</span>
                </div>
                <div className="h-44 w-full relative">
                  <svg viewBox="0 0 400 160" className="w-full h-full">
                    {/* F Curve Path */}
                    <path
                      d="M 20 140 C 40 40, 100 80, 380 140"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="2.5"
                    />
                    <line x1="20" y1="140" x2="380" y2="140" stroke="#475569" strokeWidth="1.5" />

                    {/* Critical F line */}
                    <line x1="280" y1="20" x2="280" y2="140" stroke="#f87171" strokeWidth="2" strokeDasharray="3,3" />
                    <text x="275" y="15" fill="#f87171" fontSize="9" textAnchor="end" fontWeight="bold">
                      F_0.05 = 19.00
                    </text>

                    {/* Rejection Area Shade */}
                    <path d="M 280 140 C 310 135, 340 138, 380 140 L 380 140 L 280 140 Z" fill="#ef4444" opacity="0.4" />

                    {/* Factor A position */}
                    <line x1="180" y1="30" x2="180" y2="140" stroke="#34d399" strokeWidth="2" />
                    <circle cx="180" cy="140" r="4" fill="#34d399" />
                    <text x="185" y="45" fill="#34d399" fontSize="10" fontWeight="bold">
                      实测 F_A = 6.05
                    </text>
                  </svg>
                </div>
              </div>

              {/* Engineering Takeaway Box */}
              <div className="md:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-4 rounded-xl border border-indigo-800/80 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Zap className="w-4 h-4 text-amber-400" />
                    工程应用落地决策
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-start gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><b>反应温度 (A)</b> 为第一主导指标，宜选最高水平 <b>A₃ (160°C)</b>。</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><b>反应压力 (B)</b> 选用极差高峰水平 <b>B₂ (1.5MPa)</b>。</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><b>催化剂 (C)</b> 影响极小，出于降低成本考量可选择低浓度水平 <b>C₁ (0.5%)</b> 或 <b>C₃</b>。</span>
                    </li>
                  </ul>
                </div>

                {onLoadCaseToSandbox && (
                  <button
                    onClick={() => onLoadCaseToSandbox("L9_3_4")}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <span>导入此正交案例至交互沙盒深入诊断</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation bar */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
          >
            ← 上一步
          </button>

          <span className="text-slate-400 text-[11px]">
            步骤 {currentStep} / 5
          </span>

          <button
            onClick={handleNext}
            disabled={currentStep === 5}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold disabled:opacity-40 transition-colors flex items-center gap-1"
          >
            <span>下一步</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
