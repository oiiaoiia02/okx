import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTicker, formatPrice, formatVolume } from "@/services/okxApi";
import {
  Monitor, ChevronRight, Wallet, TrendingUp, TrendingDown, RefreshCw,
  Trash2, Download, Plus, X, Activity, Clock, DollarSign, BarChart3,
  ToggleLeft, ToggleRight, AlertTriangle,
} from "lucide-react";
import SafetyModal from "@/components/SafetyModal";

interface SimTrade {
  id: string;
  instId: string;
  side: "buy" | "sell";
  price: number;
  size: number;
  total: number;
  timestamp: number;
  status: "filled";
  mode: "demo" | "live";
}

interface SimPosition {
  instId: string;
  avgCost: number;
  size: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
}

const INITIAL_BALANCE = 100000;

export default function SimulationPanel() {
  const { t } = useLanguage();
  const [isLive, setIsLive] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [balance, setBalance] = useState<number>(() => {
    return parseFloat(localStorage.getItem("okx-sim-balance") || String(INITIAL_BALANCE));
  });
  const [trades, setTrades] = useState<SimTrade[]>(() => {
    return JSON.parse(localStorage.getItem("okx-sim-trades") || "[]");
  });
  const [positions, setPositions] = useState<SimPosition[]>([]);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [formInstId, setFormInstId] = useState("BTC-USDT");
  const [formSide, setFormSide] = useState<"buy" | "sell">("buy");
  const [formSize, setFormSize] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Persist
  useEffect(() => {
    localStorage.setItem("okx-sim-balance", String(balance));
  }, [balance]);
  useEffect(() => {
    localStorage.setItem("okx-sim-trades", JSON.stringify(trades));
  }, [trades]);

  // Calculate positions from trades
  const calcPositions = useCallback(async () => {
    const posMap = new Map<string, { totalCost: number; totalSize: number }>();
    for (const trade of trades) {
      if (trade.mode === "live") continue; // Only track demo positions
      const existing = posMap.get(trade.instId) || { totalCost: 0, totalSize: 0 };
      if (trade.side === "buy") {
        existing.totalCost += trade.price * trade.size;
        existing.totalSize += trade.size;
      } else {
        existing.totalCost -= trade.price * trade.size;
        existing.totalSize -= trade.size;
      }
      posMap.set(trade.instId, existing);
    }

    const newPositions: SimPosition[] = [];
    for (const [instId, pos] of posMap) {
      if (pos.totalSize <= 0.000001) continue;
      const avgCost = pos.totalCost / pos.totalSize;
      try {
        const ticker = await getTicker(instId);
        const curPrice = parseFloat(ticker.last);
        const pnl = (curPrice - avgCost) * pos.totalSize;
        const pnlPct = ((curPrice - avgCost) / avgCost) * 100;
        newPositions.push({ instId, avgCost, size: pos.totalSize, currentPrice: curPrice, pnl, pnlPct });
      } catch {
        newPositions.push({ instId, avgCost, size: pos.totalSize, currentPrice: avgCost, pnl: 0, pnlPct: 0 });
      }
    }
    setPositions(newPositions);
  }, [trades]);

  useEffect(() => { calcPositions(); }, [calcPositions]);

  // Fetch current price for trade form
  const fetchPrice = async () => {
    if (!formInstId) return;
    setLoadingPrice(true);
    try {
      const ticker = await getTicker(formInstId);
      setCurrentPrice(parseFloat(ticker.last));
    } catch {
      setCurrentPrice(0);
    }
    setLoadingPrice(false);
  };

  useEffect(() => {
    if (showTradeForm) fetchPrice();
  }, [showTradeForm, formInstId]);

  // Execute simulated trade
  const executeTrade = async () => {
    if (!formSize || !currentPrice) return;
    setExecuting(true);
    try {
      const ticker = await getTicker(formInstId);
      const price = parseFloat(ticker.last);
      setCurrentPrice(price);

      const size = parseFloat(formSize);
      const total = price * size;

      if (formSide === "buy" && total > balance) {
        alert(t("Insufficient balance!", "余额不足！"));
        setExecuting(false);
        return;
      }

      const trade: SimTrade = {
        id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        instId: formInstId,
        side: formSide,
        price,
        size,
        total,
        timestamp: Date.now(),
        status: "filled",
        mode: "demo",
      };

      setTrades((prev) => [trade, ...prev]);
      setBalance((prev) => formSide === "buy" ? prev - total : prev + total);
      setShowTradeForm(false);
      setFormSize("");
    } catch (err) {
      alert("Failed to fetch price");
    }
    setExecuting(false);
  };

  // Toggle live mode
  const toggleMode = () => {
    if (!isLive) {
      setShowSafety(true);
    } else {
      setIsLive(false);
    }
  };

  // Reset
  const resetSimulation = () => {
    if (confirm(t("Reset all simulation data?", "重置所有模拟数据？"))) {
      setBalance(INITIAL_BALANCE);
      setTrades([]);
      setPositions([]);
      localStorage.removeItem("okx-sim-balance");
      localStorage.removeItem("okx-sim-trades");
    }
  };

  // Export trades
  const exportTrades = () => {
    const data = { balance, trades, positions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okx-sim-trades-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPnL = positions.reduce((s, p) => s + p.pnl, 0);
  const totalValue = balance + positions.reduce((s, p) => s + p.currentPrice * p.size, 0);
  const winTrades = trades.filter((t) => {
    // For completed sell trades, check if profitable
    return t.side === "sell";
  });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        {/* Safety Modal */}
        <SafetyModal
          open={showSafety}
          onConfirm={() => { setIsLive(true); setShowSafety(false); }}
          onCancel={() => setShowSafety(false)}
          tool="mode_switch"
          params={{ mode: "live", warning: "Real funds will be used" }}
        />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Monitor className="w-4 h-4" />
            <span>{t("Tools", "实用工具")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Simulation Panel", "模拟盘")}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("Simulation Panel", "模拟盘")}</h1>
              <p className="text-muted-foreground">
                {t("Practice trading with virtual funds using real OKX prices.", "使用OKX真实价格和虚拟资金练习交易。")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isLive ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                }`}
              >
                {isLive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {isLive ? t("LIVE MODE", "实盘模式") : t("DEMO MODE", "模拟模式")}
              </button>
              <button onClick={exportTrades} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground" title="Export">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={resetSimulation} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-red-400" title="Reset">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <DollarSign className="w-3 h-3" />
              {t("Available Balance", "可用余额")}
            </div>
            <p className="text-xl font-bold font-mono">${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Wallet className="w-3 h-3" />
              {t("Total Value", "总价值")}
            </div>
            <p className="text-xl font-bold font-mono">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {totalPnL >= 0 ? <TrendingUp className="w-3 h-3 text-green-400" /> : <TrendingDown className="w-3 h-3 text-red-400" />}
              {t("Unrealized PnL", "未实现盈亏")}
            </div>
            <p className={`text-xl font-bold font-mono ${totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
              {totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <BarChart3 className="w-3 h-3" />
              {t("Total Trades", "总交易数")}
            </div>
            <p className="text-xl font-bold font-mono">{trades.length}</p>
          </motion.div>
        </div>

        {/* Trade Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowTradeForm(!showTradeForm)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {t("New Simulated Trade", "新建模拟交易")}
          </button>
        </div>

        {/* Trade Form */}
        <AnimatePresence>
          {showTradeForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{t("Place Simulated Order", "下模拟单")}</h3>
                  <button onClick={() => setShowTradeForm(false)} className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t("Pair", "交易对")}</label>
                    <input
                      value={formInstId}
                      onChange={(e) => setFormInstId(e.target.value.toUpperCase())}
                      placeholder="BTC-USDT"
                      className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t("Side", "方向")}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormSide("buy")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formSide === "buy" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "border border-border/50 text-muted-foreground"
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => setFormSide("sell")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formSide === "sell" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "border border-border/50 text-muted-foreground"
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t("Size", "数量")}</label>
                    <input
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      placeholder="0.01"
                      type="number"
                      step="any"
                      className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t("Current Price (OKX)", "当前价格 (OKX)")}
                      <button onClick={fetchPrice} className="ml-2 text-primary">
                        <RefreshCw className={`w-3 h-3 inline ${loadingPrice ? "animate-spin" : ""}`} />
                      </button>
                    </label>
                    <div className="px-3 py-2 rounded-lg border border-border/50 bg-accent/30 text-sm font-mono">
                      {currentPrice ? `$${formatPrice(currentPrice)}` : "Loading..."}
                    </div>
                  </div>
                </div>
                {currentPrice > 0 && formSize && (
                  <div className="mt-4 p-3 rounded-lg bg-accent/30 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t("Total", "总额")}</span>
                    <span className="text-sm font-mono font-semibold">
                      ${(currentPrice * parseFloat(formSize || "0")).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <button
                  onClick={executeTrade}
                  disabled={executing || !currentPrice || !formSize}
                  className={`mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-30 ${
                    formSide === "buy"
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {executing ? t("Fetching OKX price...", "获取OKX价格中...") : `${t("Simulate", "模拟")} ${formSide.toUpperCase()}`}
                </button>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {t("Uses real OKX V5 API prices. No real funds involved.", "使用OKX V5 API真实价格。不涉及真实资金。")}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Positions */}
        {positions.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border/50">
              <h3 className="font-semibold text-sm">{t("Open Positions", "持仓")}</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-2 text-xs text-muted-foreground">{t("Pair", "交易对")}</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground">{t("Size", "数量")}</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground">{t("Avg Cost", "均价")}</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground">{t("Current", "现价")}</th>
                  <th className="text-right px-4 py-2 text-xs text-muted-foreground">PnL</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.instId} className="border-b border-border/30 hover:bg-accent/30">
                    <td className="px-4 py-3 font-mono text-sm font-medium">{pos.instId}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">{pos.size.toFixed(6)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">${formatPrice(pos.avgCost)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">${formatPrice(pos.currentPrice)}</td>
                    <td className={`px-4 py-3 text-right font-mono text-sm font-medium ${pos.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)} ({pos.pnlPct >= 0 ? "+" : ""}{pos.pnlPct.toFixed(2)}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Trade History */}
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-semibold text-sm">{t("Trade History", "交易记录")} ({trades.length})</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-primary">
              <Activity className="w-3 h-3" />
              {t("Prices from OKX V5 API", "价格来自OKX V5 API")}
            </div>
          </div>
          {trades.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Monitor className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("No trades yet. Start by placing a simulated order above.", "暂无交易。点击上方按钮开始模拟交易。")}</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">{t("Time", "时间")}</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">{t("Pair", "交易对")}</th>
                    <th className="text-left px-4 py-2 text-xs text-muted-foreground">{t("Side", "方向")}</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">{t("Price", "价格")}</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">{t("Size", "数量")}</th>
                    <th className="text-right px-4 py-2 text-xs text-muted-foreground">{t("Total", "总额")}</th>
                    <th className="text-center px-4 py-2 text-xs text-muted-foreground">{t("Mode", "模式")}</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} className="border-b border-border/30 hover:bg-accent/30">
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 font-mono text-sm">{trade.instId}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                          trade.side === "buy" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-sm">${formatPrice(trade.price)}</td>
                      <td className="px-4 py-2 text-right font-mono text-sm">{trade.size.toFixed(6)}</td>
                      <td className="px-4 py-2 text-right font-mono text-sm">${trade.total.toFixed(2)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          trade.mode === "demo" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {trade.mode.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              {t(
                "All prices fetched from OKX V5 Official API at trade execution time. Virtual balance starts at $100,000.",
                "所有价格在交易执行时从OKX V5官方API获取。虚拟余额初始为 $100,000。"
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
