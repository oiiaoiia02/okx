import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Zap, Bell } from "lucide-react";

interface Notification {
  id: string; type: "price" | "trade" | "alert"; title: string; subtitle: string; icon: "up" | "down" | "zap" | "bell";
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "price", title: "BTC +2.3%", subtitle: "$87,432", icon: "up" },
  { id: "2", type: "trade", title: "Order Filled", subtitle: "0.1 BTC @ $87,100", icon: "zap" },
  { id: "3", type: "alert", title: "Whale Alert", subtitle: "125 BTC bought", icon: "bell" },
  { id: "4", type: "price", title: "ETH -0.8%", subtitle: "$3,487", icon: "down" },
  { id: "5", type: "trade", title: "Grid Bot", subtitle: "2 orders filled", icon: "zap" },
];

export default function DynamicIsland() {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      const notif = DEMO_NOTIFICATIONS[idx % DEMO_NOTIFICATIONS.length];
      setNotification(notif);
      setExpanded(true);
      setTimeout(() => setExpanded(false), 2500);
      setTimeout(() => setNotification(null), 3000);
      idx++;
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (icon: string) => {
    switch (icon) {
      case "up": return <TrendingUp className="w-3.5 h-3.5 text-green-400" />;
      case "down": return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
      case "zap": return <Zap className="w-3.5 h-3.5 text-primary" />;
      case "bell": return <Bell className="w-3.5 h-3.5 text-yellow-400" />;
      default: return <Activity className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[90]">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ width: 120, opacity: 0, y: -10 }}
            animate={{
              width: expanded ? 260 : 120,
              opacity: 1,
              y: 0,
            }}
            exit={{ width: 120, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="h-9 bg-black/90 backdrop-blur-xl rounded-full border border-white/10 flex items-center px-3 gap-2 overflow-hidden cursor-pointer shadow-lg"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {getIcon(notification.icon)}
              <AnimatePresence mode="wait">
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    className="flex items-center gap-2 min-w-0"
                  >
                    <span className="text-xs font-medium text-white whitespace-nowrap">{notification.title}</span>
                    <span className="text-[10px] text-white/50 whitespace-nowrap">{notification.subtitle}</span>
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
