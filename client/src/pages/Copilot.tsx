import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { OKX_TOOLS, type OKXTool } from "@/data/okxTools";
import { getTicker, formatPrice, formatVolume } from "@/services/okxApi";
import {
  executeMCPTool, getMCPLogs, onMCPLogsChange,
  getConnectionStatus, onConnectionStatusChange, connectMCPServer,
  pollTXStatus, type MCPLogEntry, type MCPResponse, type TXStatus,
  type ConnectionStatus,
} from "@/services/mcpService";
import {
  Send, Mic, MicOff, Bot, User, Zap, Terminal, Copy, Check,
  ChevronRight, ExternalLink, AlertTriangle, Loader2, CheckCircle2,
  XCircle, Clock, ArrowRight, Shield, Activity, Sparkles,
} from "lucide-react";

// ─── Intent Engine ───────────────────────────────────────────────────────────

interface ParsedIntent {
  tool: string;
  params: Record<string, string>;
  confidence: number;
  description: string;
}

function parseIntent(query: string): ParsedIntent | null {
  const q = query.toLowerCase();

  // Price check
  const priceMatch = q.match(/(price|价格|行情|ticker|查|check|get|看)\s*(of\s+|了?\s*)?(\w{2,10})/i);
  if (priceMatch || q.includes("btc") && (q.includes("price") || q.includes("价格") || q.includes("查"))) {
    const symbol = priceMatch?.[3]?.toUpperCase() || (q.includes("eth") ? "ETH" : q.includes("sol") ? "SOL" : "BTC");
    return {
      tool: "market_ticker",
      params: { instId: `${symbol}-USDT` },
      confidence: 0.95,
      description: `Get ${symbol}-USDT real-time ticker from OKX V5 API`,
    };
  }

  // Buy/sell
  const tradeMatch = q.match(/(buy|sell|买|卖|购买|出售)\s*([\d.]+)?\s*(\w{2,10})/i);
  if (tradeMatch) {
    const side = (tradeMatch[1].match(/buy|买|购/) ? "buy" : "sell");
    const sz = tradeMatch[2] || "0.01";
    const symbol = tradeMatch[3]?.toUpperCase() || "BTC";
    const isSwap = q.includes("swap") || q.includes("合约") || q.includes("futures") || q.includes("long") || q.includes("short") || q.includes("做多") || q.includes("做空");
    return {
      tool: isSwap ? "swap_place_order" : "spot_place_order",
      params: { instId: `${symbol}-USDT`, side, sz, ordType: "market" },
      confidence: 0.9,
      description: `${side === "buy" ? "Buy" : "Sell"} ${sz} ${symbol} at market price`,
    };
  }

  // Balance
  if (q.includes("balance") || q.includes("余额") || q.includes("资金") || q.includes("account") || q.includes("账户")) {
    return {
      tool: "account_balance",
      params: {},
      confidence: 0.9,
      description: "Get account balance",
    };
  }

  // Positions
  if (q.includes("position") || q.includes("持仓") || q.includes("仓位") || q.includes("portfolio")) {
    return {
      tool: "account_positions",
      params: {},
      confidence: 0.85,
      description: "Get all positions",
    };
  }

  // Grid bot
  const gridMatch = q.match(/(grid|网格)\s*(?:bot|机器人)?\s*(\w{2,10})?\s*([\d.]+)?\s*[-–]?\s*([\d.]+)?/i);
  if (gridMatch) {
    const symbol = gridMatch[2]?.toUpperCase() || "ETH";
    return {
      tool: "bot_grid_create",
      params: {
        instId: `${symbol}-USDT`,
        gridNum: "20",
        minPx: gridMatch[3] || "3000",
        maxPx: gridMatch[4] || "4000",
      },
      confidence: 0.85,
      description: `Create ${symbol} grid bot`,
    };
  }

  // Funding rate
  if (q.includes("funding") || q.includes("资金费率") || q.includes("费率")) {
    const symbol = q.includes("eth") ? "ETH" : q.includes("sol") ? "SOL" : "BTC";
    return {
      tool: "market_funding_rate",
      params: { instId: `${symbol}-USDT-SWAP` },
      confidence: 0.85,
      description: `Get ${symbol} funding rate`,
    };
  }

  return null;
}

// ─── Reasoning Chain Steps ───────────────────────────────────────────────────

interface ReasoningStep {
  id: string;
  title: string;
  titleZh: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
  timestamp?: number;
}

function generateReasoningSteps(intent: ParsedIntent): ReasoningStep[] {
  return [
    { id: "parse", title: "Intent Parsing", titleZh: "意图解析", status: "pending", detail: intent.description },
    { id: "tool", title: "Tool Selection", titleZh: "工具选择", status: "pending", detail: `Selected: ${intent.tool} (confidence: ${(intent.confidence * 100).toFixed(0)}%)` },
    { id: "params", title: "Parameter Fill", titleZh: "参数填充", status: "pending", detail: JSON.stringify(intent.params) },
    { id: "mcp", title: "MCP Payload Generation", titleZh: "MCP载荷生成", status: "pending" },
    { id: "exec", title: "Execution", titleZh: "执行", status: "pending" },
  ];
}

// ─── Message Types ───────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  reasoning?: ReasoningStep[];
  mcpResult?: MCPResponse;
  txStatus?: TXStatus;
}

// ─── Copilot Page ────────────────────────────────────────────────────────────

export default function Copilot() {
  const { t } = useLanguage();
  const searchParams = useSearch();
  const initialQuery = new URLSearchParams(searchParams).get("q") || "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<"demo" | "live">("demo");
  const [showMCPLog, setShowMCPLog] = useState(false);
  const [mcpLogs, setMcpLogs] = useState<MCPLogEntry[]>(getMCPLogs());
  const [connStatus, setConnStatus] = useState<ConnectionStatus>(getConnectionStatus());
  const [listening, setListening] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Subscribe to MCP logs and connection status
  useEffect(() => {
    const unsub1 = onMCPLogsChange(setMcpLogs);
    const unsub2 = onConnectionStatusChange(setConnStatus);
    return () => { unsub1(); unsub2(); };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Process initial query from URL
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
      // Auto-submit after mount
      setTimeout(() => handleSubmit(initialQuery), 500);
    }
  }, []);

  // Voice input
  const toggleVoice = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  // Copy helper
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // ─── Core: Process user message ────────────────────────────────────────────

  const handleSubmit = async (overrideInput?: string) => {
    const query = overrideInput || input;
    if (!query.trim() || isProcessing) return;
    setInput("");
    setIsProcessing(true);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Parse intent
    const intent = parseIntent(query);

    if (!intent) {
      // No intent matched — show helpful message
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: t(
          `I couldn't match a specific OKX tool for "${query}". Try commands like:\n• "Check BTC price"\n• "Buy 0.01 ETH"\n• "Create grid bot ETH 3000-4000"\n• "Show my balance"`,
          `无法匹配 "${query}" 对应的OKX工具。试试：\n• "查询BTC价格"\n• "买入0.01 ETH"\n• "创建ETH网格机器人 3000-4000"\n• "查看余额"`
        ),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
      return;
    }

    // Generate reasoning steps
    const steps = generateReasoningSteps(intent);
    const assistantId = `asst-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      reasoning: steps,
    };
    setMessages((prev) => [...prev, assistantMsg]);

    // Animate reasoning steps
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          const newSteps = [...m.reasoning!];
          if (i > 0) newSteps[i - 1].status = "done";
          newSteps[i].status = "active";
          newSteps[i].timestamp = Date.now();
          if (i === 3) {
            // MCP payload step
            newSteps[i].detail = JSON.stringify({ tool: intent.tool, params: intent.params }, null, 2);
          }
          return { ...m, reasoning: newSteps };
        })
      );
    }

    // Execute
    try {
      const result = await executeMCPTool({
        tool: intent.tool,
        params: intent.params,
        mode,
      });

      // Update last step and add result
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          const newSteps = [...m.reasoning!];
          newSteps[newSteps.length - 1].status = result.success ? "done" : "error";
          newSteps[newSteps.length - 1].timestamp = Date.now();
          newSteps[newSteps.length - 1].detail = `${result.executionMs}ms`;

          // Format result content
          let content = "";
          if (result.success && result.data?.data?.[0]) {
            const d = result.data.data[0];
            if (d.last) {
              content = t(
                `**${d.instId}** — $${formatPrice(parseFloat(d.last))} (${d.change24h || ""})\n\nHigh: $${d.high24h} | Low: $${d.low24h}\nVol 24h: ${d.vol24h}\nSource: ${d.source || "OKX V5 API"}`,
                `**${d.instId}** — $${formatPrice(parseFloat(d.last))} (${d.change24h || ""})\n\n最高: $${d.high24h} | 最低: $${d.low24h}\n24h成交量: ${d.vol24h}\n数据来源: ${d.source || "OKX V5 API"}`
              );
            } else if (d.ordId) {
              content = t(
                `**Order Executed** ${d.mode === "SIMULATION" ? "(SIMULATION)" : ""}\n\nOrder ID: \`${d.ordId}\`\nPair: ${d.instId} | Side: ${d.side} | Size: ${d.sz}\nStatus: ${d.state}`,
                `**订单已执行** ${d.mode === "SIMULATION" ? "(模拟)" : ""}\n\n订单ID: \`${d.ordId}\`\n交易对: ${d.instId} | 方向: ${d.side} | 数量: ${d.sz}\n状态: ${d.state}`
              );
            } else if (d.totalEq) {
              const details = d.details?.map((det: any) => `${det.ccy}: ${det.availBal}`).join(" | ") || "";
              content = t(
                `**Account Balance** ${d.mode === "SIMULATION" ? "(SIMULATION)" : ""}\n\nTotal: ${d.totalEq} USDT\n${details}`,
                `**账户余额** ${d.mode === "SIMULATION" ? "(模拟)" : ""}\n\n总计: ${d.totalEq} USDT\n${details}`
              );
            } else if (d.algoId) {
              content = t(
                `**Bot Created** ${d.mode === "SIMULATION" ? "(SIMULATION)" : ""}\n\nBot ID: \`${d.algoId}\`\nType: ${d.algoType} | Pair: ${d.instId}\nStatus: ${d.state}`,
                `**机器人已创建** ${d.mode === "SIMULATION" ? "(模拟)" : ""}\n\nBot ID: \`${d.algoId}\`\n类型: ${d.algoType} | 交易对: ${d.instId}\n状态: ${d.state}`
              );
            } else {
              content = "```json\n" + JSON.stringify(result.data, null, 2) + "\n```";
            }
          } else {
            content = "```json\n" + JSON.stringify(result.data, null, 2) + "\n```";
          }

          return { ...m, content, reasoning: newSteps, mcpResult: result };
        })
      );

      // TX polling if we got a hash
      if (result.txHash) {
        pollTXStatus(result.txHash, "eth", (txStatus) => {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, txStatus } : m)
          );
        });
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== assistantId) return m;
          const newSteps = [...m.reasoning!];
          newSteps[newSteps.length - 1].status = "error";
          return { ...m, content: `Error: ${err.message}`, reasoning: newSteps };
        })
      );
    }

    setIsProcessing(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold">AI Copilot</h1>
              <p className="text-[10px] text-muted-foreground">
                {t("Natural Language → MCP → OKX Execution", "自然语言 → MCP → OKX执行")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                connStatus === "connected" ? "bg-green-400" :
                connStatus === "connecting" ? "bg-yellow-400 animate-pulse" :
                "bg-red-400"
              }`} />
              <span className="text-[10px] text-muted-foreground">
                MCP {connStatus === "connected" ? "Connected" : connStatus === "connecting" ? "Connecting..." : "Local"}
              </span>
            </div>
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-accent/50 border border-border/50">
              <button
                onClick={() => setMode("demo")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  mode === "demo" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Shield className="w-3 h-3 inline mr-1" />
                {t("Simulation", "模拟")}
              </button>
              <button
                onClick={() => setMode("live")}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  mode === "live" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="w-3 h-3 inline mr-1" />
                {t("Live", "实盘")}
              </button>
            </div>
            {/* MCP Log Toggle */}
            <button
              onClick={() => setShowMCPLog(!showMCPLog)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                showMCPLog ? "border-primary/30 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="w-3 h-3 inline mr-1" />
              MCP Log
              {mcpLogs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px]">
                  {mcpLogs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="container max-w-3xl space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <Bot className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">
                    {t("OKX AI Copilot", "OKX AI 助手")}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {t(
                      "Describe your trading intent in natural language. I'll parse it, select the right OKX tool, and execute via MCP.",
                      "用自然语言描述你的交易意图。我会解析、选择正确的OKX工具，并通过MCP执行。"
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      t("Check BTC price", "查询BTC价格"),
                      t("Buy 0.01 ETH", "买入0.01 ETH"),
                      t("Show balance", "查看余额"),
                      t("Create grid bot", "创建网格机器人"),
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); handleSubmit(q); }}
                        className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === "user" ? "order-first" : ""}`}>
                    {msg.role === "user" ? (
                      <div className="px-4 py-3 rounded-2xl rounded-tr-md bg-primary text-primary-foreground text-sm">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Reasoning Chain */}
                        {msg.reasoning && (
                          <div className="glass-card p-4 space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                                {t("Reasoning Chain", "思考链")}
                              </span>
                            </div>
                            {msg.reasoning.map((step, i) => (
                              <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`flex items-start gap-2 py-1.5 ${
                                  step.status === "active" ? "opacity-100" :
                                  step.status === "done" ? "opacity-80" :
                                  step.status === "error" ? "opacity-80" : "opacity-40"
                                }`}
                              >
                                <div className="mt-0.5 flex-shrink-0">
                                  {step.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                                  {step.status === "active" && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                                  {step.status === "error" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                  {step.status === "pending" && <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[11px] font-medium">
                                    {t(step.title, step.titleZh)}
                                  </div>
                                  {step.detail && step.status !== "pending" && (
                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5 break-all">
                                      {step.detail}
                                    </div>
                                  )}
                                </div>
                                {step.timestamp && (
                                  <span className="text-[9px] text-muted-foreground flex-shrink-0">
                                    {new Date(step.timestamp).toLocaleTimeString()}
                                  </span>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Message Content */}
                        {msg.content && (
                          <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-card border border-border/50 text-sm">
                            <div className="whitespace-pre-wrap">
                              {msg.content.split(/(\*\*.*?\*\*|```[\s\S]*?```|`[^`]+`)/g).map((part, i) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
                                  return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
                                }
                                if (part.startsWith("```") && part.endsWith("```")) {
                                  const code = part.slice(part.indexOf("\n") + 1, -3);
                                  return (
                                    <div key={i} className="my-2 relative">
                                      <pre className="p-3 rounded-lg bg-background text-xs font-mono overflow-x-auto">{code}</pre>
                                      <button
                                        onClick={() => copyText(code, `code-${msg.id}-${i}`)}
                                        className="absolute top-2 right-2 p-1 rounded bg-accent/50 text-muted-foreground hover:text-foreground"
                                      >
                                        {copied === `code-${msg.id}-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  );
                                }
                                if (part.startsWith("`") && part.endsWith("`")) {
                                  return <code key={i} className="px-1.5 py-0.5 rounded bg-accent text-xs font-mono">{part.slice(1, -1)}</code>;
                                }
                                return <span key={i}>{part}</span>;
                              })}
                            </div>
                            {msg.mcpResult && (
                              <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span className={msg.mcpResult.mode === "demo" ? "text-primary" : "text-red-400"}>
                                  {msg.mcpResult.mode === "demo" ? "SIMULATION" : "LIVE"}
                                </span>
                                <span>·</span>
                                <span>{msg.mcpResult.executionMs}ms</span>
                                <span>·</span>
                                <span>OKX V5 API</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* TX Status */}
                        {msg.txStatus && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-3"
                          >
                            <div className="flex items-center gap-2">
                              {msg.txStatus.status === "pending" && <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />}
                              {msg.txStatus.status === "confirmed" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                              {msg.txStatus.status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                              <span className="text-[11px] font-medium">
                                TX: {msg.txStatus.hash.slice(0, 16)}...
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                msg.txStatus.status === "confirmed" ? "bg-green-500/10 text-green-400" :
                                msg.txStatus.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                                "bg-red-500/10 text-red-400"
                              }`}>
                                {msg.txStatus.status}
                              </span>
                              {msg.txStatus.blockNumber && (
                                <span className="text-[10px] text-muted-foreground">
                                  Block #{msg.txStatus.blockNumber}
                                </span>
                              )}
                              <a
                                href={msg.txStatus.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5 ml-auto"
                              >
                                OKX Explorer <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-accent border border-border/50 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border/50 px-4 py-4">
            <div className="container max-w-3xl">
              {mode === "live" && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <span className="text-[11px] text-red-400">
                    {t(
                      "LIVE MODE — Real funds at risk. Ensure MCP Server is running locally. Use sub-account recommended.",
                      "实盘模式 — 真实资金风险。确保本地MCP Server运行中。建议使用子账户。"
                    )}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm focus-within:border-primary/40 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                    placeholder={t("Describe your trading intent...", "描述你的交易意图...")}
                    className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={toggleVoice}
                    className={`p-1.5 rounded-lg transition-colors ${
                      listening ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => handleSubmit()}
                  disabled={!input.trim() || isProcessing}
                  className="p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MCP Log Panel */}
        <AnimatePresence>
          {showMCPLog && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-border/50 overflow-hidden flex flex-col"
            >
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">MCP Log</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{mcpLogs.length} entries</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {mcpLogs.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {t("No MCP calls yet", "暂无MCP调用")}
                  </div>
                )}
                {mcpLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-accent/30 border border-border/30 text-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        log.direction === "request" ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                      }`}>
                        {log.direction === "request" ? "REQ" : "RES"}
                      </span>
                      <span className="font-mono text-primary">{log.tool}</span>
                      <span className={`ml-auto w-1.5 h-1.5 rounded-full ${
                        log.status === "success" ? "bg-green-400" :
                        log.status === "error" ? "bg-red-400" :
                        "bg-yellow-400 animate-pulse"
                      }`} />
                    </div>
                    <pre className="text-[10px] text-muted-foreground font-mono overflow-x-auto max-h-24 overflow-y-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                    {log.executionMs && (
                      <div className="mt-1 text-[9px] text-muted-foreground">
                        {log.executionMs}ms · {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
