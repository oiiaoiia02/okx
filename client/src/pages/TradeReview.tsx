import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Filter, Activity, Info } from "lucide-react";

interface Trade {
  id: string; instId: string; side: "buy" | "sell"; sz: string; px: string; pnl: number; fee: number; ts: number; type: string;
}

export default function TradeReview() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "spot" | "swap">("all");

  const trades = useMemo(() => {
    // Read from simulation panel localStorage
    const simTrades = localStorage.getItem("okx-sim-trades");
    const legacyTrades = localStorage.getItem("neuro-link-trades");
    let allTrades: Trade[] = [];

    if (simTrades) {
      try {
        const parsed = JSON.parse(simTrades);
        allTrades = parsed.map((t: any, i: number) => ({
          id: t.id || `sim-${i}`,
          instId: t.instId || t.pair || "BTC-USDT",
          side: t.side || "buy",
          sz: String(t.sz || t.amount || "0"),
          px: String(t.px || t.price || "0"),
          pnl: t.pnl || 0,
          fee: t.fee || -(parseFloat(String(t.px || 0)) * parseFloat(String(t.sz || 0)) * 0.001),
          ts: t.ts || t.timestamp || Date.now(),
          type: t.type || (t.instId?.includes("SWAP") ? "swap" : "spot"),
        }));
      } catch { /* skip */ }
    } else if (legacyTrades) {
      try { allTrades = JSON.parse(legacyTrades); } catch { /* skip */ }
    }

    if (filter === "all") return allTrades;
    return allTrades.filter((trade) => trade.type === filter);
  }, [filter]);

  const stats = useMemo(() => {
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length * 100) : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    const returns = trades.map((t) => t.pnl);
    const mean = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length : 0;
    const sharpe = variance > 0 ? (mean / Math.sqrt(variance)) * Math.sqrt(252) : 0;
    return { totalPnl, totalFees, winRate, trades: trades.length, wins: wins.length, losses: losses.length, avgWin, avgLoss, profitFactor, sharpe };
  }, [trades]);

  const equityCurve = useMemo(() => {
    let equity = 10000;
    return trades.slice().reverse().map((t) => { equity += t.pnl; return { ts: t.ts, equity }; });
  }, [trades]);

  const EquityChart = () => {
    if (equityCurve.length === 0) return null;
    const min = Math.min(...equityCurve.map((p) => p.equity));
    const max = Math.max(...equityCurve.map((p) => p.equity));
    const range = max - min || 1;
    const w = 600; const h = 150;
    const step = w / Math.max(equityCurve.length - 1, 1);
    const points = equityCurve.map((p, i) => `${i * step},${h - ((p.equity - min) / range) * h}`).join(" ");
    const positive = equityCurve[equityCurve.length - 1]?.equity >= 10000;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
            <stop offset="100%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#eqGrad)" points={`0,${h} ${points} ${w},${h}`} />
        <polyline fill="none" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth="2" points={points} />
      </svg>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            <span>{t("Tools", "实用工具")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Trade Review", "交易复盘")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Trade Review", "交易复盘")}</h1>
          <p className="text-muted-foreground">{t("Analyze your simulation trades with win rate, Sharpe ratio, and equity curve.", "分析你的模拟交易，包含胜率、夏普比率和权益曲线。")}</p>
        </motion.div>

        {trades.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t("No Trades Yet", "暂无交易记录")}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("Start trading in the Simulation Panel to see your trade history, performance metrics, and equity curve here.", "在模拟盘面板开始交易，即可在此查看交易历史、绩效指标和权益曲线。")}
            </p>
            <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-primary">
              <Info className="w-3 h-3" />
              {t("Data source: localStorage (okx-sim-trades)", "数据来源: localStorage (okx-sim-trades)")}
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: t("Total P&L", "总盈亏"), value: `${stats.totalPnl >= 0 ? "+" : ""}$${stats.totalPnl.toFixed(2)}`, color: stats.totalPnl >= 0 ? "#22c55e" : "#ef4444" },
                { label: t("Win Rate", "胜率"), value: `${stats.winRate.toFixed(1)}%`, color: stats.winRate >= 50 ? "#22c55e" : "#f59e0b" },
                { label: t("Sharpe Ratio", "夏普比率"), value: stats.sharpe.toFixed(2), color: stats.sharpe >= 1 ? "#22c55e" : "#f59e0b" },
                { label: t("Profit Factor", "盈亏比"), value: stats.profitFactor.toFixed(2), color: stats.profitFactor >= 1.5 ? "#22c55e" : "#f59e0b" },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
                  <p className="text-xs text-muted-foreground mb-2">{stat.label}</p>
                  <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Equity Curve */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-sm font-semibold mb-4">{t("Equity Curve", "权益曲线")}</h3>
              <EquityChart />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(["all", "spot", "swap"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {f === "all" ? t("All", "全部") : f.toUpperCase()}
                </button>
              ))}
              <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                <Activity className="w-3 h-3" /> {t("From simulation panel", "来自模拟盘")}
              </span>
            </div>

            {/* Trade List */}
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Pair", "交易对")}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Side", "方向")}</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("Size", "数量")}</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("Price", "价格")}</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">P&L</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">{t("Time", "时间")}</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <motion.tr key={trade.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono">{trade.instId}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${trade.side === "buy" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono">{trade.sz}</td>
                      <td className="px-4 py-3 text-right text-sm font-mono">${trade.px}</td>
                      <td className={`px-4 py-3 text-right text-sm font-medium ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {trade.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                        {new Date(trade.ts).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
