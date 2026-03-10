import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Zap, Terminal, Cpu, Wallet, Eye, FlaskConical, Shield, History,
  Brain, BookOpen, Layers, Search, ArrowRight, Copy, Check,
  BarChart3, Bot, Sparkles, ChevronRight, ExternalLink, Github,
} from "lucide-react";

const HERO_BG_DARK = "https://d2xsxph8kpxj0f.cloudfront.net/310519663418810887/VmvDxKLT3dhAPhp8jbCBio/hero-bg-dark-AbA4t3E6w5YvgiB7K5okRH.webp";

/* Typing animation hook */
function useTypingEffect(texts: string[], speed = 60, pause = 2000) {
  const [display, setDisplay] = useState("");
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    if (!deleting && charIdx < current.length) {
      const t = setTimeout(() => { setDisplay(current.slice(0, charIdx + 1)); setCharIdx(charIdx + 1); }, speed);
      return () => clearTimeout(t);
    }
    if (!deleting && charIdx === current.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => { setDisplay(current.slice(0, charIdx - 1)); setCharIdx(charIdx - 1); }, speed / 2);
      return () => clearTimeout(t);
    }
    if (deleting && charIdx === 0) {
      setDeleting(false);
      setIdx((idx + 1) % texts.length);
    }
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

/* Terminal animation */
function TerminalDemo() {
  const { t } = useLanguage();
  const [lines, setLines] = useState<{ text: string; type: "cmd" | "out" | "success" }[]>([]);
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const sequence = [
    { text: "$ okx market ticker ETH-USDT", type: "cmd" as const, delay: 800 },
    { text: "  ETH-USDT  $3,487.20  ▲ +1.82%  24h Vol: $9.3B", type: "out" as const, delay: 600 },
    { text: "> Show my current positions and P&L", type: "cmd" as const, delay: 1200 },
    { text: "  Calling swap_get_positions + account_get_balance", type: "out" as const, delay: 500 },
    { text: "  BTC-USDT-SWAP  Long 0.1  Entry: $87,432  uPnL: +$128.50", type: "success" as const, delay: 400 },
    { text: "  Available balance: 8,240.32 USDT", type: "out" as const, delay: 400 },
    { text: "> Long BTC 0.1 SWAP at market, TP 92000, SL 84000", type: "cmd" as const, delay: 1200 },
    { text: "  ✓ Order filled — avgPx: $87,432.50, ordId: 5678901234", type: "success" as const, delay: 600 },
  ];

  useEffect(() => {
    if (!isInView || step >= sequence.length) return;
    const timer = setTimeout(() => {
      setLines((prev) => [...prev, { text: sequence[step].text, type: sequence[step].type }]);
      setStep(step + 1);
    }, sequence[step].delay);
    return () => clearTimeout(timer);
  }, [step, isInView]);

  return (
    <div ref={ref} className="terminal-block w-full max-w-2xl mx-auto">
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: "#ff5f57" }} />
        <div className="terminal-dot" style={{ background: "#febc2e" }} />
        <div className="terminal-dot" style={{ background: "#28c840" }} />
        <span className="ml-3 text-xs text-muted-foreground font-mono">okx-trade-cli</span>
      </div>
      <div className="p-4 space-y-1.5 min-h-[220px] font-mono text-sm">
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={
              line.type === "cmd" ? "text-primary" :
              line.type === "success" ? "text-green-400" :
              "text-muted-foreground"
            }
          >
            {line.text}
          </motion.div>
        ))}
        {step < sequence.length && isInView && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* Feature card */
function FeatureCard({ icon: Icon, title, desc, href, tags, delay }: {
  icon: any; title: string; desc: string; href: string; tags?: string[]; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <Link href={href}>
        <div className="group glass-card p-6 h-full hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
          {tags && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-accent text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

/* MCP Client logos */
function ClientLogos() {
  const clients = ["OpenClaw", "Claude", "Cursor", "OpenCode", "Codex"];
  return (
    <div className="flex items-center justify-center gap-6 flex-wrap">
      {clients.map((name) => (
        <div key={name} className="px-5 py-2.5 rounded-xl border border-border/50 bg-card/50 text-sm font-medium text-muted-foreground">
          {name}
        </div>
      ))}
    </div>
  );
}

/* Install command */
function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const cmd = "npm install -g okx-trade-mcp okx-trade-cli";

  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 max-w-lg mx-auto">
      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 bg-card/80 font-mono text-sm">
        <span className="text-muted-foreground">$</span>
        <span className="text-foreground">{cmd}</span>
      </div>
      <button
        onClick={copy}
        className="p-3 rounded-xl border border-border/50 bg-card/80 hover:bg-accent transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const typingTexts = [
    t("Buy 0.1 BTC at market price", "以市价买入 0.1 BTC"),
    t("Show my portfolio P&L", "查看我的持仓盈亏"),
    t("Set up ETH grid bot 3200-3800", "设置 ETH 网格机器人 3200-3800"),
    t("Analyze BTC trend this week", "分析本周 BTC 走势"),
  ];
  const typedText = useTypingEffect(typingTexts);

  const features = [
    { icon: Cpu, title: t("Agent Trade Kit", "Agent Trade Kit"), desc: t("83 tools across 7 modules. Spot, futures, options, algo orders, bots — full lifecycle coverage.", "83个工具覆盖7大模块。现货、合约、期权、算法单、Bot——完整交易生命周期。"), href: "/agent-trade-kit", tags: ["83 Tools", "7 Modules"], delay: 0 },
    { icon: Terminal, title: t("MCP Visualizer", "MCP 可视化"), desc: t("Visualize MCP tool calls with editable JSON payload. One-click copy for Claude/OpenClaw.", "可视化MCP工具调用，可编辑JSON载荷。一键复制到Claude/OpenClaw。"), href: "/mcp-visualizer", tags: ["MCP", "JSON", "CLI"], delay: 0.05 },
    { icon: Zap, title: t("Agent Skills", "Agent Skills"), desc: t("4 plug-and-play skills: market data, trading, portfolio, bot management.", "4个即插即用技能：行情数据、交易、投资组合、Bot管理。"), href: "/agent-skills", tags: ["Skills", "Plug-and-Play"], delay: 0.1 },
    { icon: Wallet, title: t("Wallet Connect", "钱包连接"), desc: t("Real OKX Wallet connection. View ETH balance, auto-refresh every 30s.", "真实OKX钱包连接。查看ETH余额，每30秒自动刷新。"), href: "/wallet", tags: ["OKX Wallet", "ETH"], delay: 0.15 },
    { icon: Eye, title: t("Token Monitor", "代币监控"), desc: t("Real-time CoinGecko prices. Custom watchlist saved to localStorage.", "CoinGecko实时价格。自定义监控列表保存到本地。"), href: "/token-monitor", tags: ["CoinGecko", "Real-time"], delay: 0.2 },
    { icon: FlaskConical, title: t("Strategy Studio", "策略实验室"), desc: t("Build Grid/DCA/TWAP strategies with visual backtest charts.", "构建网格/DCA/TWAP策略，可视化回测图表。"), href: "/strategy-studio", tags: ["Grid", "DCA", "TWAP"], delay: 0.25 },
    { icon: Shield, title: t("Risk Dashboard", "风控仪表盘"), desc: t("Risk metrics, AI suggestions, and one-click execution.", "风险指标、AI建议、一键执行。"), href: "/risk-dashboard", tags: ["Risk", "AI"], delay: 0.3 },
    { icon: History, title: t("Trade Review", "交易复盘"), desc: t("Full lifecycle review with win rate, Sharpe ratio, PnL curves.", "完整生命周期复盘，胜率、夏普比率、盈亏曲线。"), href: "/trade-review", tags: ["Sharpe", "PnL"], delay: 0.35 },
    { icon: Brain, title: t("Reasoning Chain", "推理链"), desc: t("Visualize Agent's complete reasoning process step by step.", "逐步可视化Agent的完整推理过程。"), href: "/reasoning-chain", tags: ["Chain-of-Thought"], delay: 0.4 },
    { icon: BookOpen, title: t("Use Cases", "使用案例"), desc: t("3 official scenarios: grid bot, whale tracking, options strategy.", "3个官方场景：网格机器人、巨鲸跟单、期权策略。"), href: "/use-cases", tags: ["Demo", "Scenarios"], delay: 0.45 },
    { icon: Layers, title: t("OnchainOS", "OnchainOS"), desc: t("Panoramic dashboard for on-chain data and DeFi overview.", "链上数据和DeFi全景仪表盘。"), href: "/onchain-os", tags: ["Onchain", "DeFi"], delay: 0.5 },
    { icon: Bot, title: t("Claw Prompt Generator", "龙虾Prompt生成器"), desc: t("One-click generate Claw-ready prompts for OpenClaw bot.", "一键生成可直接用于OpenClaw的完整Prompt。"), href: "/reasoning-chain", tags: ["OpenClaw", "Prompt"], delay: 0.55 },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_BG_DARK}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* OKX Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              OKX Agent Trade Kit
            </span>
            <span className="text-xs text-muted-foreground">
              83 {t("tools", "工具")} · 7 {t("modules", "模块")} · 4 {t("skills", "技能")}
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            {t("If you can think it,", "凡你所思，")}
            <br />
            <span className="okx-gradient-text">
              {t("your agent can trade it.", "Agent 皆可为。")}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t(
              "Trade on OKX with natural language. MCP Server + CLI + Skills, open source, keys never leave your device.",
              "用自然语言在OKX交易。MCP Server + CLI + Skills，开源，密钥永不离开你的设备。"
            )}
          </motion.p>

          {/* Spotlight Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              <div className="relative flex items-center gap-3 px-6 py-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl okx-glow">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground text-left flex-1">
                  {typedText}
                  <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse align-middle" />
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs text-muted-foreground border border-border/50">
                  ⌘K
                </kbd>
              </div>
            </div>
          </motion.div>

          {/* Install Command */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <InstallCommand />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <a
              href="https://github.com/okx/agent-trade-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
            <a
              href="https://app.okx.com/docs-v5/agent_zh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border/50 text-foreground font-semibold text-sm hover:bg-accent/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t("Read the Docs", "阅读文档")}
            </a>
          </motion.div>
        </div>
      </section>

      {/* Terminal Demo */}
      <section className="py-20 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
              {t("Live Demo", "实时演示")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("Natural Language → Execution", "自然语言 → 执行")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t(
                "Describe your intent, the agent handles the rest.",
                "描述你的意图，Agent处理剩下的一切。"
              )}
            </p>
          </motion.div>
          <TerminalDemo />
        </div>
      </section>

      {/* Compatible Clients */}
      <section className="py-12 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-sm text-muted-foreground">
              {t("Works with every MCP client", "兼容所有 MCP 客户端")}
            </p>
          </motion.div>
          <ClientLogos />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm font-medium text-primary mb-3 uppercase tracking-wider">
              {t("Full Suite", "完整套件")}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("Everything you need to trade with AI", "AI交易所需的一切")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t(
                "20+ modules covering the complete trading lifecycle, from market data to risk management.",
                "20+模块覆盖完整交易生命周期，从行情数据到风险管理。"
              )}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f) => (
              <FeatureCard key={f.href + f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: "83", label: t("Trading Tools", "交易工具") },
              { value: "7", label: t("Modules", "功能模块") },
              { value: "4", label: t("Agent Skills", "Agent 技能") },
              { value: "100%", label: t("Open Source", "开源") },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="text-3xl sm:text-4xl font-extrabold okx-gradient-text mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="py-20 px-4">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 sm:p-12 text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {t("Get Started in 3 Minutes", "3分钟快速开始")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t(
                "Install, configure your API key, and start trading with natural language.",
                "安装、配置API密钥，开始用自然语言交易。"
              )}
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto">
              {[
                { step: "01", title: t("Install", "安装"), cmd: "npm install -g okx-trade-mcp okx-trade-cli" },
                { step: "02", title: t("Configure", "配置"), cmd: "vim ~/.okx/config.toml" },
                { step: "03", title: t("Trade", "交易"), cmd: 'okx market ticker BTC-USDT' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md mt-0.5">{s.step}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{s.title}</p>
                    <code className="text-xs text-muted-foreground font-mono bg-accent/50 px-2 py-1 rounded">{s.cmd}</code>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
              <a
                href="https://www.okx.com/agent-tradekit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t("Visit OKX Agent Trade Kit", "访问 OKX Agent Trade Kit")}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://t.me/OKX_AgentKit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border/50 text-foreground font-semibold text-sm hover:bg-accent/50 transition-colors"
              >
                {t("Join Telegram", "加入 Telegram")}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
