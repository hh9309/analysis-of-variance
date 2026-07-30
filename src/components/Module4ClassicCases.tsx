import React from "react";
import { Briefcase, ArrowRight, CheckCircle2, Beaker, Wrench, Stethoscope, Sparkles } from "lucide-react";
import { CLASSIC_CASES } from "../data/classicCases";
import { ClassicCase } from "../types";

interface Module4Props {
  onLoadCase: (caseItem: ClassicCase) => void;
}

export const Module4ClassicCases: React.FC<Module4Props> = ({ onLoadCase }) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "chemical":
        return <Beaker className="w-5 h-5 text-indigo-600" />;
      case "industrial":
        return <Wrench className="w-5 h-5 text-emerald-600" />;
      case "biomedical":
        return <Stethoscope className="w-5 h-5 text-amber-600" />;
      default:
        return <Briefcase className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Slice */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
          <Briefcase className="w-3.5 h-3.5" />
          模块 4 · 经典工程案例 (Classic Cases)
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
          化工、精密制造与生物医药 3 大工程实战场景演示
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          精选真实工程科研实战案例，预设完整因素水平正交表与响应测量数据，支持一键复现并导入沙盒进行极差与方差诊断。
        </p>
      </div>

      {/* 3 Engineering Case Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {CLASSIC_CASES.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded">
                      {item.tag}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{item.title}</h3>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

              {/* Factors & Levels List Slices */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-xs">
                <span className="font-bold text-slate-800 text-[11px] block">因素水平设计 ({item.factors.length} 因素):</span>
                <div className="space-y-1">
                  {item.factors.map((f) => (
                    <div key={f.code} className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>
                        <strong className="text-indigo-700">{f.code}</strong>. {f.name}:
                      </span>
                      <span className="font-mono text-slate-800">
                        [{f.levels.join(", ")}] {f.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engineering Takeaways */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-800 block">工程调优关键发现：</span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {item.engineeringTakeaways.map((tk, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Load Action Button */}
            <button
              onClick={() => onLoadCase(item)}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs flex items-center justify-center space-x-1.5 group"
            >
              <span>载入该案例至智能实验室</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
