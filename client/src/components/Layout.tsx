import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sun, Moon, Globe, Menu, X, Zap, BarChart3, Cpu, Wallet,
  Eye, FlaskConical, Shield, History, Brain, BookOpen, Layers,
  ChevronDown, Terminal, Search, Sparkles, Fish, ShieldCheck,
  Share2, Monitor,
} from "lucide-react";

const navGroups = [
  {
    labelEn: "Core",
    labelZh: "核心集成",
    items: [
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
  BookOpen, Layers, Sparkles, Fish, ShieldCheck, Share2, Monitor,
};

export default function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50">
        <div
          className="absolute inset-0"
          style={{
            background: theme === "dark"
              ? "oklch(0.07 0.005 260 / 80%)"
              : "oklch(0.985 0.002 260 / 80%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        />
        <nav className="relative container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Neuro-Link
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navGroups.map((group) => (
              <div
                key={group.labelEn}
                className="relative"
                onMouseEnter={() => setActiveDropdown(group.labelEn)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent/50">
                  {t(group.labelEn, group.labelZh)}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <AnimatePresence>
                  {activeDropdown === group.labelEn && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-1 w-56 py-2 rounded-xl border border-border/50 shadow-xl"
                      style={{
                        background: theme === "dark"
                          ? "oklch(0.12 0.005 260)"
                          : "oklch(1 0 0)",
                      }}
                    >
                      {group.items.map((item) => {
                        const Icon = iconMap[item.iconName];
                        const isActive = location === item.path;
                        return (
                          <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isActive
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/50 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === "en" ? "中文" : "EN"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/50 transition-colors"
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
              className="absolute right-0 top-16 bottom-0 w-72 border-l border-border/50 overflow-y-auto"
              style={{
                background: theme === "dark" ? "oklch(0.09 0.005 260)" : "oklch(0.99 0.002 260)",
              }}
            >
              <div className="p-4 space-y-6">
                {navGroups.map((group) => (
                  <div key={group.labelEn}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3">
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
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              isActive
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
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
                <div className="pt-4 border-t border-border/50">
                  <button
                    onClick={toggleLang}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground w-full rounded-lg hover:bg-accent/50 transition-colors"
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
      <main className="pt-16">
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

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-16">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              <span>Built by <strong className="text-foreground">小天才铭77Ouo</strong></span>
              <a
                href="https://x.com/chen1904o"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                @Chen1904o
              </a>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{t("Pure frontend simulation", "纯前端模拟")}</span>
              <span>•</span>
              <span>{t("Keys never uploaded", "密钥永不上传")}</span>
              <span>•</span>
              <span>MIT License</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
