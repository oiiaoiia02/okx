import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Fish, ChevronRight, TrendingUp, TrendingDown, Bell, BellOff, ArrowRight, Check, Activity, RefreshCw, ExternalLink } from "lucide-react";
import { getTicker, formatPrice, formatVolume } from "@/services/okxApi";

interface WhaleAlert {
  id: string;
  instId: string;
  token: string;
  side: "buy" | "sell";
  price: number;
  volume: number;
  volumeUsd: number;
  ts: number;
  source: "OKX";
}

interface MarketStats {
  totalBuyVol: number;
  totalSellVol: number;
  netFlow: number;
  activeTokens: number;
}

const TRACKED_PAIRS = ["BTC-USDT", "ETH-USDT", "SOL-USDT", "DOGE-USDT", "AVAX-USDT", "LINK-USDT", "XRP-USDT", "ADA-USDT", "DOT-USDT", "MATIC-USDT"];

export default function WhaleSignal() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [notifications, setNotifications] = useState(true);
  const [newAlert, setNewAlert] = useState<WhaleAlert | null>(null);
  const [copiedTrades, setCopiedTrades] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<MarketStats>({ totalBuyVol: 0, totalSellVol: 0, netFlow: 0, activeTokens: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Fetch real OKX trade data and detect "whale" activity based on volume
  const fetchWhaleData = useCallback(async () => {
    try {
      const newAlerts: WhaleAlert[] = [];
      let totalBuy = 0;
      let totalSell = 0;
      let activeCount = 0;

      for (const instId of TRACKED_PAIRS) {
        try {
          // Fetch recent trades from OKX
          const res = await fetch(`https://www.okx.com/api/v5/market/trades?instId=${instId}&limit=50`);
          const json = await res.json();
          if (json.code !== "0" || !json.data) continue;

          const ticker = await getTicker(instId);
          const price = parseFloat(ticker.last);
          const token = instId.split("-")[0];

          // Aggregate trades to detect large volume
          let buyVol = 0;
          let sellVol = 0;

          for (const trade of json.data) {
            const sz = parseFloat(trade.sz);
            const tradeVal = sz * price;
            if (trade.side === "buy") {
              buyVol += tradeVal;
            } else {
              sellVol += tradeVal;
            }

            // Detect "whale" trades: > $50K for BTC/ETH, > $20K for others
            const threshold = ["BTC", "ETH"].includes(token) ? 50000 : 20000;
            if (tradeVal >= threshold) {
              newAlerts.push({
                id: `${trade.tradeId}-${instId}`,
                instId,
                token,
                side: trade.side as "buy" | "sell",
                price,
                volume: sz,
                volumeUsd: tradeVal,
                ts: parseInt(trade.ts),
                source: "OKX",
              });
            }
          }

          totalBuy += buyVol;
          totalSell += sellVol;
          if (buyVol + sellVol > 0) activeCount++;
        } catch {
          // Skip failed pairs
        }
      }

      // Sort by timestamp desc
      newAlerts.sort((a, b) => b.ts - a.ts);

      // Detect new alerts for notification
      if (alerts.length > 0 && newAlerts.length > 0) {
        const latestExisting = alerts[0]?.ts || 0;
        const brandNew = newAlerts.find((a) => a.ts > latestExisting);
        if (brandNew && notifications) {
          setNewAlert(brandNew);
          setTimeout(() => setNewAlert(null), 4000);
        }
      }

      setAlerts(newAlerts.slice(0, 30));
      setStats({
        totalBuyVol: totalBuy,
        totalSellVol: totalSell,
        netFlow: totalBuy - totalSell,
        activeTokens: activeCount,
      });
      setLastUpdate(Date.now());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [alerts, notifications]);

  useEffect(() => {
    fetchWhaleData();
    const interval = setInterval(fetchWhaleData, 12000); // Refresh every 12s
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  const copyTrade = (id: string) => {
    setCopiedTrades((prev) => new Set(prev).add(id));
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    return `${Math.floor(diff / 3600000)}h`;
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Fish className="w-4 h-4" />
            <span>{t("Advanced", "高级")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Whale Signal", "巨鲸信号")}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("Whale Signal Monitor", "巨鲸信号监控")}</h1>
              <p className="text-muted-foreground">
                {t("Real-time large trade detection from OKX V5 API. Tracks 10 major pairs.", "基于OKX V5 API的实时大额交易检测。追踪10个主流交易对。")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-primary px-2 py-1 rounded bg-primary/5">
                <Activity className="w-3 h-3" />
                {t("Data: OKX V5 API", "数据: OKX V5 API")}
              </div>
              <button onClick={() => setNotifications(!notifications)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${notifications ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground border border-border/50 hover:bg-accent/50"}`}>
                {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {notifications ? t("Alerts On", "警报开启") : t("Alerts Off", "警报关闭")}
              </button>
            </div>
          </div>
        </motion.div>

        {/* New Alert Toast */}
        <AnimatePresence>
          {newAlert && notifications && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-4 z-50 glass-card p-4 border-l-2 border-primary max-w-sm">
              <div className="flex items-center gap-2 text-sm">
                <Fish className="w-4 h-4 text-primary" />
                <span className="font-medium">{t("Whale Detected!", "检测到巨鲸!")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {newAlert.side === "buy" ? "BUY" : "SELL"} {newAlert.volume.toFixed(4)} {newAlert.token} (${newAlert.volumeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("Tracked Pairs", "追踪交易对")}</p>
            <p className="text-xl font-bold text-primary">{stats.activeTokens}/{TRACKED_PAIRS.length}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("Recent Buy Volume", "近期买入量")}</p>
            <p className="text-xl font-bold text-green-400">{formatVolume(stats.totalBuyVol)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("Recent Sell Volume", "近期卖出量")}</p>
            <p className="text-xl font-bold text-red-400">{formatVolume(stats.totalSellVol)}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{t("Net Flow", "净流入")}</p>
            <p className={`text-xl font-bold ${stats.netFlow >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.netFlow >= 0 ? "+" : ""}{formatVolume(Math.abs(stats.netFlow))}
            </p>
          </div>
        </div>

        {/* Alert Feed */}
        {loading ? (
          <div className="glass-card p-12 text-center">
            <RefreshCw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">{t("Scanning OKX trades for whale activity...", "正在扫描OKX交易检测巨鲸活动...")}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Fish className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{t("No whale trades detected in recent data. Threshold: $50K for BTC/ETH, $20K for others.", "近期数据中未检测到巨鲸交易。阈值：BTC/ETH $50K，其他 $20K。")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <motion.div key={alert.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="glass-card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.side === "buy" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {alert.side === "buy" ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium">{alert.instId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${alert.side === "buy" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {alert.side.toUpperCase()}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 text-primary">OKX</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{alert.volume.toFixed(4)} {alert.token}</span>
                    <span className="text-xs text-muted-foreground">@ ${formatPrice(alert.price)}</span>
                    <span className="text-xs font-medium text-primary">(${alert.volumeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{timeAgo(alert.ts)}</span>
                  <button onClick={() => copyTrade(alert.id)} disabled={copiedTrades.has(alert.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${copiedTrades.has(alert.id) ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary hover:bg-primary/20"}`}>
                    {copiedTrades.has(alert.id) ? (<><Check className="w-3 h-3" /> {t("Copied", "已跟单")}</>) : (<><ArrowRight className="w-3 h-3" /> {t("Copy Trade", "跟单")}</>)}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{t("Last updated", "最后更新")}: {new Date(lastUpdate).toLocaleTimeString()} | {t("Auto-refresh: 12s", "自动刷新: 12秒")}</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {t("All data from OKX V5 /market/trades API", "所有数据来自OKX V5 /market/trades API")}</span>
        </div>
      </div>
    </div>
  );
}
