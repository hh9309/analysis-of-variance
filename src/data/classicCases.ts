import { ClassicCase } from "../types";

export const CLASSIC_CASES: ClassicCase[] = [
  {
    id: "chemical_synthesis",
    title: "化工合成反应产率与纯度参数优化",
    category: "chemical",
    tag: "化工材料",
    description: "考察反应温度、反应压力、催化剂用量及搅拌速率 4 个 3 水平因素对产率 (%) 的影响，寻找极高产率且成本优化的工艺条件。",
    targetMetric: "合成产率 (%)",
    targetGoal: "maximize",
    unit: "%",
    arrayId: "L9_3_4",
    factors: [
      { id: "f1", code: "A", name: "反应温度", levels: [120, 140, 160], unit: "°C" },
      { id: "f2", code: "B", name: "反应压力", levels: [1.2, 1.5, 1.8], unit: "MPa" },
      { id: "f3", code: "C", name: "催化剂用量", levels: [0.5, 1.0, 1.5], unit: "wt%" },
      { id: "f4", code: "D", name: "搅拌速率", levels: [300, 500, 700], unit: "rpm" }
    ],
    runsData: [82.5, 88.2, 84.1, 87.6, 93.8, 89.2, 91.0, 96.5, 92.3],
    backgroundContext: "某精细化工企业在生产高分子中间体时，原始产率仅为 83%。为提升产能并节约催化剂成本，设计 L9(3⁴) 正交实验进行系统调优。",
    engineeringTakeaways: [
      "催化剂用量 (C) 与 反应温度 (A) 为显著主导因素。",
      "最佳组合 A3 B2 C2 D2 可将合成产率理论提升至 96.8% 以上。",
      "反应压力与搅拌速率影响相对平缓，可在区间内按能耗最低原则选定。"
    ]
  },
  {
    id: "industrial_cutting",
    title: "钛合金航空零部件切削加工表面粗糙度优化",
    category: "industrial",
    tag: "精密制造",
    description: "研究切削速度、进给量、切削深度及刀具前角对钛合金加工后表面粗糙度 Ra (μm) 的影响，目标是粗糙度最小化。",
    targetMetric: "表面粗糙度 Ra",
    targetGoal: "minimize",
    unit: "μm",
    arrayId: "L9_3_4",
    factors: [
      { id: "f1", code: "A", name: "切削速度", levels: [80, 120, 160], unit: "m/min" },
      { id: "f2", code: "B", name: "进给量", levels: [0.08, 0.12, 0.16], unit: "mm/r" },
      { id: "f3", code: "C", name: "切削深度", levels: [0.5, 1.0, 1.5], unit: "mm" },
      { id: "f4", code: "D", name: "刀具前角", levels: [6, 10, 14], unit: "°" }
    ],
    runsData: [1.85, 2.15, 2.60, 1.42, 1.80, 2.10, 1.15, 1.50, 1.78],
    backgroundContext: "航空钛合金叶片加工要求极高表面光洁度（Ra < 1.2 μm）。传统单因素调试效率低下且容易报废加工件，采用正交实验快速定位防抑振低粗糙度参数。",
    engineeringTakeaways: [
      "进给量 (B) 与 切削速度 (A) 对粗糙度具有极显著影响 (p < 0.01)。",
      "切削速度越高、进给量越小，加工表面越光滑；最佳组合为 A3 B1 C1 D2。",
      "刀具前角在 10° 时切削力平衡效果最佳，能显著改善颤振。"
    ]
  },
  {
    id: "biomedical_formula",
    title: "控释纳米载药系统体外溶出度配方筛选",
    category: "biomedical",
    tag: "生物医药",
    description: "筛选活性成分浓度、高分子载体比例、表面活性剂种类及均质压力对 12 小时累积溶出度 (%) 的影响。",
    targetMetric: "12h 累积溶出度",
    targetGoal: "maximize",
    unit: "%",
    arrayId: "L9_3_4",
    factors: [
      { id: "f1", code: "A", name: "主药载量", levels: [5, 10, 15], unit: "%" },
      { id: "f2", code: "B", name: "PLGA 载体比", levels: [1, 2, 3], unit: "w/w" },
      { id: "f3", code: "C", name: "乳化剂 Tween80", levels: [0.2, 0.5, 0.8], unit: "%" },
      { id: "f4", code: "D", name: "均质压力", levels: [40, 80, 120], unit: "MPa" }
    ],
    runsData: [62.0, 71.5, 78.2, 69.4, 82.0, 88.6, 75.8, 89.1, 94.5],
    backgroundContext: "抗肿瘤纳米控释制剂需要维持持久平缓的药效释放。通过优化载体比例与均质工艺，实现高包封率与 12 小时 > 90% 稳定的体外释放率。",
    engineeringTakeaways: [
      "乳化剂 Tween80 浓度 (C) 与 均质压力 (D) 为关键主导参数。",
      "更高均质压力有效降低了载药纳米粒径，从而极大地促进了均匀溶出。",
      "推荐最佳配方参数：A3 B2 C3 D3。"
    ]
  }
];
