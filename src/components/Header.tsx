import React from "react";
import {
  BookOpen,
  Sliders,
  Calculator,
  Briefcase,
  GitMerge,
  Code,
  Sparkles,
  FileText,
  RotateCcw,
  CheckCircle2
} from "lucide-react";

export type ModuleId =
  | "guide"
  | "sandbox"
  | "anova"
  | "cases"
  | "interaction"
  | "python"
  | "ai"
  | "report";

interface HeaderProps {
  activeModule: ModuleId;
  setActiveModule: (id: ModuleId) => void;
  title: string;
  onResetData: () => void;
  selectedArrayName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  setActiveModule,
  title,
  onResetData,
  selectedArrayName
}) => {
  const navItems: { id: ModuleId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "guide", label: "1. 知识引导", icon: BookOpen },
    { id: "sandbox", label: "2. 交互拟合沙盒", icon: Sliders },
    { id: "anova", label: "3. ANOVA 逐步推导", icon: Calculator },
    { id: "cases", label: "4. 经典案例", icon: Briefcase },
    { id: "interaction", label: "5. 交互效应与诊断", icon: GitMerge },
    { id: "python", label: "6. Python 代码", icon: Code },
    { id: "ai", label: "7. AI 洞察引擎", icon: Sparkles },
    { id: "report", label: "8. 报告导出", icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top Banner Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-xs">
              Σ
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-800 flex items-center gap-2">
                正交实验设计与方差分析智能实验室
                <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded border border-blue-100">
                  v2.5 Pro
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden md:block">
                当前项目：<span className="font-semibold text-slate-700">{title}</span> （{selectedArrayName}）
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 text-xs font-medium text-slate-600 rounded-md bg-slate-50 border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>系统就绪</span>
            </div>

            <button
              onClick={onResetData}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 border border-slate-200"
              title="重置为默认 L9 正交表数据"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">重置</span>
            </button>

            <button
              onClick={() => setActiveModule("report")}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-md text-xs font-medium transition-all shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>导出研究报告</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 py-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold border border-blue-100 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
