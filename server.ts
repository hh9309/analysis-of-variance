import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API: AI Optimization Engine Endpoint
app.post("/api/ai-insight", async (req, res) => {
  try {
    const { title, factors, designTable, results, rangeAnalysis, anovaResult, goal } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "API key not configured",
        message: "服务端未检测到 GEMINI_API_KEY 环境变量，请在 Secrets 中配置。",
      });
    }

    const prompt = `
你是一位资深实验设计与统计分析专家（DOE & ANOVA Expert）。请根据以下正交实验及方差分析（ANOVA）数据，撰写一份结构化、权威且具备工程落地指导价值的【AI 实验优化洞察报告】。

---
### 1. 实验概况
- **实验主题**: ${title || "正交实验"}
- **优化目标**: ${goal || "指标最大化/最佳组合"}
- **因素与水平表**: 
${JSON.stringify(factors, null, 2)}

---
### 2. 正交表与实验数据
- **实验表格结构与结果**:
${JSON.stringify(designTable, null, 2)}

---
### 3. 极差分析 (Range Analysis)
- **极差 R 排序与均值 k**:
${JSON.stringify(rangeAnalysis, null, 2)}

---
### 4. 方差分析 (ANOVA Results)
- **F 检验与显著性 (p-value)**:
${JSON.stringify(anovaResult, null, 2)}

---
请使用严谨专业的中文（简体），按照以下格式生成 Markdown 格式的报告：

### 🎯 1. 核心结论与显著因子判定
- 明确指出哪些因素对实验结果具有**显著影响**（结合 ANOVA 的 p 值与 F 检验）。
- 排序各因素的影响主次次序（主因素 -> 次因素）。

### 💡 2. 最优工艺/参数组合推荐
- 给出一套明确的最佳水平组合（如 $A_2 B_3 C_1$），并说明各因素选此水平的具体统计依据（如 $k$ 值高低）。
- 预测在此最优参数下的预期指标表现（预期提升幅度或最佳预期值）。

### ⚡ 3. 交互效应与误差风险评估
- 分析主要因素间是否存在明显的交互作用风险。
- 指出实验误差（Residual SS / MSE）水平是否合理，试验控制质量评估。

### 🔬 4. 下一步工程优化建议
- 给出 2-3 条切实可行的后续验证与调优方向（例如：针对主因素缩小搜索步长、补做验证实验等）。
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
      },
    });

    const analysis = response.text || "未能生成分析报告，请稍后再试。";
    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({
      error: "Gemini API error",
      message: error?.message || "AI 洞察引擎计算失败",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
