import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { FlaskConical, ChevronRight, Play, BarChart3, Settings, TrendingUp } from "lucide-react";

const STRATEGIES = [
  { id: "grid", nameEn: "Grid Trading", nameZh: "网格交易", descEn: "Capture range-bound volatility with automated grid orders.", descZh: "通过自动网格订单捕获区间波动收益。", params: [
    { name: "instId", label: "Trading Pair", labelZh: "交易对", default: "ETH-USDT" },
    { name: "minPx", label: "Min Price", labelZh: "最低价", default: "3200" },
    { name: "maxPx", label: "Max Price", labelZh: "最高价", default: "3800" },
    { name: "gridNum", label: "Grid Count", labelZh: "网格数", default: "10" },
    { name: "totalAmt", label: "Investment (USDT)", labelZh: "投入金额(USDT)", default: "1000" },
  ]},
  { id: "dca", nameEn: "DCA (Dollar Cost Averaging)", nameZh: "定投策略", descEn: "Accumulate crypto at regular intervals regardless of price.", descZh: "定期定额买入加密货币，不受价格影响。", params: [
    { name: "instId", label: "Trading Pair", labelZh: "交易对", default: "BTC-USDT" },
    { name: "amount", label: "Amount per Buy (USDT)", labelZh: "每次买入金额(USDT)", default: "100" },
    { name: "interval", label: "Interval", labelZh: "间隔", default: "weekly" },
    { name: "duration", label: "Duration (weeks)", labelZh: "持续时间(周)", default: "52" },
  ]},
  { id: "twap", nameEn: "TWAP", nameZh: "时间加权均价", descEn: "Execute large orders over time to minimize market impact.", descZh: "分时段执行大额订单以最小化市场冲击。", params: [
    { name: "instId", label: "Trading Pair", labelZh: "交易对", default: "BTC-USDT" },
    { name: "side", label: "Side", labelZh: "方向", default: "buy" },
    { name: "totalSz", label: "Total Size", labelZh: "总数量", default: "1.0" },
    { name: "slices", label: "Time Slices", labelZh: "分片数", default: "12" },
    { name: "intervalMin", label: "Interval (min)", labelZh: "间隔(分钟)", default: "5" },
  ]},
];

export default function StrategyStudio() {
  const { t } = useLanguage();
  const [activeStrategy, setActiveStrategy] = useState("grid");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const strategy = STRATEGIES.find((s) => s.id === activeStrategy)!;

  const runBacktest = () => {
    setRunning(true);
    setBacktestResult(null);
    setTimeout(() => {
      const mockResults: Record<string, any> = {
        grid: { totalReturn: "+8.42%", trades: 47, winRate: "68.1%", maxDrawdown: "-3.2%", sharpe: "1.85", avgProfit: "+0.18%", period: "30 days" },
        dca: { totalReturn: "+12.6%", avgCost: "$84,230", currentValue: "$94,850", totalInvested: "$5,200", unrealizedPnL: "+$654", period: "52 weeks" },
        twap: { avgFillPrice: "$87,412.30", slippage: "0.03%", totalFilled: "1.0 BTC", executionTime: "60 min", marketImpact: "Low", vwapDeviation: "+0.02%" },
      };
      setBacktestResult(mockResults[activeStrategy]);
      setRunning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FlaskConical className="w-4 h-4" />
            <span>{t("Tools", "实用工具")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Strategy Studio", "策略实验室")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Strategy Studio", "策略实验室")}</h1>
          <p className="text-muted-foreground">{t("Build, configure, and backtest trading strategies.", "构建、配置和回测交易策略。")}</p>
        </motion.div>

        {/* Strategy Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveStrategy(s.id); setBacktestResult(null); setParamValues({}); }}
              className={`px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeStrategy === s.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent/50"
              }`}
            >
              {t(s.nameEn, s.nameZh)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Config */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">{t("Configuration", "配置")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t(strategy.descEn, strategy.descZh)}</p>
            <div className="space-y-3">
              {strategy.params.map((p) => (
                <div key={p.name}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{t(p.label, p.labelZh)}</label>
                  <input
                    type="text"
                    value={paramValues[p.name] || ""}
                    onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                    placeholder={p.default}
                    className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={runBacktest}
              disabled={running}
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {running ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? t("Running Backtest...", "回测运行中...") : t("Run Backtest", "运行回测")}
            </button>
          </div>

          {/* Results */}
          <div>
            {backtestResult ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">{t("Backtest Results", "回测结果")}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(backtestResult).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-accent/30">
                      <p className="text-xs text-muted-foreground mb-1 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                      <p className={`text-sm font-semibold ${String(value).startsWith("+") ? "text-green-400" : String(value).startsWith("-") ? "text-red-400" : "text-foreground"}`}>
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-xs text-primary mb-1">
                    <TrendingUp className="w-3 h-3" />
                    {t("Simulation Note", "模拟说明")}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Results are simulated based on historical data. Past performance does not guarantee future results.", "结果基于历史数据模拟。过去的表现不保证未来的结果。")}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">{t("Configure parameters and run backtest to see results", "配置参数并运行回测查看结果")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
