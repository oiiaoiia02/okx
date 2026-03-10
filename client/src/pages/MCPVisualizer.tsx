import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Terminal, Copy, Check, Play, ArrowRight, ChevronRight, Send } from "lucide-react";

const EXAMPLE_FLOWS = [
  {
    nameEn: "Query ETH Price",
    nameZh: "查询ETH价格",
    input: "What's the current ETH price?",
    inputZh: "ETH现在什么价格？",
    steps: [
      { tool: "market_ticker", params: { instId: "ETH-USDT" }, result: { last: "3487.20", vol24h: "9.3B", change: "+1.82%" } },
    ],
  },
  {
    nameEn: "Long BTC with TP/SL",
    nameZh: "做多BTC带止盈止损",
    input: "Long BTC-USDT-SWAP 0.1 at market, TP at 92000, SL at 84000",
    inputZh: "做多BTC合约0.1张，止盈92000，止损84000",
    steps: [
      { tool: "swap_place_order", params: { instId: "BTC-USDT-SWAP", side: "buy", sz: "0.1", ordType: "market" }, result: { ordId: "5678901234", avgPx: "87432.50", state: "filled" } },
      { tool: "swap_tp_sl", params: { instId: "BTC-USDT-SWAP", tpTriggerPx: "92000", slTriggerPx: "84000" }, result: { algoId: "9876543210", state: "live" } },
    ],
  },
  {
    nameEn: "Portfolio Health Check",
    nameZh: "投资组合健康检查",
    input: "Show my P&L for the past week and total fees paid",
    inputZh: "查看过去一周的盈亏和总手续费",
    steps: [
      { tool: "account_balance", params: {}, result: { totalEq: "52340.82", availBal: "8240.32" } },
      { tool: "swap_get_positions", params: { instType: "SWAP" }, result: { positions: [{ instId: "BTC-USDT-SWAP", upl: "+128.50" }] } },
      { tool: "account_bills", params: { type: "1", begin: "7d" }, result: { totalFee: "-42.18", pnl: "+1234.56" } },
    ],
  },
  {
    nameEn: "Create Grid Bot",
    nameZh: "创建网格机器人",
    input: "Set up an ETH-USDT grid between $3,200 and $3,800 with 10 grids",
    inputZh: "设置ETH-USDT网格，区间3200-3800，10个格子",
    steps: [
      { tool: "market_ticker", params: { instId: "ETH-USDT" }, result: { last: "3487.20" } },
      { tool: "bot_grid_create", params: { instId: "ETH-USDT", gridNum: "10", minPx: "3200", maxPx: "3800" }, result: { algoId: "grid_001", state: "running" } },
    ],
  },
];

export default function MCPVisualizer() {
  const { t } = useLanguage();
  const [activeFlow, setActiveFlow] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const flow = EXAMPLE_FLOWS[activeFlow];

  const copyJSON = (obj: any, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
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
            {t("Visualize the MCP tool call flow. Copy JSON payload or CLI command for Claude/OpenClaw.", "可视化MCP工具调用流程。复制JSON载荷或CLI命令到Claude/OpenClaw。")}
          </p>
        </motion.div>

        {/* Flow Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {EXAMPLE_FLOWS.map((f, i) => (
            <button
              key={i}
              onClick={() => setActiveFlow(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeFlow === i
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent/50"
              }`}
            >
              {t(f.nameEn, f.nameZh)}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Send className="w-3.5 h-3.5" />
            {t("User Input", "用户输入")}
          </div>
          <div className="text-lg font-medium">{t(flow.input, flow.inputZh)}</div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {flow.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="glass-card overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                    Step {i + 1}
                  </span>
                  <span className="font-mono text-sm text-foreground">{step.tool}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyJSON({ tool: step.tool, params: step.params }, i)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    {copiedIdx === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    JSON
                  </button>
                  <button
                    onClick={() => {
                      const parts = step.tool.split("_");
                      const cmd = `okx ${parts[0]} ${parts.slice(1).join("-")} ${Object.entries(step.params).map(([k, v]) => `--${k} ${v}`).join(" ")}`;
                      navigator.clipboard.writeText(cmd);
                      setCopiedIdx(i + 100);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    {copiedIdx === i + 100 ? <Check className="w-3 h-3 text-green-400" /> : <Terminal className="w-3 h-3" />}
                    CLI
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">{t("Parameters", "参数")}</p>
                  <pre className="text-xs font-mono text-foreground/80">{JSON.stringify(step.params, null, 2)}</pre>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">{t("Result", "结果")}</p>
                  <pre className="text-xs font-mono text-green-400">{JSON.stringify(step.result, null, 2)}</pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Arrow between steps */}
        {flow.steps.length > 1 && (
          <div className="flex justify-center my-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              {t("Sequential execution", "顺序执行")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
