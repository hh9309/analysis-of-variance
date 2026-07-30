import React, { useState } from "react";
import { BookOpen, Table, Layers, Target, HelpCircle, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { STANDARD_ORTHOGONAL_ARRAYS } from "../data/standardTables";
import { AnovaFullProcessAnimation } from "./AnovaFullProcessAnimation";

interface Module1Props {
  onSelectArray: (arrayId: string) => void;
}

export const Module1ConceptualGuide: React.FC<Module1Props> = ({ onSelectArray }) => {
  const [selectedFactorCount, setSelectedFactorCount] = useState<number>(4);
  const [selectedLevelCount, setSelectedLevelCount] = useState<number>(3);

  // Filter suited arrays
  const matchedArrays = STANDARD_ORTHOGONAL_ARRAYS.filter(
    (arr) => arr.numFactors >= selectedFactorCount && arr.levelsPerFactor.includes(selectedLevelCount)
  );

  return (
    <div className="space-y-6">
      {/* Title Slice */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <BookOpen className="w-3.5 h-3.5" />
              模块 1 · 知识引导 (Conceptual Guide)
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              正交实验设计：因素水平映射与精准选表逻辑
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">
              正交实验设计（Orthogonal Experimental Design）是研究多因素多水平问题的高效统计学方法。利用正交表从全面试验中挑选出最具代表性的组合，实现“以少胜多”的极佳试验效果。
            </p>
          </div>
        </div>

        {/* 3 Sliced Core Concept Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">因素 (Factor) 与 水平 (Level)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>因素（A, B, C...）</strong>：影响实验指标的可调参数（如温度、压力、催化剂比）。
              <br />
              <strong>水平（1, 2, 3...）</strong>：每个因素在试验中拟采用的考察状态或具体数值。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">均衡分散 (Uniform Dispersion)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              试验点在因素代表的空间内均匀分布。例如考察 3⁴ = 81 种全组合时，L₉(3⁴) 仅取 9 个代表性试验点，即能均匀覆盖整个立体参数空间。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="font-semibold text-slate-900 text-sm">整齐可比 (Neat Comparability)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              正交表中任意两列，同行数字对 (i, j) 出现的次数完全相同。进行极差与方差分析时，其他因素的影响可相互抵消。
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Selection Guide & Geometric Visualization Slice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orthogonal Table Selection Calculator */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Table className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">正交表智能选型匹配器</h3>
          </div>

          <p className="text-xs text-slate-600">
            根据您的实验设计需求，选择拟考察的<b>因素数量</b>与<b>水平数量</b>，系统将实时匹配标准正交表。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                拟考察因素数量 (Factors): <span className="text-indigo-600">{selectedFactorCount} 个</span>
              </label>
              <input
                type="range"
                min={2}
                max={7}
                value={selectedFactorCount}
                onChange={(e) => setSelectedFactorCount(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>2 个</span>
                <span>4 个</span>
                <span>7 个</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                各因素水平数 (Levels): <span className="text-indigo-600">{selectedLevelCount} 水平</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[2, 3, 4].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevelCount(lvl)}
                    className={`py-1 text-xs font-medium rounded border transition-colors ${
                      selectedLevelCount === lvl
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {lvl} 水平
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matched Tables Result */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
              <span>匹配到的推荐标准正交表 ({matchedArrays.length})：</span>
            </div>

            <div className="space-y-2">
              {matchedArrays.length > 0 ? (
                matchedArrays.map((arr) => (
                  <div
                    key={arr.id}
                    className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-700">
                          {arr.name}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-200 text-slate-700 rounded">
                          {arr.runs} 次试验
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-800 rounded">
                          效率提升 {Math.round((1 - arr.runs / Math.pow(selectedLevelCount, selectedFactorCount)) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{arr.description}</p>
                    </div>

                    <button
                      onClick={() => onSelectArray(arr.id)}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 transition-all flex items-center space-x-1 shrink-0"
                    >
                      <span>载入沙盒</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200">
                  当前条件可参考混合正交表（如 L8 2¹×4¹）或扩展主因素筛选表。
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Geometry & Comparability Visualizer SVG */}
        <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">正交性几何直观图解</h3>
            </div>
            <span className="text-xs text-slate-400">L9 (3³) 空间分布</span>
          </div>

          <div className="relative aspect-4/3 bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center overflow-hidden">
            {/* SVG 3D Grid Orthogonal Point Projection */}
            <svg viewBox="0 0 300 220" className="w-full h-full text-indigo-400">
              <defs>
                <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#312e81" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Cube wireframe for Factor A, B, C */}
              <path
                d="M 60,170 L 200,170 L 250,110 L 110,110 Z"
                fill="url(#gridGrad)"
                stroke="#475569"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <path
                d="M 60,60 L 200,60 L 250,10 L 110,10 Z"
                fill="none"
                stroke="#475569"
                strokeWidth="1.5"
              />
              <line x1="60" y1="170" x2="60" y2="60" stroke="#475569" strokeWidth="1.5" />
              <line x1="200" y1="170" x2="200" y2="60" stroke="#475569" strokeWidth="1.5" />
              <line x1="250" y1="110" x2="250" y2="10" stroke="#475569" strokeWidth="1.5" />
              <line x1="110" y1="110" x2="110" y2="10" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,3" />

              {/* Axis Labels */}
              <text x="210" y="185" fill="#94a3b8" fontSize="10" fontWeight="bold">因素 A (温度)</text>
              <text x="255" y="105" fill="#94a3b8" fontSize="10" fontWeight="bold">因素 B (压力)</text>
              <text x="40" y="55" fill="#94a3b8" fontSize="10" fontWeight="bold">因素 C (时间)</text>

              {/* 9 Orthogonal Points with glowing pulses */}
              {[
                { x: 60, y: 170, label: "P1 (1,1,1)" },
                { x: 130, y: 140, label: "P2 (1,2,2)" },
                { x: 200, y: 110, label: "P3 (1,3,3)" },
                { x: 85, y: 115, label: "P4 (2,1,2)" },
                { x: 155, y: 85, label: "P5 (2,2,3)" },
                { x: 225, y: 55, label: "P6 (2,3,1)" },
                { x: 110, y: 60, label: "P7 (3,1,3)" },
                { x: 180, y: 30, label: "P8 (3,2,1)" },
                { x: 250, y: 10, label: "P9 (3,3,2)" }
              ].map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="7" fill="#38bdf8" opacity="0.3">
                    <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={p.x} cy={p.y} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                </g>
              ))}
            </svg>

            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-800/80 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-700">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> 全面组合：3³ = 27 点
              </span>
              <span className="text-indigo-300">正交采点：仅 9 点（节省 66.7% 试验）</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 leading-relaxed border border-slate-200/60">
            <strong>选表原则口诀：</strong>
            <br />
            “明确因素与水平，查表确定例数限；因素过多找大表，水平不同用混合；误差列数留充分，方差分析更有据。”
          </div>
        </div>
      </div>

      {/* Classic Case Full-Process ANOVA Animation (Moved to bottom) */}
      <AnovaFullProcessAnimation onLoadCaseToSandbox={onSelectArray} />
    </div>
  );
};
