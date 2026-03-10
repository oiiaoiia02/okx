import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Zap, ChevronRight, Copy, Check, ExternalLink, Terminal, BarChart3, Wallet, Bot } from "lucide-react";

const SKILLS = [
  {
    id: "okx-cex-market",
    nameEn: "Market Data",
    nameZh: "行情数据",
    icon: BarChart3,
    color: "#22c55e",
    descEn: "Real-time tickers, orderbook depth, candlesticks, funding rates, open interest, and index data. No API key required.",
    descZh: "实时行情、订单簿深度、K线、资金费率、持仓量和指数数据。无需API密钥。",
    tags: ["Public", "Real-time", "No Auth"],
    install: "npx skills add okx/agent-skills/okx-cex-market",
    capabilities: [
      { nameEn: "Get real-time ticker", nameZh: "获取实时行情", example: "What's the BTC price?" },
      { nameEn: "Get orderbook depth", nameZh: "获取订单簿深度", example: "Show me ETH orderbook" },
      { nameEn: "Get candlestick data", nameZh: "获取K线数据", example: "Show BTC 1H candles" },
      { nameEn: "Get funding rate", nameZh: "获取资金费率", example: "What's BTC funding rate?" },
      { nameEn: "Get open interest", nameZh: "获取持仓量", example: "Show SWAP open interest" },
      { nameEn: "Get index data", nameZh: "获取指数数据", example: "Get BTC index price" },
    ],
  },
  {
    id: "okx-cex-trade",
    nameEn: "Trading",
    nameZh: "交易",
    icon: Terminal,
    color: "#3b82f6",
    descEn: "Spot, futures, options, and advanced orders. Execute, cancel, amend, or batch orders, including OCO, trailing stops, and grid bots.",
    descZh: "现货、合约、期权和高级订单。执行、撤销、修改或批量操作，包括OCO、追踪止损和网格机器人。",
    tags: ["Spot", "Futures", "Options", "Algo"],
    install: "npx skills add okx/agent-skills/okx-cex-trade",
    capabilities: [
      { nameEn: "Place spot/futures orders", nameZh: "下现货/合约单", example: "Buy 0.1 BTC at market" },
      { nameEn: "Cancel/amend orders", nameZh: "撤销/修改订单", example: "Cancel all BTC orders" },
      { nameEn: "Batch operations", nameZh: "批量操作", example: "Batch place 5 limit orders" },
      { nameEn: "Algo orders (OCO/trailing)", nameZh: "算法单(OCO/追踪)", example: "Set trailing stop at 2%" },
      { nameEn: "Options trading", nameZh: "期权交易", example: "Buy BTC call option" },
    ],
  },
  {
    id: "okx-cex-portfolio",
    nameEn: "Portfolio",
    nameZh: "投资组合",
    icon: Wallet,
    color: "#a855f7",
    descEn: "Track balances, positions, PnL, billing history, fee rates, and transfers. Get full portfolio visibility with a single skill.",
    descZh: "追踪余额、持仓、盈亏、账单历史、费率和划转。一个技能获得完整的投资组合可见性。",
    tags: ["Balance", "Positions", "P&L", "Fees"],
    install: "npx skills add okx/agent-skills/okx-cex-portfolio",
    capabilities: [
      { nameEn: "Get account balance", nameZh: "获取账户余额", example: "Show my balance" },
      { nameEn: "Track positions & PnL", nameZh: "追踪持仓和盈亏", example: "Show my P&L" },
      { nameEn: "Billing history", nameZh: "账单历史", example: "Show fees this week" },
      { nameEn: "Fee rate lookup", nameZh: "费率查询", example: "What's my fee rate?" },
      { nameEn: "Fund transfers", nameZh: "资金划转", example: "Transfer 100 USDT" },
    ],
  },
  {
    id: "okx-cex-bot",
    nameEn: "Bot Management",
    nameZh: "Bot管理",
    icon: Bot,
    color: "#ec4899",
    descEn: "Create and manage grid bots, DCA bots, signal bots, and more. Automate your trading strategies.",
    descZh: "创建和管理网格机器人、DCA机器人、信号机器人等。自动化你的交易策略。",
    tags: ["Grid", "DCA", "Signal", "Automation"],
    install: "npx skills add okx/agent-skills/okx-cex-bot",
    capabilities: [
      { nameEn: "Create grid bot", nameZh: "创建网格机器人", example: "Create ETH grid bot" },
      { nameEn: "DCA automation", nameZh: "DCA自动化", example: "DCA into BTC weekly" },
      { nameEn: "Signal bot", nameZh: "信号机器人", example: "Create signal bot" },
      { nameEn: "Copy trading", nameZh: "跟单交易", example: "Follow top trader" },
      { nameEn: "Bot monitoring", nameZh: "Bot监控", example: "Show my active bots" },
    ],
  },
];

export default function AgentSkills() {
  const { t } = useLanguage();
  const [activeSkill, setActiveSkill] = useState("okx-cex-market");
  const [copiedCmd, setCopiedCmd] = useState(false);

  const skill = SKILLS.find((s) => s.id === activeSkill)!;
  const Icon = skill.icon;

  const copyInstall = () => {
    navigator.clipboard.writeText(skill.install);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Zap className="w-4 h-4" />
            <span>{t("Core Integration", "核心集成")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Agent Skills</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Plug-and-Play Skills", "即插即用技能")}</h1>
          <p className="text-muted-foreground">
            {t("Pick the capabilities you need. Each skill is a self-contained module.", "选择你需要的能力。每个技能都是独立的模块。")}
          </p>
        </motion.div>

        {/* Install all */}
        <div className="glass-card p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-muted-foreground">$</span>
            <span className="text-primary">npx skills add okx/agent-skills</span>
          </div>
          <button onClick={() => { navigator.clipboard.writeText("npx skills add okx/agent-skills"); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Skill Tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SKILLS.map((s) => {
            const SIcon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSkill(s.id)}
                className={`p-4 rounded-xl text-left transition-all ${
                  activeSkill === s.id
                    ? "glass-card border-primary/20 shadow-lg shadow-primary/5"
                    : "border border-border/30 hover:border-border/60 hover:bg-accent/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SIcon className="w-5 h-5" style={{ color: s.color }} />
                  <span className="font-mono text-xs" style={{ color: s.color }}>{s.id}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{t(s.nameEn, s.nameZh)}</h3>
                <div className="flex flex-wrap gap-1">
                  {s.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">#{tag}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Skill Detail */}
        <motion.div key={activeSkill} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${skill.color}15`, border: `1px solid ${skill.color}30` }}>
                <Icon className="w-6 h-6" style={{ color: skill.color }} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{t(skill.nameEn, skill.nameZh)}</h2>
                <p className="text-sm text-muted-foreground">{t(skill.descEn, skill.descZh)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border/50">
              <span className="text-muted-foreground font-mono text-xs">$</span>
              <span className="font-mono text-xs text-primary flex-1">{skill.install}</span>
              <button onClick={copyInstall} className="text-muted-foreground hover:text-foreground transition-colors">
                {copiedCmd ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">{t("Capabilities", "能力列表")}</h3>
            <div className="space-y-3">
              {skill.capabilities.map((cap, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t(cap.nameEn, cap.nameZh)}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">"{cap.example}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="https://github.com/okx/agent-skills"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t("Browse on GitHub", "在GitHub查看")}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
