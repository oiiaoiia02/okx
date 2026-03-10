import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, AlertTriangle, X } from "lucide-react";
import { getTicker, type OKXTicker } from "@/services/okxApi";

interface Notification {
  id: string;
  type: "price" | "whale" | "system";
  title: string;
  subtitle: string;
  icon: "up" | "down" | "zap" | "whale";
}

function tickerToNotif(ticker: OKXTicker): Notification {
  const last = parseFloat(ticker.last);
  const open = parseFloat(ticker.open24h);
  const change = open > 0 ? ((last - open) / open) * 100 : 0;
  const sym = ticker.instId.split("-")[0];
  const volB = parseFloat(ticker.volCcy24h) / 1e9;
  const isWhale = volB > 0.5;

  if (isWhale && Math.abs(change) > 2) {
    return {
      id: `whale-${ticker.instId}-${ticker.ts}`,
      type: "whale",
      title: `${sym} Whale Move`,
      subtitle: `${change >= 0 ? "+" : ""}${change.toFixed(1)}% · Vol $${volB.toFixed(1)}B`,
      icon: "whale",
    };
  }
  return {
    id: `price-${ticker.instId}-${ticker.ts}`,
    type: "price",
    title: `${sym} ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    subtitle: `$${last.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    icon: change >= 0 ? "up" : "down",
  };
}

const WATCH_PAIRS = ["BTC-USDT", "ETH-USDT", "SOL-USDT"];

export default function DynamicIsland() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [current, setCurrent] = useState<Notification | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const idxRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const results: Notification[] = [];
    for (const pair of WATCH_PAIRS) {
      try {
        const t = await getTicker(pair);
        results.push(tickerToNotif(t));
      } catch { /* skip */ }
    }
    if (results.length > 0) setNotifications(results);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    if (dismissed || notifications.length === 0) return;

    const showNext = () => {
      const n = notifications[idxRef.current % notifications.length];
      setCurrent(n);
      setExpanded(true);
      setTimeout(() => setExpanded(false), 5000);
      setTimeout(() => setCurrent(null), 6000);
      idxRef.current++;
    };

    showNext();
    timerRef.current = setInterval(showNext, 8000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [notifications, dismissed]);

  const getIcon = (icon: string) => {
    switch (icon) {
      case "up": return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
      case "down": return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
      case "whale": return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
      default: return <Zap className="w-3.5 h-3.5 text-primary" />;
    }
  };

  if (dismissed) return null;

  return (
    <div className="fixed top-[18px] right-4 z-[80]">
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ width: 40, opacity: 0, x: 20, scale: 0.8 }}
            animate={{ width: expanded ? 290 : 40, opacity: 1, x: 0, scale: 1 }}
            exit={{ width: 40, opacity: 0, x: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="h-[34px] bg-black/90 backdrop-blur-xl rounded-full border border-white/10 flex items-center px-2.5 gap-2 overflow-hidden cursor-pointer shadow-lg shadow-black/30"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {getIcon(current.icon)}
              <AnimatePresence mode="wait">
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <span className="text-[11px] font-semibold text-white whitespace-nowrap">
                      {current.title}
                    </span>
                    <span className="text-[10px] text-white/50 whitespace-nowrap">
                      {current.subtitle}
                    </span>
                    <span className="text-[8px] text-primary/60 whitespace-nowrap">OKX</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                      className="ml-0.5 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
