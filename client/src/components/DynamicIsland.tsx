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
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      // Auto-collapse after 6s, then hide at 8s
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setExpanded(false), 6000);
      setTimeout(() => setCurrent(null), 8000);
      idxRef.current++;
    };

    showNext();
    timerRef.current = setInterval(showNext, 10000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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

  const getAccentColor = (icon: string) => {
    switch (icon) {
      case "up": return "rgba(74, 222, 128, 0.15)";
      case "down": return "rgba(248, 113, 113, 0.15)";
      case "whale": return "rgba(250, 204, 21, 0.15)";
      default: return "rgba(0, 230, 138, 0.15)";
    }
  };

  if (dismissed) return null;

  return (
    <div className="fixed top-[78px] right-5 z-[60] pointer-events-auto">
      <AnimatePresence>
        {current && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="relative overflow-hidden cursor-pointer"
            onClick={() => setExpanded(!expanded)}
            style={{
              borderRadius: expanded ? "20px" : "22px",
            }}
          >
            {/* Glassmorphism background */}
            <div
              className="absolute inset-0"
              style={{
                background: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
              }}
            />
            {/* Subtle accent glow */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse at 30% 50%, ${getAccentColor(current.icon)}, transparent 70%)`,
              }}
            />
            {/* Border */}
            <div
              className="absolute inset-0 rounded-[inherit]"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            />

            {/* Content */}
            <motion.div
              layout
              className="relative flex items-center gap-2.5 px-4 py-2.5"
              style={{ minWidth: expanded ? 260 : 42 }}
            >
              {/* Icon with pulse dot */}
              <div className="relative flex-shrink-0">
                {getIcon(current.icon)}
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>

              <AnimatePresence mode="wait">
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2.5 min-w-0 overflow-hidden"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-[600] text-white whitespace-nowrap leading-tight">
                        {current.title}
                      </span>
                      <span className="text-[10px] text-white/50 whitespace-nowrap leading-tight">
                        {current.subtitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[8px] text-primary/70 font-[600] tracking-[0.5px] uppercase">OKX</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                        className="p-0.5 rounded-full text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
