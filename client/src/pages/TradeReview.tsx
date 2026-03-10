import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";

interface Trade {
  id: string; instId: string; side: "buy" | "sell"; sz: string; px: string; pnl: number; fee: number; ts: number; type: string;
}

const MOCK_TRADES: Trade[] = [
  { id: "1", instId: "BTC-USDT", side: "buy", sz: "0.05", px: "85200.00", pnl: 234.50, fee: -4.26, ts: Date.now() - 86400000 * 1, type: "spot" },
  { id: "2", instId: "ETH-USDT", side: "sell", sz: "2.0", px: "3480.00", pnl: -89.20, fee: -3.48, ts: Date.now() - 86400000 * 2, type: "spot" },
  { id: "3", instId: "BTC-USDT-SWAP", side: "buy", sz: "1", px: "86100.00", pnl: 567.80, fee: -8.61, ts: Date.now() - 86400000 * 3, type: "swap" },
  { id: "4", instId: "SOL-USDT", side: "buy", sz: "50", px: "142.30", pnl: 355.00, fee: -7.12, ts: Date.now() - 86400000 * 4, type: "spot" },
  { id: "5", instId: "ETH-USDT-SWAP", side: "sell", sz: "3", px: "3520.00", pnl: -156.40, fee: -10.56, ts: Date.now() - 86400000 * 5, type: "swap" },
  { id: "6", instId: "BTC-USDT", side: "buy", sz: "0.02", px: "87000.00", pnl: 44.00, fee: -1.74, ts: Date.now() - 86400000 * 6, type: "spot" },
  { id: "7", instId: "DOGE-USDT", side: "buy", sz: "10000", px: "0.182", pnl: 120.00, fee: -1.82, ts: Date.now() - 86400000 * 7, type: "spot" },
  { id: "8", instId: "BTC-USDT-SWAP", side: "sell", sz: "2", px: "86500.00", pnl: -210.30, fee: -17.30, ts: Date.now() - 86400000 * 8, type: "swap" },
  { id: "9", instId: "ETH-USDT", side: "buy", sz: "5.0", px: "3400.00", pnl: 425.00, fee: -17.00, ts: Date.now() - 86400000 * 9, type: "spot" },
  { id: "10", instId: "SOL-USDT-SWAP", side: "buy", sz: "10", px: "138.50", pnl: 190.50, fee: -13.85, ts: Date.now() - 86400000 * 10, type: "swap" },
];

export default function TradeReview() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<"all" | "spot" | "swap">("all");

  const trades = useMemo(() => {
    const stored = localStorage.getItem("neuro-link-trades");
    const base = stored ? JSON.parse(stored) : MOCK_TRADES;
    if (filter === "all") return base;
    return base.filter((trade: Trade) => trade.type === filter);
  }, [filter]);

  const stats = useMemo(() => {
    const wins = trades.filter((t: Trade) => t.pnl > 0);
    const losses = trades.filter((t: Trade) => t.pnl < 0);
    const totalPnl = trades.reduce((sum: number, t: Trade) => sum + t.pnl, 0);
    const totalFees = trades.reduce((sum: number, t: Trade) => sum + t.fee, 0);
    const winRate = trades.length > 0 ? (wins.length / trades.length * 100) : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s: number, t: Trade) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s: number, t: Trade) => s + t.pnl, 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;
    // Simplified Sharpe
    const returns = trades.map((t: Trade) => t.pnl);
    const mean = returns.length > 0 ? returns.reduce((a: number, b: number) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((s: number, r: number) => s + (r - mean) ** 2, 0) / returns.length : 0;
    const sharpe = variance > 0 ? (mean / Math.sqrt(variance)) * Math.sqrt(252) : 0;
    return { totalPnl, totalFees, winRate, trades: trades.length, wins: wins.length, losses: losses.length, avgWin, avgLoss, profitFactor, sharpe };
  }, [trades]);

  // Equity curve
  const equityCurve = useMemo(() => {
    let equity = 10000;
    return trades.slice().reverse().map((t: Trade) => {
      equity += t.pnl;
      return { ts: t.ts, equity };
    });
  }, [trades]);

  const EquityChart = () => {
    if (equityCurve.length === 0) return null;
    const min = Math.min(...equityCurve.map((p: any) => p.equity));
    const max = Math.max(...equityCurve.map((p: any) => p.equity));
    const range = max - min || 1;
    const w = 600; const h = 150;
    const step = w / Math.max(equityCurve.length - 1, 1);
    const points = equityCurve.map((p: any, i: number) => `${i * step},${h - ((p.equity - min) / range) * h}`).join(" ");
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
          <p className="text-muted-foreground">{t("Full lifecycle trade analysis with win rate, Sharpe ratio, and equity curve.", "完整交易生命周期分析，包含胜率、夏普比率和权益曲线。")}</p>
        </motion.div>

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
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? t("All", "全部") : f.toUpperCase()}
            </button>
          ))}
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
              {trades.map((trade: Trade, i: number) => (
                <motion.tr key={trade.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
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
      </div>
    </div>
  );
}
