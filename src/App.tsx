/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Header, ModuleId } from "./components/Header";
import { Module1ConceptualGuide } from "./components/Module1ConceptualGuide";
import { Module2OrthogonalSandbox } from "./components/Module2OrthogonalSandbox";
import { Module3AnovaDerivation } from "./components/Module3AnovaDerivation";
import { Module4ClassicCases } from "./components/Module4ClassicCases";
import { Module5InteractionResiduals } from "./components/Module5InteractionResiduals";
import { Module6PythonCode } from "./components/Module6PythonCode";
import { Module7AiEngine } from "./components/Module7AiEngine";
import { Module8ReportExport } from "./components/Module8ReportExport";

import { STANDARD_ORTHOGONAL_ARRAYS } from "./data/standardTables";
import { CLASSIC_CASES } from "./data/classicCases";
import { Factor, ExperimentRun, OrthogonalArrayDef, ClassicCase } from "./types";
import { calculateRangeAnalysis, calculateAnova } from "./utils/mathAnova";

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("sandbox");
  const [title, setTitle] = useState<string>("高纯度精细化工合成正交优化实验");

  // Default L9 Orthogonal Array
  const defaultArray = STANDARD_ORTHOGONAL_ARRAYS[0]; // L9 (3^4)
  const [currentArray, setCurrentArray] = useState<OrthogonalArrayDef>(defaultArray);

  // Initial Factors
  const initialFactors: Factor[] = [
    { id: "f1", code: "A", name: "反应温度", levels: [120, 140, 160], unit: "°C" },
    { id: "f2", code: "B", name: "反应压力", levels: [1.2, 1.5, 1.8], unit: "MPa" },
    { id: "f3", code: "C", name: "催化剂用量", levels: [0.5, 1.0, 1.5], unit: "wt%" },
    { id: "f4", code: "D", name: "搅拌速率", levels: [300, 500, 700], unit: "rpm" }
  ];
  const [factors, setFactors] = useState<Factor[]>(initialFactors);

  // Initial Runs Data (9 runs)
  const initialRunsData = [82.5, 88.2, 84.1, 87.6, 93.8, 89.2, 91.0, 96.5, 92.3];
  const initialRuns: ExperimentRun[] = defaultArray.matrix.map((row, idx) => ({
    runIndex: idx + 1,
    factorLevels: {
      A: row[0],
      B: row[1],
      C: row[2],
      D: row[3]
    },
    value: initialRunsData[idx] ?? 85.0
  }));
  const [runs, setRuns] = useState<ExperimentRun[]>(initialRuns);

  const [targetMetricName, setTargetMetricName] = useState<string>("合成产率 (%)");
  const [goal, setGoal] = useState<"maximize" | "minimize">("maximize");
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Real-time Range Analysis Computation
  const rangeResult = useMemo(() => {
    return calculateRangeAnalysis(factors, runs, goal);
  }, [factors, runs, goal]);

  // Real-time ANOVA Computation
  const anovaResult = useMemo(() => {
    return calculateAnova(factors, runs);
  }, [factors, runs]);

  // Reset Data to Default L9
  const handleResetData = () => {
    setCurrentArray(defaultArray);
    setFactors(initialFactors);
    setTitle("高纯度精细化工合成正交优化实验");
    setTargetMetricName("合成产率 (%)");
    setGoal("maximize");

    const newRuns: ExperimentRun[] = defaultArray.matrix.map((row, idx) => ({
      runIndex: idx + 1,
      factorLevels: {
        A: row[0],
        B: row[1],
        C: row[2],
        D: row[3]
      },
      value: initialRunsData[idx] ?? 85.0
    }));
    setRuns(newRuns);
    setAiReport(null);
  };

  // Load Classic Engineering Case
  const handleLoadCase = (caseItem: ClassicCase) => {
    setTitle(caseItem.title);
    setTargetMetricName(caseItem.targetMetric);
    setGoal(caseItem.targetGoal);
    setFactors(caseItem.factors);

    const foundArray =
      STANDARD_ORTHOGONAL_ARRAYS.find((a) => a.id === caseItem.arrayId) || defaultArray;
    setCurrentArray(foundArray);

    const loadedRuns: ExperimentRun[] = foundArray.matrix.map((row, idx) => {
      const fLevels: Record<string, number> = {};
      caseItem.factors.forEach((f, fIdx) => {
        fLevels[f.code] = row[fIdx] || 1;
      });
      return {
        runIndex: idx + 1,
        factorLevels: fLevels,
        value: caseItem.runsData[idx] ?? 80.0
      };
    });

    setRuns(loadedRuns);
    setAiReport(null);
    setActiveModule("sandbox");
  };

  // Select standard orthogonal table from Module 1
  const handleSelectArrayFromGuide = (arrayId: string) => {
    const found = STANDARD_ORTHOGONAL_ARRAYS.find((a) => a.id === arrayId);
    if (!found) return;

    setCurrentArray(found);
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

    const newRuns: ExperimentRun[] = found.matrix.map((row, idx) => {
      const fLevels: Record<string, number> = {};
      newFactors.forEach((f, fIdx) => {
        fLevels[f.code] = row[fIdx] || 1;
      });
      return {
        runIndex: idx + 1,
        factorLevels: fLevels,
        value: Number((80 + Math.sin(idx + 1) * 8 + idx * 1.2).toFixed(1))
      };
    });
    setRuns(newRuns);
    setAiReport(null);
    setActiveModule("sandbox");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Header */}
      <Header
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        title={title}
        onResetData={handleResetData}
        selectedArrayName={currentArray.name}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeModule === "guide" && (
          <Module1ConceptualGuide onSelectArray={handleSelectArrayFromGuide} />
        )}

        {activeModule === "sandbox" && (
          <Module2OrthogonalSandbox
            currentArray={currentArray}
            setCurrentArray={setCurrentArray}
            factors={factors}
            setFactors={setFactors}
            runs={runs}
            setRuns={setRuns}
            targetMetricName={targetMetricName}
            setTargetMetricName={setTargetMetricName}
            goal={goal}
            setGoal={setGoal}
            rangeResult={rangeResult}
            onNavigateToAnova={() => setActiveModule("anova")}
          />
        )}

        {activeModule === "anova" && (
          <Module3AnovaDerivation
            anovaResult={anovaResult}
            factors={factors}
            runs={runs}
            targetMetricName={targetMetricName}
          />
        )}

        {activeModule === "cases" && (
          <Module4ClassicCases onLoadCase={handleLoadCase} />
        )}

        {activeModule === "interaction" && (
          <Module5InteractionResiduals
            factors={factors}
            runs={runs}
            rangeResult={rangeResult}
          />
        )}

        {activeModule === "python" && (
          <Module6PythonCode
            factors={factors}
            runs={runs}
            targetMetricName={targetMetricName}
            anovaResult={anovaResult}
          />
        )}

        {activeModule === "ai" && (
          <Module7AiEngine
            title={title}
            factors={factors}
            runs={runs}
            rangeResult={rangeResult}
            anovaResult={anovaResult}
            targetMetricName={targetMetricName}
            goal={goal}
            aiReport={aiReport}
            setAiReport={setAiReport}
          />
        )}

        {activeModule === "report" && (
          <Module8ReportExport
            title={title}
            selectedArrayName={currentArray.name}
            targetMetricName={targetMetricName}
            goal={goal}
            factors={factors}
            runs={runs}
            rangeResult={rangeResult}
            anovaResult={anovaResult}
            aiReport={aiReport}
          />
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
        <div className="flex gap-4">
          <span>数据引擎: R-Engine 4.0</span>
          <span>计算精度: float64</span>
        </div>
        <div className="flex gap-4">
          <span>正交与方差分析智能实验室</span>
          <span>2026 Pro Edition</span>
        </div>
      </footer>
    </div>
  );
}
