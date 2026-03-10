import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Monitor, ChevronRight, ToggleLeft, ToggleRight, TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3, Activity } from "lucide-react";

interface SimTrade {
  id: string; pair: string; side: "buy" | "sell"; price: number; size: number;
  pnl: number; ts: number;
}

export default function SimulationPanel() {
  const { t } = useLanguage();
  const [isLive, setIsLive] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [trades, setTrades] = useState<SimTrade[]>(() => {
    const saved = localStorage.getItem("neuro-link-sim-trades");
    return saved ? JSON.parse(saved) : [
      { id: "1", pair: "BTC-USDT", side: "buy", price: 86500, size: 0.1, pnl: 93.25, ts: Date.now() - 3600000 },
      { id: "2", pair: "ETH-USDT", side: "buy", price: 3420, size: 2, pnl: 134.60, ts: Date.now() - 7200000 },
      { id: "3", pair: "SOL-USDT", side: "sell", price: 142.5, size: 50, pnl: -45.00, ts: Date.now() - 10800000 },
      { id: "4", pair: "BTC-USDT", side: "buy", price: 87100, size: 0.05, pnl: 16.63, ts: Date.now() - 14400000 },
      { id: "5", pair: "DOGE-USDT", side: "buy", price: 0.182, size: 10000, pnl: 80.00, ts: Date.now() - 18000000 },
      { id: "6", pair: "ETH-USDT", side: "sell", price: 3510, size: 1.5, pnl: -67.50, ts: Date.now() - 21600000 },
      { id: "7", pair: "AVAX-USDT", side: "buy", price: 35.2, size: 100, pnl: 120.00, ts: Date.now() - 25200000 },
    ];
  });

  useEffect(() => {
    localStorage.setItem("neuro-link-sim-trades", JSON.stringify(trades));
  }, [trades]);

  const toggleMode = () => {
    if (!isLive) {
      setShowWarning(true);
    } else {
      setIsLive(false);
    }
  };

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const winTrades = trades.filter((t) => t.pnl > 0);
  const winRate = trades.length > 0 ? ((winTrades.length / trades.length) * 100).toFixed(1) : "0";
  const avgPnl = trades.length > 0 ? (totalPnl / trades.length).toFixed(2) : "0";

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Monitor className="w-4 h-4" />
            <span>{t("Tools", "工具")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Simulation", "模拟盘")}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("Simulation Panel", "模拟盘面板")}</h1>
              <p className="text-muted-foreground">{t("Demo mode trading with simulated P&L tracking.", "演示模式交易，模拟盈亏追踪。")}</p>
            </div>
            <button
              onClick={toggleMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isLive ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
              }`}
            >
              {isLive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              {isLive ? t("LIVE MODE", "实盘模式") : t("DEMO MODE", "模拟模式")}
            </button>
          </div>
        </motion.div>

        {/* Warning Dialog */}
        {showWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowWarning(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-400">{t("Switch to Live Mode?", "切换到实盘模式？")}</h3>
                  <p className="text-xs text-muted-foreground">{t("This will use real funds", "这将使用真实资金")}</p>
                </div>
              </div>
              <p className="text-sm text-foreground/80 mb-4">
                {t("Warning: Live mode will execute real trades with real funds. Make sure you understand the risks. API keys with trade permission are required.", "警告：实盘模式将使用真实资金执行真实交易。请确保你了解风险。需要有交易权限的API密钥。")}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowWarning(false)} className="flex-1 px-4 py-2 rounded-lg border border-border/50 text-sm font-medium hover:bg-accent/50 transition-colors">
                  {t("Stay in Demo", "留在模拟")}
                </button>
                <button onClick={() => { setIsLive(true); setShowWarning(false); }} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                  {t("Switch to Live", "切换实盘")}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("Total P&L", "总盈亏")}</span>
            </div>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("Win Rate", "胜率")}</span>
            </div>
            <p className="text-2xl font-bold">{winRate}%</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("Avg P&L", "平均盈亏")}</span>
            </div>
            <p className={`text-2xl font-bold ${Number(avgPnl) >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${avgPnl}
            </p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t("Total Trades", "总交易数")}</span>
            </div>
            <p className="text-2xl font-bold">{trades.length}</p>
          </div>
        </div>

        {/* Trade History */}
        <h2 className="text-lg font-semibold mb-4">{t("Simulation History", "模拟交易历史")}</h2>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Pair", "交易对")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Side", "方向")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("Price", "价格")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("Size", "数量")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">P&L</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{trade.pair}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      trade.side === "buy" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono">${trade.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono">{trade.size}</td>
                  <td className={`px-4 py-3 text-right text-sm font-mono font-medium ${trade.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
