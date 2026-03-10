import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCandles, type OKXCandle } from "@/services/okxApi";
import {
  FlaskConical, ChevronRight, Play, BarChart3, Settings, TrendingUp,
  Download, Upload, Copy, Check, Activity, ExternalLink,
} from "lucide-react";

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
    { name: "interval", label: "Interval (hours)", labelZh: "间隔(小时)", default: "24" },
    { name: "duration", label: "Duration (days)", labelZh: "持续时间(天)", default: "30" },
  ]},
  { id: "twap", nameEn: "TWAP", nameZh: "时间加权均价", descEn: "Execute large orders over time to minimize market impact.", descZh: "分时段执行大额订单以最小化市场冲击。", params: [
    { name: "instId", label: "Trading Pair", labelZh: "交易对", default: "BTC-USDT" },
    { name: "side", label: "Side (buy/sell)", labelZh: "方向(buy/sell)", default: "buy" },
    { name: "totalSz", label: "Total Size", labelZh: "总数量", default: "1.0" },
    { name: "slices", label: "Time Slices", labelZh: "分片数", default: "12" },
    { name: "intervalMin", label: "Interval (min)", labelZh: "间隔(分钟)", default: "5" },
  ]},
];

interface BacktestResult {
  strategy: string;
  params: Record<string, string>;
  metrics: Record<string, string>;
  priceData: { time: string; price: number }[];
  trades: { time: string; side: string; price: number; size: number }[];
  dataSource: string;
  timestamp: number;
}

// ─── Real Backtest Engine using OKX Historical Data ─────────────────────────

async function runGridBacktest(params: Record<string, string>): Promise<BacktestResult> {
  const instId = params.instId || "ETH-USDT";
  const minPx = parseFloat(params.minPx || "3200");
  const maxPx = parseFloat(params.maxPx || "3800");
  const gridNum = parseInt(params.gridNum || "10");
  const totalAmt = parseFloat(params.totalAmt || "1000");

  // Fetch real historical candles from OKX
  const candles = await getCandles(instId, "1H", "100");
  const prices = candles.reverse().map((c) => ({ time: new Date(parseInt(c.ts)).toLocaleString(), price: parseFloat(c.c) }));

  // Calculate grid levels
  const gridStep = (maxPx - minPx) / gridNum;
  const gridLevels = Array.from({ length: gridNum + 1 }, (_, i) => minPx + i * gridStep);
  const amtPerGrid = totalAmt / gridNum;

  // Simulate grid trading
  let totalPnL = 0;
  let tradeCount = 0;
  let winCount = 0;
  let maxDD = 0;
  let peakPnL = 0;
  const trades: BacktestResult["trades"] = [];

  let holdings = 0;
  let avgCost = 0;

  for (let i = 1; i < prices.length; i++) {
    const prevPrice = prices[i - 1].price;
    const curPrice = prices[i].price;

    // Check if price crossed any grid level
    for (const level of gridLevels) {
      if (prevPrice > level && curPrice <= level && curPrice >= minPx) {
        // Price dropped below grid — BUY
        const size = amtPerGrid / curPrice;
        avgCost = holdings > 0 ? (avgCost * holdings + curPrice * size) / (holdings + size) : curPrice;
        holdings += size;
        trades.push({ time: prices[i].time, side: "buy", price: curPrice, size });
        tradeCount++;
      }
      if (prevPrice < level && curPrice >= level && curPrice <= maxPx && holdings > 0) {
        // Price rose above grid — SELL
        const size = Math.min(holdings, amtPerGrid / curPrice);
        const pnl = (curPrice - avgCost) * size;
        totalPnL += pnl;
        if (pnl > 0) winCount++;
        holdings -= size;
        trades.push({ time: prices[i].time, side: "sell", price: curPrice, size });
        tradeCount++;
      }
    }

    peakPnL = Math.max(peakPnL, totalPnL);
    maxDD = Math.min(maxDD, totalPnL - peakPnL);
  }

  const returnPct = (totalPnL / totalAmt) * 100;
  const winRate = tradeCount > 0 ? (winCount / Math.ceil(tradeCount / 2)) * 100 : 0;
  const sharpe = Math.abs(maxDD) > 0 ? (returnPct / Math.abs((maxDD / totalAmt) * 100)).toFixed(2) : "N/A";

  return {
    strategy: "grid",
    params,
    metrics: {
      "Total Return": `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`,
      "Total PnL": `${totalPnL >= 0 ? "+" : ""}$${totalPnL.toFixed(2)}`,
      "Trades": `${tradeCount}`,
      "Win Rate": `${winRate.toFixed(1)}%`,
      "Max Drawdown": `${((maxDD / totalAmt) * 100).toFixed(2)}%`,
      "Sharpe Ratio": sharpe,
      "Data Points": `${prices.length} (1H candles)`,
      "Period": `${prices.length} hours`,
    },
    priceData: prices,
    trades,
    dataSource: `OKX V5 API — ${instId} 1H candles`,
    timestamp: Date.now(),
  };
}

async function runDCABacktest(params: Record<string, string>): Promise<BacktestResult> {
  const instId = params.instId || "BTC-USDT";
  const amountPerBuy = parseFloat(params.amount || "100");
  const intervalHours = parseInt(params.interval || "24");
  const durationDays = parseInt(params.duration || "30");

  const totalCandles = Math.min(Math.ceil((durationDays * 24) / 4), 100);
  const candles = await getCandles(instId, "4H", String(totalCandles));
  const prices = candles.reverse().map((c) => ({ time: new Date(parseInt(c.ts)).toLocaleString(), price: parseFloat(c.c) }));

  const buyInterval = Math.max(1, Math.floor(intervalHours / 4));
  let totalInvested = 0;
  let totalHoldings = 0;
  const trades: BacktestResult["trades"] = [];

  for (let i = 0; i < prices.length; i += buyInterval) {
    const price = prices[i].price;
    const size = amountPerBuy / price;
    totalInvested += amountPerBuy;
    totalHoldings += size;
    trades.push({ time: prices[i].time, side: "buy", price, size });
  }

  const lastPrice = prices[prices.length - 1]?.price || 0;
  const currentValue = totalHoldings * lastPrice;
  const avgCost = totalInvested / totalHoldings;
  const pnl = currentValue - totalInvested;
  const returnPct = (pnl / totalInvested) * 100;

  return {
    strategy: "dca",
    params,
    metrics: {
      "Total Return": `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%`,
      "Total Invested": `$${totalInvested.toFixed(2)}`,
      "Current Value": `$${currentValue.toFixed(2)}`,
      "Unrealized PnL": `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`,
      "Avg Cost": `$${avgCost.toFixed(2)}`,
      "Total Holdings": `${totalHoldings.toFixed(6)}`,
      "Buy Count": `${trades.length}`,
      "Data Points": `${prices.length} (4H candles)`,
    },
    priceData: prices,
    trades,
    dataSource: `OKX V5 API — ${instId} 4H candles`,
    timestamp: Date.now(),
  };
}

async function runTWAPBacktest(params: Record<string, string>): Promise<BacktestResult> {
  const instId = params.instId || "BTC-USDT";
  const totalSz = parseFloat(params.totalSz || "1.0");
  const slices = parseInt(params.slices || "12");
  const intervalMin = parseInt(params.intervalMin || "5");

  const candles = await getCandles(instId, "1H", "100");
  const prices = candles.reverse().map((c) => ({ time: new Date(parseInt(c.ts)).toLocaleString(), price: parseFloat(c.c) }));

  const sizePerSlice = totalSz / slices;
  const sliceInterval = Math.max(1, Math.floor(slices / Math.min(slices, prices.length)));
  let totalCost = 0;
  const trades: BacktestResult["trades"] = [];

  for (let i = 0; i < slices && i * sliceInterval < prices.length; i++) {
    const idx = i * sliceInterval;
    const price = prices[idx].price;
    totalCost += price * sizePerSlice;
    trades.push({ time: prices[idx].time, side: params.side || "buy", price, size: sizePerSlice });
  }

  const avgFillPrice = totalCost / totalSz;
  const vwap = prices.reduce((s, p) => s + p.price, 0) / prices.length;
  const slippage = ((avgFillPrice - vwap) / vwap) * 100;

  return {
    strategy: "twap",
    params,
    metrics: {
      "Avg Fill Price": `$${avgFillPrice.toFixed(2)}`,
      "VWAP": `$${vwap.toFixed(2)}`,
      "Slippage vs VWAP": `${slippage >= 0 ? "+" : ""}${slippage.toFixed(4)}%`,
      "Total Filled": `${totalSz} ${instId.split("-")[0]}`,
      "Total Cost": `$${totalCost.toFixed(2)}`,
      "Slices Executed": `${trades.length}/${slices}`,
      "Market Impact": Math.abs(slippage) < 0.05 ? "Low" : Math.abs(slippage) < 0.2 ? "Medium" : "High",
      "Data Points": `${prices.length} (1H candles)`,
    },
    priceData: prices,
    trades,
    dataSource: `OKX V5 API — ${instId} 1H candles`,
    timestamp: Date.now(),
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function StrategyStudio() {
  const { t } = useLanguage();
  const [activeStrategy, setActiveStrategy] = useState("grid");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const strategy = STRATEGIES.find((s) => s.id === activeStrategy)!;

  const getParamValue = (name: string) => {
    return paramValues[name] || strategy.params.find((p) => p.name === name)?.default || "";
  };

  const getFullParams = () => {
    const p: Record<string, string> = {};
    strategy.params.forEach((param) => {
      p[param.name] = getParamValue(param.name);
    });
    return p;
  };

  const runBacktest = async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const params = getFullParams();
      let res: BacktestResult;
      switch (activeStrategy) {
        case "grid": res = await runGridBacktest(params); break;
        case "dca": res = await runDCABacktest(params); break;
        case "twap": res = await runTWAPBacktest(params); break;
        default: throw new Error("Unknown strategy");
      }
      setResult(res);
      // Save to history
      const history = JSON.parse(localStorage.getItem("okx-strategy-history") || "[]");
      history.unshift(res);
      localStorage.setItem("okx-strategy-history", JSON.stringify(history.slice(0, 50)));
    } catch (err: any) {
      setError(err.message || "Backtest failed");
    } finally {
      setRunning(false);
    }
  };

  // JSON Export
  const exportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okx-backtest-${result.strategy}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Import
  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as BacktestResult;
        setResult(data);
        if (data.params) setParamValues(data.params);
        if (data.strategy) setActiveStrategy(data.strategy);
      } catch {
        setError("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Copy MCP JSON
  const copyMCP = () => {
    const params = getFullParams();
    const mcp = JSON.stringify({
      tool: activeStrategy === "grid" ? "bot_grid_create" : activeStrategy === "dca" ? "bot_dca_create" : "algo_twap_create",
      params,
    }, null, 2);
    navigator.clipboard.writeText(mcp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Mini price chart
  const PriceChart = ({ data, trades }: { data: { time: string; price: number }[]; trades: BacktestResult["trades"] }) => {
    if (!data.length) return null;
    const min = Math.min(...data.map((d) => d.price));
    const max = Math.max(...data.map((d) => d.price));
    const range = max - min || 1;
    const w = 600;
    const h = 150;
    const step = w / (data.length - 1);
    const points = data.map((d, i) => `${i * step},${h - ((d.price - min) / range) * h}`).join(" ");

    return (
      <div className="overflow-x-auto">
        <svg width={w} height={h + 20} className="w-full min-w-[400px]">
          <polyline fill="none" stroke="oklch(0.72 0.19 163)" strokeWidth="1.5" points={points} opacity="0.8" />
          {/* Trade markers */}
          {trades.slice(0, 30).map((trade, i) => {
            const idx = data.findIndex((d) => d.time === trade.time);
            if (idx < 0) return null;
            const x = idx * step;
            const y = h - ((trade.price - min) / range) * h;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                fill={trade.side === "buy" ? "#22c55e" : "#ef4444"}
                opacity={0.8}
              />
            );
          })}
          {/* Price labels */}
          <text x={0} y={h + 14} className="text-[9px] fill-muted-foreground">${min.toFixed(2)}</text>
          <text x={w - 60} y={14} className="text-[9px] fill-muted-foreground">${max.toFixed(2)}</text>
        </svg>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Buy</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Sell</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary" /> Price</span>
        </div>
      </div>
    );
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("Strategy Studio", "策略实验室")}</h1>
              <p className="text-muted-foreground">
                {t("Build, configure, and backtest strategies with real OKX historical data.", "使用OKX真实历史数据构建、配置和回测交易策略。")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {t("Import", "导入")}
              </button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={importJSON} className="hidden" />
              {result && (
                <button
                  onClick={exportJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t("Export JSON", "导出JSON")}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Strategy Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {STRATEGIES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveStrategy(s.id); setResult(null); setParamValues({}); setError(null); }}
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
            <div className="flex gap-2 mt-6">
              <button
                onClick={runBacktest}
                disabled={running}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {running ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? t("Fetching OKX data...", "获取OKX数据中...") : t("Run Backtest", "运行回测")}
              </button>
              <button
                onClick={copyMCP}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-border/50 text-sm font-medium hover:bg-accent/50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                MCP
              </button>
            </div>
          </div>

          {/* Results */}
          <div>
            {error && (
              <div className="glass-card p-6 border-red-500/20 mb-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
            {result ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{t("Backtest Results", "回测结果")}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-primary">
                      <Activity className="w-3 h-3" />
                      {result.dataSource}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(result.metrics).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-lg bg-accent/30">
                        <p className="text-[10px] text-muted-foreground mb-1">{key}</p>
                        <p className={`text-sm font-semibold font-mono ${
                          String(value).startsWith("+") ? "text-green-400" :
                          String(value).startsWith("-") ? "text-red-400" :
                          "text-foreground"
                        }`}>
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Chart */}
                <div className="glass-card p-6">
                  <h4 className="text-sm font-semibold mb-3">{t("Price Chart + Trade Markers", "价格走势 + 交易标记")}</h4>
                  <PriceChart data={result.priceData} trades={result.trades} />
                </div>

                {/* Trades Table */}
                {result.trades.length > 0 && (
                  <div className="glass-card p-6">
                    <h4 className="text-sm font-semibold mb-3">
                      {t("Trade History", "交易记录")} ({result.trades.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 text-muted-foreground">{t("Time", "时间")}</th>
                            <th className="text-left py-2 text-muted-foreground">{t("Side", "方向")}</th>
                            <th className="text-right py-2 text-muted-foreground">{t("Price", "价格")}</th>
                            <th className="text-right py-2 text-muted-foreground">{t("Size", "数量")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.trades.slice(0, 20).map((trade, i) => (
                            <tr key={i} className="border-b border-border/20">
                              <td className="py-1.5 text-muted-foreground">{trade.time}</td>
                              <td className={`py-1.5 font-medium ${trade.side === "buy" ? "text-green-400" : "text-red-400"}`}>
                                {trade.side.toUpperCase()}
                              </td>
                              <td className="py-1.5 text-right font-mono">${trade.price.toFixed(2)}</td>
                              <td className="py-1.5 text-right font-mono">{trade.size.toFixed(6)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Data Source Note */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 text-xs text-primary mb-1">
                    <TrendingUp className="w-3 h-3" />
                    {t("Real Data Backtest", "真实数据回测")}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t(
                      "All price data fetched from OKX V5 Official API in real-time. Results are based on historical data and do not guarantee future performance.",
                      "所有价格数据实时从OKX V5官方API获取。结果基于历史数据，不保证未来表现。"
                    )}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {t("Configure parameters and run backtest to see results", "配置参数并运行回测查看结果")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("Uses real OKX V5 API historical candle data", "使用OKX V5 API真实历史K线数据")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
