import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, ChevronRight, Copy, Check, Wand2, Settings } from "lucide-react";

const TEMPLATES = [
  {
    id: "market_query",
    nameEn: "Market Query",
    nameZh: "行情查询",
    descEn: "Query real-time market data for any trading pair",
    descZh: "查询任何交易对的实时行情数据",
    template: (pair: string) => `You are an OKX trading agent with access to the OKX Agent Trade Kit MCP server.

Task: Get the current market data for ${pair || "BTC-USDT"}.

Instructions:
1. Use the market_ticker tool to fetch the latest price
2. Use the market_orderbook tool to get the top 5 bid/ask levels
3. Use the market_funding_rate tool if it's a perpetual swap
4. Summarize the data in a clear, concise format

Output format:
- Current Price: $XX,XXX.XX
- 24h Change: +X.XX%
- 24h Volume: $X.XB
- Top Bid: $XX,XXX.XX (size)
- Top Ask: $XX,XXX.XX (size)
- Funding Rate: X.XXXX% (if applicable)

Important: Use --demo mode. Never execute real trades.`,
  },
  {
    id: "trade_execution",
    nameEn: "Trade Execution",
    nameZh: "交易执行",
    descEn: "Execute a trade with risk checks",
    descZh: "执行带风险检查的交易",
    template: (pair: string) => `You are an OKX trading agent with access to the OKX Agent Trade Kit MCP server.

Task: Execute a market buy order for ${pair || "BTC-USDT"}.

Pre-trade checks:
1. Use market_ticker to get current price
2. Use account_balance to verify sufficient funds
3. Use market_funding_rate to check market sentiment
4. Assess if conditions are favorable

If conditions are favorable:
5. Use spot_place_order to execute the buy
6. Use spot_order_details to confirm execution
7. Report the fill price and total cost

Risk controls:
- Maximum slippage: 0.5%
- Abort if 24h change exceeds ±10%
- Abort if funding rate is extreme (>0.1%)

Important: Use --demo mode. This is a simulation only.`,
  },
  {
    id: "grid_bot",
    nameEn: "Grid Bot Setup",
    nameZh: "网格机器人设置",
    descEn: "Create and configure a grid trading bot",
    descZh: "创建和配置网格交易机器人",
    template: (pair: string) => `You are an OKX trading agent with access to the OKX Agent Trade Kit MCP server.

Task: Set up a grid trading bot for ${pair || "ETH-USDT"}.

Steps:
1. Use market_ticker to get current price
2. Use market_candles with 1D bar to analyze 30-day price range
3. Calculate optimal grid parameters:
   - Grid range: ±15% from current price
   - Grid count: 10-20 based on volatility
   - Investment: $1,000 USDT
4. Use bot_grid_create to set up the grid
5. Use bot_grid_orders to verify grid orders are placed
6. Report the configuration summary

Output:
- Trading Pair: ${pair || "ETH-USDT"}
- Price Range: $X,XXX - $X,XXX
- Grid Count: XX
- Grid Spacing: $XX.XX
- Investment: $1,000
- Expected APY: XX-XX%

Important: Use --demo mode. Simulation only.`,
  },
  {
    id: "portfolio_review",
    nameEn: "Portfolio Review",
    nameZh: "投资组合审查",
    descEn: "Comprehensive portfolio analysis with risk assessment",
    descZh: "全面的投资组合分析和风险评估",
    template: (_pair: string) => `You are an OKX trading agent with access to the OKX Agent Trade Kit MCP server.

Task: Perform a comprehensive portfolio review.

Steps:
1. Use account_balance to get all asset balances
2. Use account_positions to get all open positions
3. Use account_bills with type "1" to get recent P&L
4. Use account_fee_rates to check current fee tier

Analysis:
5. Calculate total portfolio value
6. Identify concentration risk (any asset >40% of portfolio)
7. Check leverage ratios for all positions
8. Calculate unrealized P&L for each position
9. Assess liquidation distances

Risk Report:
- Portfolio Value: $XX,XXX.XX
- Total P&L (7d): +$X,XXX.XX
- Win Rate: XX%
- Max Position Size: XX% (asset)
- Average Leverage: X.Xx
- Nearest Liquidation: XX% away
- Risk Score: XX/100

Recommendations:
- List 3 actionable suggestions to improve risk profile

Important: Use --demo mode with read-only access.`,
  },
];

export default function ClawPrompt() {
  const { t } = useLanguage();
  const [activeTemplate, setActiveTemplate] = useState("market_query");
  const [pair, setPair] = useState("BTC-USDT");
  const [copied, setCopied] = useState(false);

  const template = TEMPLATES.find((tp) => tp.id === activeTemplate)!;
  const generatedPrompt = template.template(pair);

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="w-4 h-4" />
            <span>{t("Advanced", "高级")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Claw Prompt Generator", "Claw Prompt 生成器")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Claw-Ready Prompt Generator", "Claw-Ready Prompt 生成器")}</h1>
          <p className="text-muted-foreground">{t("Generate complete prompts ready to paste into Claude, OpenClaw, or any MCP-compatible agent.", "生成完整的Prompt，可直接粘贴到Claude、OpenClaw或任何MCP兼容Agent。")}</p>
        </motion.div>

        {/* Template Selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {TEMPLATES.map((tp) => (
            <button
              key={tp.id}
              onClick={() => setActiveTemplate(tp.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                activeTemplate === tp.id ? "glass-card border-primary/20" : "border border-border/30 hover:border-border/60 hover:bg-accent/30"
              }`}
            >
              <Wand2 className="w-4 h-4 text-primary mb-2" />
              <h3 className="text-sm font-medium mb-1">{t(tp.nameEn, tp.nameZh)}</h3>
              <p className="text-[10px] text-muted-foreground line-clamp-2">{t(tp.descEn, tp.descZh)}</p>
            </button>
          ))}
        </div>

        {/* Config */}
        <div className="glass-card p-4 mb-6 flex items-center gap-4">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">{t("Trading Pair", "交易对")}</label>
            <input
              type="text"
              value={pair}
              onChange={(e) => setPair(e.target.value.toUpperCase())}
              className="w-full px-3 py-1.5 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>
        </div>

        {/* Generated Prompt */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground">{t("Generated Prompt", "生成的Prompt")}</span>
            <button onClick={copyPrompt} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t("Copied!", "已复制!") : t("Copy Prompt", "复制Prompt")}
            </button>
          </div>
          <pre className="p-6 text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">{generatedPrompt}</pre>
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          {t("Paste this prompt into Claude, OpenClaw, or any MCP-compatible agent to execute.", "将此Prompt粘贴到Claude、OpenClaw或任何MCP兼容Agent中执行。")}
        </div>
      </div>
    </div>
  );
}
