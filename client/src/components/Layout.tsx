import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sun, Moon, Globe, Menu, X, Zap, BarChart3, Cpu, Wallet,
  Eye, FlaskConical, Shield, History, Brain, BookOpen, Layers,
  ChevronDown, Terminal, Search, Sparkles, Fish, ShieldCheck,
  Share2, Monitor, Mic, Bot, MessageSquare, ExternalLink,
} from "lucide-react";

const navGroups = [
  {
    labelEn: "Core",
    labelZh: "核心集成",
    items: [
      { path: "/copilot", iconName: "Bot", labelEn: "AI Copilot", labelZh: "AI 助手" },
      { path: "/agent-trade-kit", iconName: "Cpu", labelEn: "Agent Trade Kit", labelZh: "Agent Trade Kit" },
      { path: "/mcp-visualizer", iconName: "Terminal", labelEn: "MCP Visualizer", labelZh: "MCP 可视化" },
      { path: "/agent-skills", iconName: "Zap", labelEn: "Agent Skills", labelZh: "Agent Skills" },
      { path: "/wallet", iconName: "Wallet", labelEn: "Wallet", labelZh: "钱包连接" },
    ],
  },
  {
    labelEn: "Tools",
    labelZh: "实用工具",
    items: [
      { path: "/token-monitor", iconName: "Eye", labelEn: "Token Monitor", labelZh: "代币监控" },
      { path: "/strategy-studio", iconName: "FlaskConical", labelEn: "Strategy Studio", labelZh: "策略实验室" },
      { path: "/risk-dashboard", iconName: "Shield", labelEn: "Risk Control", labelZh: "风控仪表盘" },
      { path: "/trade-review", iconName: "History", labelEn: "Trade Review", labelZh: "交易复盘" },
      { path: "/simulation", iconName: "Monitor", labelEn: "Simulation", labelZh: "模拟盘" },
    ],
  },
  {
    labelEn: "Advanced",
    labelZh: "高级功能",
    items: [
      { path: "/reasoning-chain", iconName: "Brain", labelEn: "Reasoning Chain", labelZh: "推理链" },
      { path: "/claw-prompt", iconName: "Sparkles", labelEn: "Claw Prompt", labelZh: "Claw Prompt" },
      { path: "/use-cases", iconName: "BookOpen", labelEn: "Use Cases", labelZh: "使用案例" },
      { path: "/whale-signal", iconName: "Fish", labelEn: "Whale Signal", labelZh: "巨鲸信号" },
      { path: "/onchain-os", iconName: "Layers", labelEn: "OnchainOS", labelZh: "OnchainOS" },
      { path: "/security-audit", iconName: "ShieldCheck", labelEn: "Security Audit", labelZh: "安全审计" },
      { path: "/share-to-x", iconName: "Share2", labelEn: "Share to X", labelZh: "分享到X" },
    ],
  },
];

const iconMap: Record<string, any> = {
  Cpu, Terminal, Zap, Wallet, Eye, FlaskConical, Shield, History, Brain,
  BookOpen, Layers, Sparkles, Fish, ShieldCheck, Share2, Monitor, Mic, Bot, MessageSquare,
};

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation — Quantum Style */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40">
        <div
          className="absolute inset-0"
          style={{
            background: theme === "dark"
              ? "rgba(6, 6, 10, 0.65)"
              : "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
          }}
        />
        <nav className="relative container flex items-center justify-between h-[68px]">
          {/* Logo — OKX icon + "OKX AI CORE" only, no subtitle */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-[34px] h-[34px] rounded-[10px] overflow-hidden flex items-center justify-center border border-border/30 group-hover:border-primary/30 transition-colors">
              <img
                src="/okx-logo.png"
                alt="OKX"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-[800] text-[15px] tracking-[0.8px] bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              OKX AI CORE
            </span>
          </Link>

          {/* Desktop Nav — Pill container style */}
          <div className="hidden lg:flex items-center gap-[2px] p-1 rounded-[10px] bg-card/30 border border-border/30">
            {navGroups.map((group) => (
              <div
                key={group.labelEn}
                className="relative"
                onMouseEnter={() => setActiveDropdown(group.labelEn)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 px-[18px] py-[7px] text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors rounded-[7px] hover:bg-card/50">
                  {t(group.labelEn, group.labelZh)}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {activeDropdown === group.labelEn && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-60 py-2 rounded-[14px] border border-border/40 shadow-2xl"
                      style={{
                        background: theme === "dark"
                          ? "rgba(12, 12, 18, 0.95)"
                          : "rgba(255, 255, 255, 0.98)",
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      {group.items.map((item) => {
                        const Icon = iconMap[item.iconName];
                        const isActive = location === item.path;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                              isActive
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                            }`}
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                            {t(item.labelEn, item.labelZh)}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-[6px] text-[11px] font-[600] text-muted-foreground hover:text-foreground border border-border/40 rounded-[8px] hover:bg-card/50 transition-colors tracking-[0.3px]"
            >
              {lang === "en" ? "中文" : "EN"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-[8px] border border-border/40 hover:bg-card/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-[8px] hover:bg-card/50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-[68px] bottom-0 w-72 border-l border-border/40 overflow-y-auto"
              style={{
                background: theme === "dark" ? "rgba(6, 6, 10, 0.98)" : "rgba(255, 255, 255, 0.98)",
              }}
            >
              <div className="p-5 space-y-7">
                {navGroups.map((group) => (
                  <div key={group.labelEn}>
                    <p className="text-[11px] font-[700] text-muted-foreground uppercase tracking-[3px] mb-3 px-3">
                      {t(group.labelEn, group.labelZh)}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = iconMap[item.iconName];
                        const isActive = location === item.path;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-colors ${
                              isActive
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                            }`}
                          >
                            {Icon && <Icon className="w-4 h-4" />}
                            {t(item.labelEn, item.labelZh)}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-border/40">
                  <button
                    onClick={toggleLang}
                    className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-muted-foreground hover:text-foreground w-full rounded-[10px] hover:bg-accent/30 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {lang === "en" ? "切换到中文" : "Switch to English"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-[68px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer — Quantum Style */}
      <footer className="border-t border-border/40 py-10 mt-20">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3 text-[13px] text-muted-foreground flex-wrap justify-center">
              <img src="/okx-logo.png" alt="OKX" className="w-5 h-5 rounded" />
              <span className="font-[800] text-foreground">OKX AI CORE</span>
              <span className="text-border">·</span>
              <span>Built by <strong className="text-foreground">小天才铭77Ouo</strong></span>
              <a
                href="https://x.com/chen1904o"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @Chen1904o
              </a>
              <span className="text-border">·</span>
              <a
                href="https://t.me/se77ouo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Telegram
              </a>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
              <span>{t("Simulation-first · Keys local only", "模拟优先 · 密钥本地存储")}</span>
              <span className="text-border">·</span>
              <span>MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
