import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search, Zap, BarChart3, Wrench, Brain, Wallet, Activity, FlaskConical,
  Shield, RotateCcw, Sparkles, BookOpen, Fish, Globe, Share2, Monitor,
  ShieldCheck, Terminal, ArrowRight
} from "lucide-react";

interface Command {
  id: string; nameEn: string; nameZh: string; path: string; icon: React.ElementType; category: string;
}

const COMMANDS: Command[] = [
  { id: "home", nameEn: "Home", nameZh: "首页", path: "/", icon: Zap, category: "Navigation" },
  { id: "agent-trade-kit", nameEn: "Agent Trade Kit", nameZh: "Agent Trade Kit", path: "/agent-trade-kit", icon: Wrench, category: "Core" },
  { id: "mcp-visualizer", nameEn: "MCP Visualizer", nameZh: "MCP 可视化", path: "/mcp-visualizer", icon: Terminal, category: "Core" },
  { id: "agent-skills", nameEn: "Agent Skills", nameZh: "Agent Skills", path: "/agent-skills", icon: Brain, category: "Core" },
  { id: "wallet", nameEn: "Wallet Connect", nameZh: "钱包连接", path: "/wallet", icon: Wallet, category: "Core" },
  { id: "token-monitor", nameEn: "Token Monitor", nameZh: "代币监控", path: "/token-monitor", icon: Activity, category: "Tools" },
  { id: "strategy-studio", nameEn: "Strategy Studio", nameZh: "策略实验室", path: "/strategy-studio", icon: FlaskConical, category: "Tools" },
  { id: "risk-dashboard", nameEn: "Risk Dashboard", nameZh: "风控仪表盘", path: "/risk-dashboard", icon: Shield, category: "Tools" },
  { id: "trade-review", nameEn: "Trade Review", nameZh: "交易复盘", path: "/trade-review", icon: RotateCcw, category: "Tools" },
  { id: "simulation", nameEn: "Simulation Panel", nameZh: "模拟盘", path: "/simulation", icon: Monitor, category: "Tools" },
  { id: "reasoning-chain", nameEn: "Reasoning Chain", nameZh: "推理链", path: "/reasoning-chain", icon: Brain, category: "Advanced" },
  { id: "claw-prompt", nameEn: "Claw Prompt Generator", nameZh: "Claw Prompt 生成器", path: "/claw-prompt", icon: Sparkles, category: "Advanced" },
  { id: "use-cases", nameEn: "Use Cases", nameZh: "使用案例", path: "/use-cases", icon: BookOpen, category: "Advanced" },
  { id: "whale-signal", nameEn: "Whale Signal", nameZh: "巨鲸信号", path: "/whale-signal", icon: Fish, category: "Advanced" },
  { id: "onchain-os", nameEn: "OnchainOS", nameZh: "OnchainOS", path: "/onchain-os", icon: Globe, category: "Advanced" },
  { id: "security-audit", nameEn: "Security Audit", nameZh: "安全审计", path: "/security-audit", icon: ShieldCheck, category: "Advanced" },
  { id: "share-to-x", nameEn: "Share to X", nameZh: "分享到X", path: "/share-to-x", icon: Share2, category: "Advanced" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
    setQuery("");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  const filtered = COMMANDS.filter((cmd) => {
    const q = query.toLowerCase();
    return cmd.nameEn.toLowerCase().includes(q) || cmd.nameZh.includes(q) || cmd.category.toLowerCase().includes(q);
  });

  const grouped = filtered.reduce<Record<string, Command[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const navigate = (path: string) => {
    setLocation(path);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="flex items-start justify-center pt-[15vh]">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg mx-4 glass-card overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Search commands...", "搜索命令...")}
                  className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                />
                <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground">ESC</kbd>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-2">
                {Object.entries(grouped).map(([category, cmds]) => (
                  <div key={category} className="mb-2">
                    <p className="text-[10px] text-muted-foreground font-medium px-2 py-1">{category}</p>
                    {cmds.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => navigate(cmd.path)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent/50 transition-colors text-left"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="flex-1">{t(cmd.nameEn, cmd.nameZh)}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">{t("No results found", "未找到结果")}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
