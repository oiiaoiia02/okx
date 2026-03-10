import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, ChevronRight, Grid3X3, Users, BarChart3, Play, ArrowRight, Terminal, Copy, Check } from "lucide-react";

const CASES = [
  {
    id: "grid",
    icon: Grid3X3,
    nameEn: "Grid Trading Bot",
    nameZh: "网格交易机器人",
    descEn: "Automated grid trading strategy that captures range-bound volatility. Set price range, grid count, and let the bot handle the rest.",
    descZh: "自动网格交易策略，捕获区间波动收益。设置价格区间、网格数量，让机器人处理其余工作。",
    color: "#22c55e",
    promptEn: "Create an ETH-USDT grid bot with 10 grids between $3,200 and $3,800. Invest $1,000 total. Use spot grid mode.",
    promptZh: "创建ETH-USDT网格机器人，10格，区间$3,200-$3,800。总投入$1,000。使用现货网格模式。",
    steps: [
      "market_ticker(ETH-USDT) → Check current price",
      "account_balance() → Verify available funds",
      "bot_grid_create(ETH-USDT, 10, 3200, 3800, 1000) → Create grid",
      "bot_grid_orders(grid_001) → Confirm grid orders placed",
    ],
    stepsZh: [
      "market_ticker(ETH-USDT) → 检查当前价格",
      "account_balance() → 验证可用资金",
      "bot_grid_create(ETH-USDT, 10, 3200, 3800, 1000) → 创建网格",
      "bot_grid_orders(grid_001) → 确认网格订单已下达",
    ],
    resultEn: "Grid bot running with 10 orders placed between $3,200-$3,800. Expected APY: ~15-25% in range-bound market.",
    resultZh: "网格机器人运行中，10个订单分布在$3,200-$3,800。预期年化: 区间震荡市场约15-25%。",
  },
  {
    id: "whale",
    icon: Users,
    nameEn: "Whale Copy Trading",
    nameZh: "巨鲸跟单交易",
    color: "#3b82f6",
    descEn: "Monitor whale wallet movements and automatically copy their trades. Follow smart money with configurable position sizing.",
    descZh: "监控巨鲸钱包动向并自动跟单。跟随聪明资金，可配置仓位大小。",
    promptEn: "Monitor top 3 whale wallets for BTC and ETH. When they buy more than $100K, copy at 1% of my portfolio. Set max 5 copies per day.",
    promptZh: "监控前3个巨鲸钱包的BTC和ETH动向。当他们买入超过$100K时，以我投资组合的1%跟单。每天最多5次跟单。",
    steps: [
      "account_balance() → Check portfolio size",
      "whale_monitor_setup(top3, BTC, ETH) → Configure monitoring",
      "whale_signal_subscribe(threshold: 100000) → Set alert threshold",
      "bot_copy_trading(config) → Enable auto-copy",
    ],
    stepsZh: [
      "account_balance() → 检查投资组合大小",
      "whale_monitor_setup(top3, BTC, ETH) → 配置监控",
      "whale_signal_subscribe(threshold: 100000) → 设置警报阈值",
      "bot_copy_trading(config) → 启用自动跟单",
    ],
    resultEn: "Whale monitoring active. Tracking 3 wallets. Auto-copy enabled at 1% portfolio size per signal.",
    resultZh: "巨鲸监控已激活。追踪3个钱包。自动跟单已启用，每个信号使用投资组合的1%。",
  },
  {
    id: "options",
    icon: BarChart3,
    nameEn: "Options Strategy (Iron Condor)",
    nameZh: "期权策略（铁鹰式）",
    color: "#a855f7",
    descEn: "Build a multi-leg options strategy to profit from low volatility. Sell OTM calls and puts while buying further OTM for protection.",
    descZh: "构建多腿期权策略，从低波动率中获利。卖出虚值看涨和看跌期权，同时买入更远虚值期权作为保护。",
    promptEn: "Build an iron condor on BTC options expiring March 29. Sell $80K put and $95K call, buy $75K put and $100K call. 1 contract each.",
    promptZh: "在3月29日到期的BTC期权上构建铁鹰式。卖出$80K看跌和$95K看涨，买入$75K看跌和$100K看涨。每腿1张合约。",
    steps: [
      "market_ticker(BTC-USDT) → Current price: $87,432",
      "option_chain(BTC-USD, 240329) → Get available strikes",
      "option_place_order(BTC-USD-240329-80000-P, sell) → Sell put",
      "option_place_order(BTC-USD-240329-95000-C, sell) → Sell call",
      "option_place_order(BTC-USD-240329-75000-P, buy) → Buy protective put",
      "option_place_order(BTC-USD-240329-100000-C, buy) → Buy protective call",
    ],
    stepsZh: [
      "market_ticker(BTC-USDT) → 当前价格: $87,432",
      "option_chain(BTC-USD, 240329) → 获取可用行权价",
      "option_place_order(BTC-USD-240329-80000-P, sell) → 卖出看跌",
      "option_place_order(BTC-USD-240329-95000-C, sell) → 卖出看涨",
      "option_place_order(BTC-USD-240329-75000-P, buy) → 买入保护性看跌",
      "option_place_order(BTC-USD-240329-100000-C, buy) → 买入保护性看涨",
    ],
    resultEn: "Iron condor established. Max profit: $1,240 (if BTC stays between $80K-$95K). Max loss: $3,760. Break-even: $78,760 / $96,240.",
    resultZh: "铁鹰式已建立。最大利润: $1,240（BTC保持在$80K-$95K之间）。最大亏损: $3,760。盈亏平衡: $78,760 / $96,240。",
  },
];

export default function UseCases() {
  const { t, lang } = useLanguage();
  const [activeCase, setActiveCase] = useState("grid");
  const [copied, setCopied] = useState(false);

  const useCase = CASES.find((c) => c.id === activeCase)!;
  const Icon = useCase.icon;

  const copyPrompt = () => {
    navigator.clipboard.writeText(t(useCase.promptEn, useCase.promptZh));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <BookOpen className="w-4 h-4" />
            <span>{t("Advanced", "高级")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Use Cases", "使用案例")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Use Case Demos", "使用案例演示")}</h1>
          <p className="text-muted-foreground">{t("Three official scenarios showcasing real-world agent workflows.", "三个官方场景展示真实Agent工作流。")}</p>
        </motion.div>

        {/* Case Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {CASES.map((c) => {
            const CIcon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCase(c.id)}
                className={`p-5 rounded-xl text-left transition-all ${
                  activeCase === c.id ? "glass-card border-primary/20 shadow-lg" : "border border-border/30 hover:border-border/60 hover:bg-accent/30"
                }`}
              >
                <CIcon className="w-6 h-6 mb-3" style={{ color: c.color }} />
                <h3 className="font-semibold text-sm mb-1">{t(c.nameEn, c.nameZh)}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">{t(c.descEn, c.descZh)}</p>
              </button>
            );
          })}
        </div>

        {/* Case Detail */}
        <motion.div key={activeCase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Prompt */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                {t("Agent Prompt", "Agent 提示词")}
              </h3>
              <button onClick={copyPrompt} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {t("Copy", "复制")}
              </button>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">{t(useCase.promptEn, useCase.promptZh)}</p>
          </div>

          {/* Execution Flow */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              {t("Execution Flow", "执行流程")}
            </h3>
            <div className="space-y-3">
              {(lang === "en" ? useCase.steps : useCase.stepsZh).map((step: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/30"
                >
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{i + 1}</span>
                  <span className="text-xs font-mono text-foreground/80">{step}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="glass-card p-6 border-l-2 border-green-500/30">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-400">
              <ArrowRight className="w-4 h-4" />
              {t("Expected Result", "预期结果")}
            </h3>
            <p className="text-sm text-foreground/80">{t(useCase.resultEn, useCase.resultZh)}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
