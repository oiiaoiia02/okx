import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Terminal, Copy, Check, Play, ArrowRight, ChevronRight, Send, Activity, Loader2 } from "lucide-react";
import { getTicker, getOrderbook, getCandles, getFundingRate } from "@/services/okxApi";

interface FlowStep {
  tool: string;
  params: Record<string, string>;
  result: any;
  liveResult?: any;
}

interface Flow {
  nameEn: string;
  nameZh: string;
  input: string;
  inputZh: string;
  steps: FlowStep[];
}

const EXAMPLE_FLOWS: Flow[] = [
  {
    nameEn: "Query ETH Price", nameZh: "查询ETH价格",
    input: "What's the current ETH price?", inputZh: "ETH现在什么价格？",
    steps: [
      { tool: "market_ticker", params: { instId: "ETH-USDT" }, result: { note: "Click Execute to fetch real data from OKX API" } },
    ],
  },
  {
    nameEn: "Long BTC with TP/SL", nameZh: "做多BTC带止盈止损",
    input: "Long BTC-USDT-SWAP 0.1 at market, TP at 92000, SL at 84000", inputZh: "做多BTC合约0.1张，止盈92000，止损84000",
    steps: [
      { tool: "market_ticker", params: { instId: "BTC-USDT" }, result: { note: "Step 1: Get current price" } },
      { tool: "swap_place_order", params: { instId: "BTC-USDT-SWAP", side: "buy", sz: "0.1", ordType: "market" }, result: { note: "Requires MCP Server" } },
      { tool: "swap_tp_sl", params: { instId: "BTC-USDT-SWAP", tpTriggerPx: "92000", slTriggerPx: "84000" }, result: { note: "Requires MCP Server" } },
    ],
  },
  {
    nameEn: "ETH Orderbook Analysis", nameZh: "ETH订单簿分析",
    input: "Show me the ETH-USDT orderbook depth", inputZh: "查看ETH-USDT订单簿深度",
    steps: [
      { tool: "market_orderbook", params: { instId: "ETH-USDT", sz: "10" }, result: { note: "Click Execute to fetch real orderbook" } },
    ],
  },
  {
    nameEn: "BTC K-Line + Funding Rate", nameZh: "BTC K线 + 资金费率",
    input: "Get BTC 1H candles and current funding rate", inputZh: "获取BTC 1小时K线和当前资金费率",
    steps: [
      { tool: "market_candles", params: { instId: "BTC-USDT", bar: "1H", limit: "12" }, result: { note: "Click Execute for real K-line data" } },
      { tool: "market_funding_rate", params: { instId: "BTC-USDT-SWAP" }, result: { note: "Click Execute for real funding rate" } },
    ],
  },
  {
    nameEn: "Create Grid Bot", nameZh: "创建网格机器人",
    input: "Set up an ETH-USDT grid between $3,200 and $3,800 with 10 grids", inputZh: "设置ETH-USDT网格，区间3200-3800，10个格子",
    steps: [
      { tool: "market_ticker", params: { instId: "ETH-USDT" }, result: { note: "Step 1: Check current price" } },
      { tool: "bot_grid_create", params: { instId: "ETH-USDT", gridNum: "10", minPx: "3200", maxPx: "3800" }, result: { note: "Requires MCP Server" } },
    ],
  },
];

const LIVE_API_MAP: Record<string, (p: Record<string, string>) => Promise<any>> = {
  market_ticker: async (p) => {
    const t = await getTicker(p.instId || "BTC-USDT");
    return { instId: t.instId, last: t.last, open24h: t.open24h, high24h: t.high24h, low24h: t.low24h, vol24h: t.vol24h, change: `${((parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100).toFixed(2)}%` };
  },
  market_orderbook: async (p) => {
    const book = await getOrderbook(p.instId || "ETH-USDT", p.sz || "10");
    return { asks: book.asks.slice(0, 5).map((a) => ({ price: a[0], size: a[1] })), bids: book.bids.slice(0, 5).map((b) => ({ price: b[0], size: b[1] })), ts: book.ts };
  },
  market_candles: async (p) => {
    const candles = await getCandles(p.instId || "BTC-USDT", p.bar || "1H", p.limit || "12");
    return candles.slice(0, 6).map((c) => ({ time: new Date(parseInt(c.ts)).toLocaleTimeString(), open: c.o, high: c.h, low: c.l, close: c.c, vol: c.vol }));
  },
  market_funding_rate: async (p) => {
    const rate = await getFundingRate(p.instId || "BTC-USDT-SWAP");
    return { instId: rate.instId, fundingRate: rate.fundingRate, nextFundingRate: rate.nextFundingRate, nextFundingTime: new Date(parseInt(rate.nextFundingTime)).toLocaleString() };
  },
};

export default function MCPVisualizer() {
  const { t } = useLanguage();
  const [activeFlow, setActiveFlow] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [liveResults, setLiveResults] = useState<Record<string, any>>({});
  const [executing, setExecuting] = useState<Record<string, boolean>>({});

  const flow = EXAMPLE_FLOWS[activeFlow];

  const copyJSON = (obj: any, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const executeStep = async (stepIdx: number) => {
    const step = flow.steps[stepIdx];
    const key = `${activeFlow}-${stepIdx}`;
    const handler = LIVE_API_MAP[step.tool];
    if (!handler) {
      setLiveResults((prev) => ({ ...prev, [key]: { status: "requires_mcp_server", note: "This tool requires a local MCP Server connection (ws://localhost:8765). Use the Copilot page or connect your MCP server." } }));
      return;
    }
    setExecuting((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await handler(step.params);
      setLiveResults((prev) => ({ ...prev, [key]: result }));
    } catch (err: any) {
      setLiveResults((prev) => ({ ...prev, [key]: { error: err.message } }));
    }
    setExecuting((prev) => ({ ...prev, [key]: false }));
  };

  const executeAll = async () => {
    for (let i = 0; i < flow.steps.length; i++) {
      await executeStep(i);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Terminal className="w-4 h-4" />
            <span>{t("Core Integration", "核心集成")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">MCP Visualizer</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("MCP Tool Call Visualizer", "MCP 工具调用可视化")}</h1>
          <p className="text-muted-foreground">
            {t("Visualize MCP tool call flows. Market tools execute against real OKX API.", "可视化MCP工具调用流程。行情工具直接调用OKX真实API。")}
          </p>
        </motion.div>

        {/* Flow Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {EXAMPLE_FLOWS.map((f, i) => (
            <button key={i} onClick={() => { setActiveFlow(i); setLiveResults({}); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeFlow === i ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent/50"}`}>
              {t(f.nameEn, f.nameZh)}
            </button>
          ))}
        </div>

        {/* Input + Execute All */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Send className="w-3.5 h-3.5" />
              {t("User Input", "用户输入")}
            </div>
            <button onClick={executeAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
              <Play className="w-3.5 h-3.5" />
              {t("Execute All Steps", "执行所有步骤")}
            </button>
          </div>
          <div className="text-lg font-medium">{t(flow.input, flow.inputZh)}</div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {flow.steps.map((step, i) => {
            const key = `${activeFlow}-${i}`;
            const isLive = !!LIVE_API_MAP[step.tool];
            const liveResult = liveResults[key];
            const isExec = executing[key];

            return (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                className="glass-card overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">Step {i + 1}</span>
                    <span className="font-mono text-sm text-foreground">{step.tool}</span>
                    {isLive ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                        <Activity className="w-2.5 h-2.5" /> LIVE API
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">MCP Required</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => executeStep(i)} disabled={isExec}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                      {isExec ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {t("Execute", "执行")}
                    </button>
                    <button onClick={() => copyJSON({ tool: step.tool, params: step.params }, i)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                      {copiedIdx === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} JSON
                    </button>
                    <button onClick={() => {
                      const parts = step.tool.split("_");
                      const cmd = `okx-agent ${parts[0]} ${parts.slice(1).join("-")} ${Object.entries(step.params).map(([k, v]) => `--${k} ${v}`).join(" ")} --demo`;
                      navigator.clipboard.writeText(cmd);
                      setCopiedIdx(i + 100);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                      {copiedIdx === i + 100 ? <Check className="w-3 h-3 text-green-400" /> : <Terminal className="w-3 h-3" />} CLI
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">{t("Parameters", "参数")}</p>
                    <pre className="text-xs font-mono text-foreground/80">{JSON.stringify(step.params, null, 2)}</pre>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">{t("Result", "结果")}</p>
                      {liveResult && isLive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5" /> Real OKX Data
                        </span>
                      )}
                    </div>
                    <pre className={`text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto ${liveResult ? "text-green-400" : "text-foreground/50"}`}>
                      {JSON.stringify(liveResult || step.result, null, 2)}
                    </pre>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {flow.steps.length > 1 && (
          <div className="flex justify-center my-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              {t("Sequential execution — each step feeds into the next", "顺序执行 — 每步结果传递给下一步")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
