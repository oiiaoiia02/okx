import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Brain, ChevronRight, Play, RotateCcw, CheckCircle, Loader2, AlertCircle, ArrowDown, Activity, Sparkles } from "lucide-react";
import { getTicker, getFundingRate, formatPrice } from "@/services/okxApi";

interface Step {
  id: number;
  type: "think" | "tool_call" | "result" | "decision";
  titleEn: string;
  titleZh: string;
  contentEn: string;
  contentZh: string;
  status: "pending" | "running" | "done" | "error";
  duration?: number;
  isLive?: boolean;
}

interface Chain {
  nameEn: string;
  nameZh: string;
  inputEn: string;
  inputZh: string;
  generateSteps: () => Promise<Step[]>;
}

// Dynamic chain generators that fetch real data
const CHAINS: Chain[] = [
  {
    nameEn: "Buy BTC with Risk Check", nameZh: "买入BTC并检查风险",
    inputEn: "Buy 0.1 BTC at market price, but check if it's a good time first",
    inputZh: "市价买入0.1 BTC，但先检查现在是否是好时机",
    generateSteps: async () => {
      const steps: Step[] = [];
      steps.push({ id: 1, type: "think", titleEn: "Analyzing request", titleZh: "分析请求", contentEn: "User wants to buy 0.1 BTC. Need to check market conditions first before executing.", contentZh: "用户想买入0.1 BTC。需要先检查市场状况再执行。", status: "done", duration: 320 });

      try {
        const ticker = await getTicker("BTC-USDT");
        const price = parseFloat(ticker.last);
        const open = parseFloat(ticker.open24h);
        const change = ((price - open) / open * 100).toFixed(2);
        const vol = parseFloat(ticker.volCcy24h);
        steps.push({ id: 2, type: "tool_call", titleEn: "market_ticker(BTC-USDT)", titleZh: "market_ticker(BTC-USDT)", contentEn: `Fetching current BTC price from OKX V5 API...\nResult: { last: "${formatPrice(price)}", change24h: "${change}%", vol24h: "$${(vol / 1e9).toFixed(1)}B" }`, contentZh: `从OKX V5 API获取当前BTC价格...\n结果: { last: "${formatPrice(price)}", change24h: "${change}%", vol24h: "$${(vol / 1e9).toFixed(1)}B" }`, status: "done", duration: 180, isLive: true });

        let fundingStr = "N/A";
        try {
          const funding = await getFundingRate("BTC-USDT-SWAP");
          fundingStr = (parseFloat(funding.fundingRate) * 100).toFixed(4) + "%";
          steps.push({ id: 3, type: "tool_call", titleEn: "market_funding_rate(BTC-USDT-SWAP)", titleZh: "market_funding_rate(BTC-USDT-SWAP)", contentEn: `Checking funding rate...\nResult: { fundingRate: "${fundingStr}" }`, contentZh: `检查资金费率...\n结果: { fundingRate: "${fundingStr}" }`, status: "done", duration: 150, isLive: true });
        } catch { /* skip */ }

        const isBullish = parseFloat(change) > 0;
        const isHighVol = vol > 5e9;
        steps.push({ id: 4, type: "think", titleEn: "Risk assessment", titleZh: "风险评估", contentEn: `BTC is ${isBullish ? "up" : "down"} ${change}% in 24h. Volume is ${isHighVol ? "healthy" : "moderate"} at $${(vol / 1e9).toFixed(1)}B. Funding rate: ${fundingStr}. ${isBullish && isHighVol ? "Conditions favorable." : "Proceed with caution."}`, contentZh: `BTC 24小时${isBullish ? "上涨" : "下跌"}${change}%。成交量$${(vol / 1e9).toFixed(1)}B${isHighVol ? "健康" : "一般"}。资金费率: ${fundingStr}。${isBullish && isHighVol ? "条件有利。" : "需谨慎操作。"}`, status: "done", duration: 250 });

        steps.push({ id: 5, type: "decision", titleEn: "Execute: Market Buy 0.1 BTC", titleZh: "执行: 市价买入 0.1 BTC", contentEn: `Executing market buy for 0.1 BTC at ~$${formatPrice(price)}.`, contentZh: `执行市价买入0.1 BTC，约$${formatPrice(price)}。`, status: "done", duration: 100 });

        const cost = (price * 0.1).toFixed(2);
        steps.push({ id: 6, type: "tool_call", titleEn: "spot_place_order(BTC-USDT, buy, 0.1)", titleZh: "spot_place_order(BTC-USDT, buy, 0.1)", contentEn: `[SIMULATED — Requires MCP Server for real execution]\nResult: { ordId: "sim-${Date.now()}", avgPx: "${formatPrice(price)}", fillSz: "0.1", state: "filled" }`, contentZh: `[模拟 — 需要MCP Server进行真实执行]\n结果: { ordId: "sim-${Date.now()}", avgPx: "${formatPrice(price)}", fillSz: "0.1", state: "filled" }`, status: "done", duration: 200 });

        steps.push({ id: 7, type: "result", titleEn: "Order Complete", titleZh: "订单完成", contentEn: `Bought 0.1 BTC at $${formatPrice(price)}. Total cost: $${cost}. Market: ${isBullish ? "bullish" : "bearish"} with ${isHighVol ? "strong" : "moderate"} volume.`, contentZh: `以$${formatPrice(price)}买入0.1 BTC。总成本: $${cost}。市场: ${isBullish ? "看涨" : "看跌"}，成交量${isHighVol ? "强劲" : "一般"}。`, status: "done", duration: 50 });
      } catch (err: any) {
        steps.push({ id: 2, type: "tool_call", titleEn: "market_ticker(BTC-USDT)", titleZh: "market_ticker(BTC-USDT)", contentEn: `Error: ${err.message}`, contentZh: `错误: ${err.message}`, status: "error", duration: 0 });
      }
      return steps;
    },
  },
  {
    nameEn: "ETH Grid Bot Setup", nameZh: "ETH网格机器人设置",
    inputEn: "Create an ETH grid bot between $2,800-$3,500 with 10 grids",
    inputZh: "创建ETH网格机器人，区间$2,800-$3,500，10个格子",
    generateSteps: async () => {
      const steps: Step[] = [];
      steps.push({ id: 1, type: "think", titleEn: "Parsing grid parameters", titleZh: "解析网格参数", contentEn: "User wants grid bot: ETH-USDT, range $2,800-$3,500, 10 grids. Need to validate current price is within range.", contentZh: "用户想创建网格机器人: ETH-USDT, 区间$2,800-$3,500, 10格。需要验证当前价格在区间内。", status: "done", duration: 200 });

      try {
        const ticker = await getTicker("ETH-USDT");
        const price = parseFloat(ticker.last);
        const inRange = price >= 2800 && price <= 3500;
        steps.push({ id: 2, type: "tool_call", titleEn: "market_ticker(ETH-USDT)", titleZh: "market_ticker(ETH-USDT)", contentEn: `Real OKX data: { last: "${formatPrice(price)}", change24h: "${((price - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h) * 100).toFixed(2)}%" }`, contentZh: `OKX真实数据: { last: "${formatPrice(price)}", change24h: "${((price - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h) * 100).toFixed(2)}%" }`, status: "done", duration: 120, isLive: true });

        const gridSpacing = ((3500 - 2800) / 10).toFixed(0);
        steps.push({ id: 3, type: "think", titleEn: "Validating parameters", titleZh: "验证参数", contentEn: `Current ETH price $${formatPrice(price)} is ${inRange ? "within" : "OUTSIDE"} range [$2,800, $3,500]. Grid spacing: $${gridSpacing} per grid. ${inRange ? "Parameters valid." : "WARNING: Price outside grid range!"}`, contentZh: `当前ETH价格$${formatPrice(price)}${inRange ? "在" : "不在"}区间[$2,800, $3,500]内。网格间距: $${gridSpacing}。${inRange ? "参数有效。" : "警告: 价格超出网格区间!"}`, status: "done", duration: 180 });

        if (inRange) {
          steps.push({ id: 4, type: "tool_call", titleEn: "bot_grid_create(ETH-USDT, 10, 2800, 3500)", titleZh: "bot_grid_create(ETH-USDT, 10, 2800, 3500)", contentEn: `[SIMULATED] Result: { algoId: "grid-${Date.now()}", state: "running", gridNum: 10 }`, contentZh: `[模拟] 结果: { algoId: "grid-${Date.now()}", state: "running", gridNum: 10 }`, status: "done", duration: 250 });
          steps.push({ id: 5, type: "result", titleEn: "Grid Bot Active", titleZh: "网格机器人已激活", contentEn: `ETH-USDT grid bot created. 10 grids from $2,800 to $3,500. Current price: $${formatPrice(price)}.`, contentZh: `ETH-USDT网格机器人创建成功。10格，区间$2,800-$3,500。当前价格: $${formatPrice(price)}。`, status: "done", duration: 50 });
        } else {
          steps.push({ id: 4, type: "decision", titleEn: "Adjust grid range", titleZh: "调整网格区间", contentEn: `Current price $${formatPrice(price)} is outside the requested range. Suggesting adjusted range: $${(price * 0.9).toFixed(0)}-$${(price * 1.1).toFixed(0)}.`, contentZh: `当前价格$${formatPrice(price)}超出请求区间。建议调整区间: $${(price * 0.9).toFixed(0)}-$${(price * 1.1).toFixed(0)}。`, status: "done", duration: 200 });
        }
      } catch (err: any) {
        steps.push({ id: 2, type: "tool_call", titleEn: "market_ticker(ETH-USDT)", titleZh: "market_ticker(ETH-USDT)", contentEn: `Error: ${err.message}`, contentZh: `错误: ${err.message}`, status: "error" });
      }
      return steps;
    },
  },
  {
    nameEn: "Multi-Asset Price Scan", nameZh: "多资产价格扫描",
    inputEn: "Compare BTC, ETH, SOL prices and tell me which is performing best today",
    inputZh: "对比BTC、ETH、SOL价格，告诉我今天哪个表现最好",
    generateSteps: async () => {
      const steps: Step[] = [];
      steps.push({ id: 1, type: "think", titleEn: "Planning multi-asset scan", titleZh: "规划多资产扫描", contentEn: "Need to fetch real-time data for BTC, ETH, SOL from OKX and compare 24h performance.", contentZh: "需要从OKX获取BTC、ETH、SOL的实时数据并对比24小时表现。", status: "done", duration: 150 });

      const results: { token: string; price: number; change: number }[] = [];
      let stepId = 2;
      for (const pair of ["BTC-USDT", "ETH-USDT", "SOL-USDT"]) {
        try {
          const ticker = await getTicker(pair);
          const price = parseFloat(ticker.last);
          const change = ((price - parseFloat(ticker.open24h)) / parseFloat(ticker.open24h) * 100);
          results.push({ token: pair.split("-")[0], price, change });
          steps.push({ id: stepId++, type: "tool_call", titleEn: `market_ticker(${pair})`, titleZh: `market_ticker(${pair})`, contentEn: `Real OKX: { last: "$${formatPrice(price)}", change24h: "${change.toFixed(2)}%" }`, contentZh: `OKX真实: { last: "$${formatPrice(price)}", change24h: "${change.toFixed(2)}%" }`, status: "done", duration: 120, isLive: true });
        } catch {
          steps.push({ id: stepId++, type: "tool_call", titleEn: `market_ticker(${pair})`, titleZh: `market_ticker(${pair})`, contentEn: "Failed to fetch", contentZh: "获取失败", status: "error" });
        }
      }

      if (results.length > 0) {
        const best = results.reduce((a, b) => a.change > b.change ? a : b);
        const worst = results.reduce((a, b) => a.change < b.change ? a : b);
        const summary = results.map((r) => `${r.token}: $${formatPrice(r.price)} (${r.change >= 0 ? "+" : ""}${r.change.toFixed(2)}%)`).join("\n");
        steps.push({ id: stepId++, type: "think", titleEn: "Comparing performance", titleZh: "对比表现", contentEn: `Performance ranking:\n${summary}\n\nBest: ${best.token} (${best.change >= 0 ? "+" : ""}${best.change.toFixed(2)}%)\nWorst: ${worst.token} (${worst.change >= 0 ? "+" : ""}${worst.change.toFixed(2)}%)`, contentZh: `表现排名:\n${summary}\n\n最佳: ${best.token} (${best.change >= 0 ? "+" : ""}${best.change.toFixed(2)}%)\n最差: ${worst.token} (${worst.change >= 0 ? "+" : ""}${worst.change.toFixed(2)}%)`, status: "done", duration: 200 });
        steps.push({ id: stepId++, type: "result", titleEn: `${best.token} leads today`, titleZh: `${best.token}今日领涨`, contentEn: `${best.token} is the best performer at ${best.change >= 0 ? "+" : ""}${best.change.toFixed(2)}%. All data from OKX V5 real-time API.`, contentZh: `${best.token}表现最佳，涨幅${best.change >= 0 ? "+" : ""}${best.change.toFixed(2)}%。所有数据来自OKX V5实时API。`, status: "done", duration: 50 });
      }
      return steps;
    },
  },
];

export default function ReasoningChain() {
  const { t } = useLanguage();
  const [activeChain, setActiveChain] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const cancelRef = useRef(false);

  const chain = CHAINS[activeChain];

  const startAnimation = async () => {
    setAnimating(true);
    setVisibleSteps(0);
    setSteps([]);
    cancelRef.current = false;

    const generatedSteps = await chain.generateSteps();
    if (cancelRef.current) return;
    setSteps(generatedSteps);

    for (let i = 1; i <= generatedSteps.length; i++) {
      if (cancelRef.current) return;
      await new Promise((r) => setTimeout(r, 600));
      setVisibleSteps(i);
    }
    setAnimating(false);
  };

  const reset = () => {
    cancelRef.current = true;
    setVisibleSteps(0);
    setSteps([]);
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
          <p className="text-muted-foreground">
            {t("Watch the AI agent think step by step with real OKX market data.", "观看AI Agent逐步思考过程，使用OKX真实行情数据。")}
          </p>
        </motion.div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CHAINS.map((c, i) => (
            <button key={i} onClick={() => setActiveChain(i)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeChain === i ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent/50"}`}>
              {t(c.nameEn, c.nameZh)}
            </button>
          ))}
        </div>

        <div className="glass-card p-5 mb-6">
          <p className="text-xs text-muted-foreground mb-2">{t("User Input", "用户输入")}</p>
          <p className="text-lg font-medium">{t(chain.inputEn, chain.inputZh)}</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={startAnimation} disabled={animating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            {animating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {animating ? t("Fetching real data...", "获取真实数据...") : t("Start Reasoning", "开始推理")}
          </button>
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm font-medium hover:bg-accent/50 transition-colors">
            <RotateCcw className="w-4 h-4" /> {t("Reset", "重置")}
          </button>
        </div>

        <div className="space-y-0 relative">
          {/* Neural connection line */}
          {visibleSteps > 1 && (
            <div className="absolute left-[23px] top-0 bottom-0 w-[2px] z-0">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="w-full rounded-full"
                style={{ background: "linear-gradient(180deg, rgba(0, 230, 138, 0.3), rgba(79, 143, 255, 0.2), rgba(167, 139, 250, 0.15), transparent)" }}
              />
            </div>
          )}
          <AnimatePresence>
            {steps.slice(0, visibleSteps).map((step, i) => {
              const isLatest = i === visibleSteps - 1;
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
                  className="relative pl-12 pb-4"
                >
                  {/* Node dot */}
                  <div className="absolute left-[16px] top-[20px] z-10">
                    <div className={`w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center ${
                      step.type === "think" ? "border-purple-400 bg-purple-400/20" :
                      step.type === "tool_call" ? "border-blue-400 bg-blue-400/20" :
                      step.type === "decision" ? "border-yellow-400 bg-yellow-400/20" :
                      "border-green-400 bg-green-400/20"
                    }`}>
                      {isLatest && animating && (
                        <motion.div
                          animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 rounded-full"
                          style={{ background: step.type === "think" ? "rgba(167, 139, 250, 0.3)" : step.type === "tool_call" ? "rgba(79, 143, 255, 0.3)" : "rgba(0, 230, 138, 0.3)" }}
                        />
                      )}
                    </div>
                  </div>

                  <div className={`glass-card p-5 border-l-2 ${stepColor(step.type)} ${
                    isLatest && animating ? "ring-1 ring-primary/20 shadow-lg shadow-primary/5" : ""
                  } transition-all duration-300`}>
                    <div className="flex items-center gap-3 mb-3">
                      {stepIcon(step.type, isLatest && animating ? "running" : step.status)}
                      <span className="text-sm font-semibold">{t(step.titleEn, step.titleZh)}</span>
                      {step.isLive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5" /> LIVE
                        </span>
                      )}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground ml-auto">
                        Step {i + 1}/{steps.length}
                      </span>
                      {step.duration && <span className="text-[10px] text-muted-foreground">{step.duration}ms</span>}
                    </div>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{t(step.contentEn, step.contentZh)}</pre>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {visibleSteps === 0 && !animating && (
          <div className="glass-card p-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">{t("Click 'Start Reasoning' to watch the agent think with real OKX data", "点击'开始推理'观看Agent使用OKX真实数据思考")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
