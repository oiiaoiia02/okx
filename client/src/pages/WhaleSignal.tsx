import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Fish, ChevronRight, TrendingUp, TrendingDown, Copy, Check, Bell, BellOff, ArrowRight } from "lucide-react";

interface WhaleAlert {
  id: string; wallet: string; action: "buy" | "sell"; token: string; amount: string; usdValue: string; ts: number; chain: string;
}

const MOCK_ALERTS: WhaleAlert[] = [
  { id: "1", wallet: "0x28C6...9e3F", action: "buy", token: "BTC", amount: "125 BTC", usdValue: "$10.9M", ts: Date.now() - 120000, chain: "ETH" },
  { id: "2", wallet: "0x7a16...4b2D", action: "sell", token: "ETH", amount: "8,500 ETH", usdValue: "$29.6M", ts: Date.now() - 300000, chain: "ETH" },
  { id: "3", wallet: "0xDef1...8c7A", action: "buy", token: "SOL", amount: "200,000 SOL", usdValue: "$28.4M", ts: Date.now() - 600000, chain: "SOL" },
  { id: "4", wallet: "0x3Fc9...1dE5", action: "buy", token: "ETH", amount: "5,200 ETH", usdValue: "$18.1M", ts: Date.now() - 900000, chain: "ETH" },
  { id: "5", wallet: "0xB847...6fC2", action: "sell", token: "BTC", amount: "50 BTC", usdValue: "$4.4M", ts: Date.now() - 1200000, chain: "BTC" },
  { id: "6", wallet: "0x9A23...3eD1", action: "buy", token: "DOGE", amount: "50M DOGE", usdValue: "$9.1M", ts: Date.now() - 1800000, chain: "ETH" },
  { id: "7", wallet: "0xF1c8...7bA4", action: "buy", token: "AVAX", amount: "350,000 AVAX", usdValue: "$12.3M", ts: Date.now() - 2400000, chain: "AVAX" },
];

export default function WhaleSignal() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<WhaleAlert[]>(MOCK_ALERTS);
  const [notifications, setNotifications] = useState(true);
  const [copiedTrades, setCopiedTrades] = useState<Set<string>>(new Set());
  const [newAlert, setNewAlert] = useState<WhaleAlert | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const tokens = ["BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "UNI"];
      const actions: ("buy" | "sell")[] = ["buy", "sell"];
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const usdVal = (Math.random() * 50 + 1).toFixed(1);
      const alert: WhaleAlert = {
        id: Date.now().toString(),
        wallet: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
        action,
        token,
        amount: `${(Math.random() * 10000).toFixed(0)} ${token}`,
        usdValue: `$${usdVal}M`,
        ts: Date.now(),
        chain: token === "SOL" ? "SOL" : "ETH",
      };
      setNewAlert(alert);
      setAlerts((prev) => [alert, ...prev.slice(0, 19)]);
      setTimeout(() => setNewAlert(null), 3000);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
              <p className="text-muted-foreground">{t("Track whale wallet movements and copy trades with one click.", "追踪巨鲸钱包动向，一键跟单。")}</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                notifications ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground border border-border/50 hover:bg-accent/50"
              }`}
            >
              {notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {notifications ? t("Alerts On", "警报开启") : t("Alerts Off", "警报关闭")}
            </button>
          </div>
        </motion.div>

        {/* New Alert Toast */}
        <AnimatePresence>
          {newAlert && notifications && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 right-4 z-50 glass-card p-4 border-l-2 border-primary max-w-sm"
            >
              <div className="flex items-center gap-2 text-sm">
                <Fish className="w-4 h-4 text-primary" />
                <span className="font-medium">{t("New Whale Alert!", "新巨鲸警报!")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {newAlert.wallet} {newAlert.action === "buy" ? t("bought", "买入") : t("sold", "卖出")} {newAlert.amount} ({newAlert.usdValue})
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("Active Whales", "活跃巨鲸"), value: "127", color: "#22c55e" },
            { label: t("24h Buy Volume", "24h买入量"), value: "$847M", color: "#22c55e" },
            { label: t("24h Sell Volume", "24h卖出量"), value: "$623M", color: "#ef4444" },
            { label: t("Net Flow", "净流入"), value: "+$224M", color: "#22c55e" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Alert Feed */}
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card p-4 flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                alert.action === "buy" ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                {alert.action === "buy" ? <TrendingUp className="w-5 h-5 text-green-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{alert.wallet}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    alert.action === "buy" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {alert.action.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{alert.chain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{alert.amount}</span>
                  <span className="text-xs text-muted-foreground">({alert.usdValue})</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{timeAgo(alert.ts)}</span>
                <button
                  onClick={() => copyTrade(alert.id)}
                  disabled={copiedTrades.has(alert.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copiedTrades.has(alert.id)
                      ? "bg-green-500/10 text-green-400"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {copiedTrades.has(alert.id) ? (
                    <><Check className="w-3 h-3" /> {t("Copied", "已跟单")}</>
                  ) : (
                    <><ArrowRight className="w-3 h-3" /> {t("Copy Trade", "跟单")}</>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
