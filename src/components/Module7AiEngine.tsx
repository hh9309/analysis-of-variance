import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Send,
  Download,
  Eye,
  EyeOff,
  Bot,
  User,
  Trash2,
  HelpCircle,
  X,
  Key,
  Cpu,
  Check,
  MessageSquare,
  Sparkle
} from "lucide-react";
import { Factor, ExperimentRun, RangeAnalysisResult, AnovaResult } from "../types";

interface Module7Props {
  title: string;
  factors: Factor[];
  runs: ExperimentRun[];
  rangeResult: RangeAnalysisResult;
  anovaResult: AnovaResult;
  targetMetricName: string;
  goal: "maximize" | "minimize";
  aiReport: string | null;
  setAiReport: (report: string | null) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelName?: string;
}

export const Module7AiEngine: React.FC<Module7Props> = ({
  title,
  factors,
  runs,
  rangeResult,
  anovaResult,
  targetMetricName,
  goal,
  aiReport,
  setAiReport
}) => {
  // Model Settings State (GitHub/Netlify Client-Side Direct Execution)
  const [selectedModel, setSelectedModel] = useState<"gemini-3.6-flash" | "deepseek-v4-pro">("gemini-3.6-flash");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyText, setShowApiKeyText] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsSavedToast, setSettingsSavedToast] = useState<boolean>(false);

  // Loading & Error States
  const [loadingReport, setLoadingReport] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Load API Key and Model from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("doe_ai_api_key") || "";
    const savedModel = localStorage.getItem("doe_ai_model") as any;
    if (savedKey) setApiKey(savedKey);
    if (savedModel === "gemini-3.6-flash" || savedModel === "deepseek-v4-pro") {
      setSelectedModel(savedModel);
    }

    // Default welcome message in chat
    setChatMessages([
      {
        id: "welcome-1",
        role: "assistant",
        content: `👋 您好！我是您的 DOE 正交实验与方差分析智能助手。\n当前配置模型：**${
          savedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"
        }**。\n\n关于本次实验的因素极差、p 值显著性判定、交互作用或验证 SOP，欢迎向我提问！`,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        modelName: savedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"
      }
    ]);
  }, []);

  // Save Settings handler
  const handleSaveSettings = () => {
    localStorage.setItem("doe_ai_api_key", apiKey.trim());
    localStorage.setItem("doe_ai_model", selectedModel);
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2000);
    setShowSettingsModal(false);
    setErrorMsg(null);
  };

  // Construct DOE Experiment Context for LLM
  const getExperimentContextPrompt = () => {
    return `
正交实验与方差分析 (DOE & ANOVA) 数据背景：
- 实验名称: ${title || "正交实验"}
- 响应指标: ${targetMetricName || "指标"} (${goal === "maximize" ? "目标最大化" : "目标最小化"})
- 因素与水平: ${factors.map((f) => `${f.code}(${f.name}): 水平[${f.levels.join(", ")}]`).join("; ")}
- 极差分析 R 影响主次次序: ${rangeResult.rankedFactorCodes.join(" > ")}
- 推导最优水平组合: ${Object.entries(rangeResult.optimalCombination)
      .map(([k, v]) => `${k}${(v as { level: number }).level}`)
      .join(" ")}
- ANOVA 显著因素 (p < 0.05): ${
      anovaResult.factors
        .filter((f) => f.pVal < 0.05)
        .map((f) => `${f.code}(p=${f.pVal.toFixed(4)})`)
        .join(", ") || "无显著因素"
    }
`;
  };

  // Helper function to invoke LLM client-side or fallback
  const callLLM = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setShowSettingsModal(true);
      throw new Error("请先点击右上角 ⚙️ 大模型设置，输入您的 API-Key！");
    }

    if (selectedModel === "gemini-3.6-flash") {
      // Call Google Gemini REST API directly
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${trimmedKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\n${userPrompt}`
              }
            ]
          }
        ]
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Gemini API 调用失败 (${res.status} ${res.statusText})`
        );
      }

      const data = await res.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!answer) throw new Error("Gemini API 返回结果为空，请检查 Prompt 或 API Key");
      return answer;
    } else {
      // Call DeepSeek API
      const endpoint = "https://api.deepseek.com/chat/completions";
      const payload = {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trimmedKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `DeepSeek API 调用失败 (${res.status} ${res.statusText})`
        );
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content;
      if (!answer) throw new Error("DeepSeek API 返回结果为空");
      return answer;
    }
  };

  // Generate full AI Report
  const handleFetchAiInsight = async () => {
    setLoadingReport(true);
    setErrorMsg(null);

    const systemPrompt = `你是一位资深实验设计与统计分析专家（DOE & ANOVA Expert）。请根据以下正交实验及方差分析数据，撰写一份结构化、权威且具备工程落地指导价值的【AI 实验优化洞察报告】。`;
    const userPrompt = `${getExperimentContextPrompt()}
请使用严谨专业的中文，按以下结构生成 Markdown 报告：
### 🎯 1. 核心结论与显著因子判定
- 指出哪些因素显著 (p < 0.05 / p < 0.01) 并排序主次因素。
### 💡 2. 最优工艺/参数组合推荐
- 推荐最佳参数组合，并给出预测增益幅度。
### ⚡ 3. 交互效应与误差风险评估
- 评估环境残差与噪音控制质量。
### 🔬 4. 产线试产与 SOP 工程建议
- 给出 2-3 条后续验证与产线调优行动指南。
`;

    try {
      const result = await callLLM(systemPrompt, userPrompt);
      setAiReport(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "生成 AI 洞察分析报告失败，请检查 API Key");
    } finally {
      setLoadingReport(false);
    }
  };

  // Send Question in Chat Box
  const handleSendQuery = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || chatLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setChatLoading(true);

    const systemPrompt = `你是一位专业的 DOE 正交实验与方差分析 (ANOVA) 顾问专家。请解答用户关于当前正交实验与统计分析的疑问。解答要专业、精准、具备说服力与工程可实施性。`;
    const userPrompt = `${getExperimentContextPrompt()}\n\n用户提问: ${text}`;

    try {
      const aiResponse = await callLLM(systemPrompt, userPrompt);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        modelName: selectedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorAiMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ **请求失败**: ${err.message || "未能收到大模型响应，请检查 API Key 设置。"}`,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        modelName: selectedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"
      };
      setChatMessages((prev) => [...prev, errorAiMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Slice Header with Gear Icon */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              模块 7 · AI 洞察引擎 (AI Optimization Engine)
            </div>

            {/* Current Model Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
              <Cpu className="w-3 h-3 text-indigo-400" />
              模型: {selectedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"}
            </span>

            {/* Key Config Status Pill */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${
                apiKey.trim()
                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                  : "bg-amber-950/80 text-amber-300 border-amber-500/40"
              }`}
            >
              <Key className="w-3 h-3" />
              {apiKey.trim() ? "API Key: 已配置 ✓" : "API Key: 未配置 ⚠️"}
            </span>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            结合 p 值与极差 R 智能判读显著因素与大模型交互问答
          </h2>
          <p className="text-xs text-indigo-200/80">
            支持 Gemini 3 Flash 与 DeepSeek V4 Pro 双大模型，可纯前端直接调用，适应 GitHub Pages 与 Netlify 部署。
          </p>
        </div>

        {/* Header Control Buttons (Settings Gear & Generate) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition-all flex items-center gap-2 border border-slate-700 hover:border-indigo-400/50 shadow-xs"
            title="点击设置大模型与 API-Key"
          >
            <Settings className="w-4 h-4 text-indigo-400 animate-spin-slow" />
            <span>⚙️ 大模型设置</span>
          </button>

          <button
            onClick={handleFetchAiInsight}
            disabled={loadingReport}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 border border-indigo-400/30 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loadingReport ? "animate-spin" : ""}`} />
            <span>{loadingReport ? "大模型推演中..." : "一键生成 AI 智能优化报告"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors shrink-0 text-[11px]"
          >
            设置 API Key
          </button>
        </div>
      )}

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">极其显著因素判定 (p &lt; 0.01)</span>
          <div className="text-base font-bold text-indigo-600">
            {anovaResult.factors.filter((f) => f.pVal < 0.01).map((f) => f.code).join(", ") || "暂无极显著因子"}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">建议最优参数组合</span>
          <div className="text-base font-bold text-emerald-600">
            {Object.entries(rangeResult.optimalCombination)
              .map(([k, v]) => `${k}${(v as { level: number }).level}`)
              .join(" ")}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">极差 R 主因素次序</span>
          <div className="text-base font-bold text-slate-800">
            {rangeResult.rankedFactorCodes.join(" > ")}
          </div>
        </div>
      </div>

      {/* AI Report Output View */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            AI 实验调优洞察报告 ({selectedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"})
          </h3>
          {aiReport && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200">
              分析完毕 · 已沉淀入“模块 8 报告导出”
            </span>
          )}
        </div>

        {aiReport ? (
          <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4 whitespace-pre-line p-4 bg-slate-50/70 rounded-xl border border-slate-200/60 font-sans text-slate-800">
            {aiReport}
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Sparkles className="w-10 h-10 text-indigo-400 animate-bounce" />
            <div className="space-y-1 max-w-sm">
              <h4 className="font-bold text-slate-800 text-sm">还没有生成 AI 智能报告</h4>
              <p className="text-xs text-slate-500">
                请先点击右上角 ⚙️ 大模型设置输入 API-Key，随后点击“一键生成 AI 智能优化报告”。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Q&A Dialogue Interface */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              大模型在线问答与问题对话框 (LLM Interactive DOE Assistant)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              您可以针对本次实验中的极差排序、p 值异同、验证 SOP 细节或降本工艺路线向大模型提问。
            </p>
          </div>

          <button
            onClick={() =>
              setChatMessages([
                {
                  id: "welcome-reset",
                  role: "assistant",
                  content: `对话记录已重置。我是您的 AI 实验助手，欢迎针对本正交实验随时提问！`,
                  timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
                  modelName: selectedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"
                }
              ])
            }
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空对话
          </button>
        </div>

        {/* Preset Quick Question Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500">快捷问题推荐 (点击立即提问):</span>
          <div className="flex flex-wrap gap-2">
            {[
              "如何解读极差 R 排序与 ANOVA p 值判定不一致的可能原因？",
              "请基于推导的最佳水平组合，导出详细的 3 次验证实验 SOP。",
              "针对非显著因素，如何选择水平以实现降本与提效？",
              "如果未来计划引入 2 个因素的交互作用，应如何安排试验组？"
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(preset)}
                className="px-3 py-1 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 text-xs rounded-lg border border-indigo-200/60 transition-all text-left font-medium"
              >
                💡 {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message History */}
        <div className="bg-slate-900/95 text-slate-100 rounded-xl p-4 border border-slate-800 space-y-4 max-h-[420px] overflow-y-auto font-sans">
          {chatMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-indigo-400 border border-slate-700"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1 ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-xs"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] opacity-70 mb-1 border-b border-white/10 pb-1">
                    <span className="font-semibold">
                      {isUser ? "您" : msg.modelName || "AI 助手"}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-line font-normal">{msg.content}</div>
                </div>
              </div>
            );
          })}

          {chatLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-400 border border-slate-700 flex items-center justify-center text-xs">
                <Bot className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="bg-slate-800/90 text-indigo-300 rounded-2xl rounded-tl-xs px-4 py-3 text-xs border border-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{selectedModel === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "Gemini 3 Flash"} 正在深度推演思考回复中...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Box & Send */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendQuery()}
            placeholder="输入您关于本正交实验的疑问，例如：因素 A 极差最大但 p 值不显著是为什么？"
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none transition-all"
          />
          <button
            onClick={() => handleSendQuery()}
            disabled={chatLoading || !inputQuery.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发送</span>
          </button>
        </div>
      </div>

      {/* Settings Modal (大模型参数配置弹窗) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                  <Settings className="w-5 h-5 animate-spin-slow" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">⚙️ 大模型配置与 API-Key 设置</h3>
                  <p className="text-[11px] text-slate-500">支持 GitHub Pages / Netlify 纯前端浏览器直接调用</p>
                </div>
              </div>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select Model */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                1. 选择 AI 大模型 (Select LLM Model):
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedModel("gemini-3.6-flash")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedModel === "gemini-3.6-flash"
                      ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Gemini 3 Flash</span>
                    {selectedModel === "gemini-3.6-flash" && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Google 高性能高速模型</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedModel("deepseek-v4-pro")}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedModel === "deepseek-v4-pro"
                      ? "bg-indigo-50/80 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">DeepSeek V4 Pro</span>
                    {selectedModel === "deepseek-v4-pro" && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">DeepSeek 深度逻辑推理模型</span>
                </button>
              </div>
            </div>

            {/* Step 2: Manual API Key Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>2. 手工输入 API-Key (Input API Key):</span>
                <span className="text-[10px] text-indigo-600 font-normal">
                  {selectedModel === "gemini-3.6-flash" ? "Google AI Key" : "DeepSeek Key"}
                </span>
              </label>

              <div className="relative">
                <input
                  type={showApiKeyText ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    selectedModel === "gemini-3.6-flash"
                      ? "输入 Gemini API Key (以 AIza 开头)..."
                      : "输入 DeepSeek API Key (以 sk- 开头)..."
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-900 outline-none font-mono transition-all"
                />

                <button
                  type="button"
                  onClick={() => setShowApiKeyText(!showApiKeyText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showApiKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed space-y-1">
                <p className="font-semibold">🔒 浏览器端安全隐私承诺：</p>
                <p className="text-[10px] text-indigo-800/80">
                  针对 GitHub Pages / Netlify 等无服务器环境，输入的 API-Key 仅存储于您本地浏览器的 <code>localStorage</code> 中，调用时直接发起端到端 HTTPS 请求，绝不上传任何中转服务器。
                </p>
              </div>
            </div>

            {/* Step 3: Confirm Button */}
            <div className="pt-2">
              <button
                onClick={handleSaveSettings}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>确认并保存大模型设置</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification when Saved */}
      {settingsSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>大模型配置及 API Key 已就绪！</span>
        </div>
      )}
    </div>
  );
};
