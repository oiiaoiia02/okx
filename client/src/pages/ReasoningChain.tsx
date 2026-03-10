import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Brain, ChevronRight, Play, RotateCcw, CheckCircle, Loader2, AlertCircle, ArrowDown } from "lucide-react";

interface Step {
  id: number; type: "think" | "tool_call" | "result" | "decision";
  titleEn: string; titleZh: string; contentEn: string; contentZh: string;
  status: "pending" | "running" | "done" | "error"; duration?: number;
}

const DEMO_CHAINS = [
  {
    nameEn: "Buy BTC with Risk Check",
    nameZh: "买入BTC并检查风险",
    inputEn: "Buy 0.1 BTC at market price, but check if it's a good time first",
    inputZh: "市价买入0.1 BTC，但先检查现在是否是好时机",
    steps: [
      { id: 1, type: "think" as const, titleEn: "Analyzing request", titleZh: "分析请求", contentEn: "User wants to buy 0.1 BTC. Need to check market conditions first before executing.", contentZh: "用户想买入0.1 BTC。需要先检查市场状况再执行。", status: "done" as const, duration: 320 },
      { id: 2, type: "tool_call" as const, titleEn: "market_ticker(BTC-USDT)", titleZh: "market_ticker(BTC-USDT)", contentEn: "Fetching current BTC price and 24h change...\nResult: { last: \"87,432.50\", change24h: \"+1.82%\", vol24h: \"$12.3B\" }", contentZh: "获取当前BTC价格和24小时变化...\n结果: { last: \"87,432.50\", change24h: \"+1.82%\", vol24h: \"$12.3B\" }", status: "done" as const, duration: 180 },
      { id: 3, type: "tool_call" as const, titleEn: "market_funding_rate(BTC-USDT-SWAP)", titleZh: "market_funding_rate(BTC-USDT-SWAP)", contentEn: "Checking funding rate for sentiment...\nResult: { fundingRate: \"0.0001\", nextFundingTime: \"2024-03-15T08:00:00Z\" }", contentZh: "检查资金费率了解市场情绪...\n结果: { fundingRate: \"0.0001\", nextFundingTime: \"2024-03-15T08:00:00Z\" }", status: "done" as const, duration: 150 },
      { id: 4, type: "think" as const, titleEn: "Risk assessment", titleZh: "风险评估", contentEn: "BTC is up 1.82% in 24h, volume is healthy at $12.3B. Funding rate is neutral (0.01%). No extreme conditions detected. Safe to proceed with market buy.", contentZh: "BTC 24小时上涨1.82%，成交量$12.3B健康。资金费率中性(0.01%)。未检测到极端条件。可以安全执行市价买入。", status: "done" as const, duration: 250 },
      { id: 5, type: "decision" as const, titleEn: "Execute: Market Buy 0.1 BTC", titleZh: "执行: 市价买入 0.1 BTC", contentEn: "Conditions are favorable. Executing market buy order for 0.1 BTC-USDT.", contentZh: "条件有利。执行0.1 BTC-USDT市价买入订单。", status: "done" as const, duration: 100 },
      { id: 6, type: "tool_call" as const, titleEn: "spot_place_order(BTC-USDT, buy, 0.1)", titleZh: "spot_place_order(BTC-USDT, buy, 0.1)", contentEn: "Order placed successfully.\nResult: { ordId: \"5678901234\", avgPx: \"87,432.50\", fillSz: \"0.1\", state: \"filled\" }", contentZh: "订单成功下达。\n结果: { ordId: \"5678901234\", avgPx: \"87,432.50\", fillSz: \"0.1\", state: \"filled\" }", status: "done" as const, duration: 200 },
      { id: 7, type: "result" as const, titleEn: "Order Complete", titleZh: "订单完成", contentEn: "Successfully bought 0.1 BTC at $87,432.50. Total cost: $8,743.25. Market conditions were favorable with neutral funding and healthy volume.", contentZh: "成功以$87,432.50买入0.1 BTC。总成本: $8,743.25。市场条件有利，资金费率中性，成交量健康。", status: "done" as const, duration: 50 },
    ],
  },
  {
    nameEn: "Grid Bot Setup with Validation",
    nameZh: "网格机器人设置与验证",
    inputEn: "Create an ETH grid bot between $3,200-$3,800 with $1,000",
    inputZh: "创建ETH网格机器人，区间$3,200-$3,800，投入$1,000",
    steps: [
      { id: 1, type: "think" as const, titleEn: "Parsing grid parameters", titleZh: "解析网格参数", contentEn: "User wants grid bot: ETH-USDT, range $3,200-$3,800, investment $1,000. Need to validate current price is within range.", contentZh: "用户想创建网格机器人: ETH-USDT, 区间$3,200-$3,800, 投入$1,000。需要验证当前价格在区间内。", status: "done" as const, duration: 200 },
      { id: 2, type: "tool_call" as const, titleEn: "market_ticker(ETH-USDT)", titleZh: "market_ticker(ETH-USDT)", contentEn: "Result: { last: \"3,487.20\", change24h: \"+0.85%\" }", contentZh: "结果: { last: \"3,487.20\", change24h: \"+0.85%\" }", status: "done" as const, duration: 120 },
      { id: 3, type: "think" as const, titleEn: "Validating parameters", titleZh: "验证参数", contentEn: "Current ETH price $3,487.20 is within range [$3,200, $3,800]. Grid spacing: $60 per grid (10 grids). Each grid order ≈ $100. Parameters are valid.", contentZh: "当前ETH价格$3,487.20在区间[$3,200, $3,800]内。网格间距: 每格$60 (10格)。每格订单≈$100。参数有效。", status: "done" as const, duration: 180 },
      { id: 4, type: "tool_call" as const, titleEn: "bot_grid_create(ETH-USDT, 10, 3200, 3800)", titleZh: "bot_grid_create(ETH-USDT, 10, 3200, 3800)", contentEn: "Result: { algoId: \"grid_001\", state: \"running\", gridNum: 10 }", contentZh: "结果: { algoId: \"grid_001\", state: \"running\", gridNum: 10 }", status: "done" as const, duration: 250 },
      { id: 5, type: "result" as const, titleEn: "Grid Bot Active", titleZh: "网格机器人已激活", contentEn: "ETH-USDT grid bot created successfully. 10 grids from $3,200 to $3,800. Investment: $1,000. Bot ID: grid_001.", contentZh: "ETH-USDT网格机器人创建成功。10格，区间$3,200-$3,800。投入: $1,000。Bot ID: grid_001。", status: "done" as const, duration: 50 },
    ],
  },
];

export default function ReasoningChain() {
  const { t } = useLanguage();
  const [activeChain, setActiveChain] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  const chain = DEMO_CHAINS[activeChain];

  const startAnimation = () => {
    setAnimating(true);
    setVisibleSteps(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setVisibleSteps(step);
      if (step >= chain.steps.length) {
        clearInterval(interval);
        setAnimating(false);
      }
    }, 800);
  };

  const reset = () => {
    setVisibleSteps(0);
    setAnimating(false);
  };

  useEffect(() => { reset(); }, [activeChain]);

  const stepIcon = (type: string, status: string) => {
    if (status === "running") return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    if (status === "error") return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (type === "think") return <Brain className="w-4 h-4 text-purple-400" />;
    if (type === "tool_call") return <div className="w-4 h-4 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">T</div>;
    if (type === "decision") return <div className="w-4 h-4 rounded bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-[10px] font-bold">D</div>;
    return <CheckCircle className="w-4 h-4 text-green-400" />;
  };

  const stepColor = (type: string) => {
    if (type === "think") return "border-purple-500/30";
    if (type === "tool_call") return "border-blue-500/30";
    if (type === "decision") return "border-yellow-500/30";
    return "border-green-500/30";
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Brain className="w-4 h-4" />
            <span>{t("Advanced", "高级")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Reasoning Chain", "推理链")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Agent Reasoning Chain", "Agent 推理链可视化")}</h1>
          <p className="text-muted-foreground">{t("Watch the AI agent think step by step.", "观看AI Agent逐步思考过程。")}</p>
        </motion.div>

        {/* Chain Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {DEMO_CHAINS.map((c, i) => (
            <button
              key={i}
              onClick={() => setActiveChain(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeChain === i ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent/50"
              }`}
            >
              {t(c.nameEn, c.nameZh)}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="glass-card p-5 mb-6">
          <p className="text-xs text-muted-foreground mb-2">{t("User Input", "用户输入")}</p>
          <p className="text-lg font-medium">{t(chain.inputEn, chain.inputZh)}</p>
        </div>

        {/* Controls */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={startAnimation}
            disabled={animating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            {animating ? t("Running...", "运行中...") : t("Start Reasoning", "开始推理")}
          </button>
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm font-medium hover:bg-accent/50 transition-colors">
            <RotateCcw className="w-4 h-4" />
            {t("Reset", "重置")}
          </button>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          <AnimatePresence>
            {chain.steps.slice(0, visibleSteps).map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {i > 0 && (
                  <div className="flex justify-center my-2">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
                <div className={`glass-card p-5 border-l-2 ${stepColor(step.type)}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {stepIcon(step.type, i === visibleSteps - 1 && animating ? "running" : "done")}
                    <span className="text-sm font-semibold">{t(step.titleEn, step.titleZh)}</span>
                    {step.duration && (
                      <span className="text-[10px] text-muted-foreground ml-auto">{step.duration}ms</span>
                    )}
                  </div>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{t(step.contentEn, step.contentZh)}</pre>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {visibleSteps === 0 && !animating && (
          <div className="glass-card p-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t("Click 'Start Reasoning' to watch the agent think", "点击'开始推理'观看Agent思考过程")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
