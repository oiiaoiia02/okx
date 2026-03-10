import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { OKX_TOOLS, type OKXTool } from "@/data/okxTools";
import { getTicker, formatPrice, formatVolume, type TokenDisplayData } from "@/services/okxApi";
import ParticleBackground from "@/components/ParticleBackground";
import {
  Zap, Terminal, Cpu, Wallet, Eye, FlaskConical, Shield, History,
  Brain, BookOpen, Layers, Search, ArrowRight, Copy, Check,
  BarChart3, Bot, Sparkles, ChevronRight, ExternalLink, Github,
  Mic, MicOff, Play, Send, TrendingUp, TrendingDown, Activity,
} from "lucide-react";

/* ─── Intent matching engine ─── */
const INTENT_KEYWORDS: Record<string, string[]> = {
  market_ticker: ["price", "价格", "行情", "ticker", "btc", "eth", "sol", "查", "look", "check"],
  market_orderbook: ["orderbook", "订单簿", "depth", "深度", "bid", "ask", "买卖"],
  market_candles: ["candle", "k线", "kline", "chart", "图表", "走势"],
  market_funding_rate: ["funding", "资金费率", "费率", "perpetual"],
  spot_place_order: ["buy", "sell", "买", "卖", "下单", "order", "交易", "trade", "购买"],
  spot_cancel_order: ["cancel", "撤单", "取消"],
  swap_place_order: ["swap", "合约", "futures", "期货", "做多", "做空", "long", "short", "杠杆", "leverage"],
  swap_get_positions: ["position", "持仓", "仓位"],
  swap_set_leverage: ["leverage", "杠杆", "倍数"],
  swap_tp_sl: ["tp", "sl", "止盈", "止损", "stop"],
  account_balance: ["balance", "余额", "资金", "账户", "account", "钱"],
  account_positions: ["portfolio", "投资组合", "所有持仓", "all position"],
  bot_grid_create: ["grid", "网格", "机器人", "bot"],
  bot_dca_create: ["dca", "定投", "recurring"],
  bot_copy_trading: ["copy", "跟单", "跟随"],
  bot_signal_create: ["signal", "信号"],
  option_place_order: ["option", "期权"],
};

function matchIntents(query: string): OKXTool[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const scores = new Map<string, number>();

  for (const [toolName, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > 0) scores.set(toolName, score);
  }

  // Also search all tools by name/desc/tags
  for (const tool of OKX_TOOLS) {
    const existing = scores.get(tool.name) || 0;
    let score = existing;
    if (tool.name.toLowerCase().includes(q)) score += 5;
    if (tool.descEn.toLowerCase().includes(q)) score += 3;
    if (tool.descZh.includes(q)) score += 3;
    for (const tag of tool.tags) {
      if (tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase())) score += 2;
    }
    if (score > existing) scores.set(tool.name, score);
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => OKX_TOOLS.find((t) => t.name === name)!)
    .filter(Boolean);
}

/* ─── Typing animation hook ─── */
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

/* ─── Live OKX Price Ticker Bar ─── */
function LivePriceTicker() {
  const [prices, setPrices] = useState<TokenDisplayData[]>([]);
  const pairs = ["BTC-USDT", "ETH-USDT", "SOL-USDT"];

  const fetchPrices = useCallback(async () => {
    const results: TokenDisplayData[] = [];
    for (const pair of pairs) {
      try {
        const t = await getTicker(pair);
        const last = parseFloat(t.last);
        const open = parseFloat(t.open24h);
        const change = open > 0 ? ((last - open) / open) * 100 : 0;
        results.push({
          instId: pair,
          symbol: pair.split("-")[0],
          price: last,
          change24h: change,
          high24h: parseFloat(t.high24h),
          low24h: parseFloat(t.low24h),
          volume24h: parseFloat(t.vol24h),
          volumeCcy24h: parseFloat(t.volCcy24h),
          askPx: parseFloat(t.askPx),
          bidPx: parseFloat(t.bidPx),
          timestamp: parseInt(t.ts),
          source: "OKX",
        });
      } catch { /* skip */ }
    }
    if (results.length > 0) setPrices(results);
  }, []);

  useEffect(() => {
    fetchPrices();
    const iv = setInterval(fetchPrices, 8000);
    return () => clearInterval(iv);
  }, [fetchPrices]);

  if (prices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex items-center justify-center gap-4 flex-wrap mb-8"
    >
      {prices.map((p) => (
        <Link key={p.instId} href="/token-monitor">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all group cursor-pointer">
            <span className="text-xs font-bold text-foreground">{p.symbol}</span>
            <span className="text-xs font-mono text-foreground">${formatPrice(p.price)}</span>
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${p.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
              {p.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {p.change24h >= 0 ? "+" : ""}{p.change24h.toFixed(2)}%
            </span>
            <span className="text-[9px] text-muted-foreground hidden sm:inline">
              {formatVolume(p.volumeCcy24h)}
            </span>
            <span className="text-[8px] text-primary/50 hidden sm:inline">OKX</span>
          </div>
        </Link>
      ))}
    </motion.div>
  );
}

/* ─── One-Click Demo Buttons ─── */
function DemoButtons({ onDemo }: { onDemo: (query: string) => void }) {
  const { t } = useLanguage();
  const demos = [
    { label: t("Check BTC Price", "查询BTC价格"), query: t("Get BTC real-time price", "查询BTC实时价格"), icon: Activity },
    { label: t("Simulate Buy ETH", "模拟买入ETH"), query: t("Buy 0.1 ETH at market price --demo", "模拟买入0.1 ETH --demo"), icon: Play },
    { label: t("Grid Bot Setup", "设置网格机器人"), query: t("Create ETH grid bot 3000-4000", "创建ETH网格机器人 3000-4000"), icon: Bot },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="flex items-center justify-center gap-3 flex-wrap mb-6"
    >
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {t("Quick Demo", "快速体验")}
      </span>
      {demos.map((d) => (
        <button
          key={d.label}
          onClick={() => onDemo(d.query)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <d.icon className="w-3 h-3" />
          {d.label}
        </button>
      ))}
    </motion.div>
  );
}

/* ─── Terminal Demo ─── */
function TerminalDemo() {
  const { t } = useLanguage();
  const [lines, setLines] = useState<{ text: string; type: "cmd" | "out" | "success" }[]>([]);
  const [step, setStep] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  const sequence = [
    { text: "$ okx market ticker BTC-USDT", type: "cmd" as const, delay: 800 },
    { text: "  → Calling OKX V5 API: /market/ticker?instId=BTC-USDT", type: "out" as const, delay: 400 },
    { text: "  BTC-USDT  $70,126.00  ▲ +1.70%  24h Vol: $702.5M  [Source: OKX]", type: "success" as const, delay: 600 },
    { text: "> Show my current positions and P&L", type: "cmd" as const, delay: 1200 },
    { text: "  → MCP: swap_get_positions + account_balance", type: "out" as const, delay: 500 },
    { text: "  BTC-USDT-SWAP  Long 0.1  Entry: $68,500  uPnL: +$162.60", type: "success" as const, delay: 400 },
    { text: "  Available balance: 8,240.32 USDT", type: "out" as const, delay: 400 },
    { text: "> Long BTC 0.1 SWAP at market, TP 75000, SL 66000 --demo", type: "cmd" as const, delay: 1200 },
    { text: "  ⚠ SIMULATION MODE — no real funds at risk", type: "out" as const, delay: 300 },
    { text: "  ✓ Demo order filled — avgPx: $70,126.00, ordId: sim_5678901234", type: "success" as const, delay: 600 },
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
        <span className="ml-3 text-xs text-muted-foreground font-mono">okx-ai-core — Agent Trade Terminal</span>
      </div>
      <div className="p-4 space-y-1.5 min-h-[260px] font-mono text-sm">
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

/* ─── Feature Card ─── */
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

/* ─── MCP Client Logos ─── */
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

/* ─── Install Command ─── */
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ─── HOME PAGE ─── */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Typing animation (only when search is empty and not focused)
  const typingTexts = [
    t("Buy 0.1 BTC at market price", "以市价买入 0.1 BTC"),
    t("Show my portfolio P&L", "查看我的持仓盈亏"),
    t("Set up ETH grid bot 3200-3800", "设置 ETH 网格机器人 3200-3800"),
    t("Check BTC real-time price", "查询 BTC 实时价格"),
  ];
  const typedText = useTypingEffect(typingTexts);

  // Intent matching
  const matchedTools = useMemo(() => matchIntents(searchQuery), [searchQuery]);

  // Voice input
  const toggleVoice = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setSearchQuery(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  // Handle demo button click
  const handleDemo = (query: string) => {
    setSearchQuery(query);
    setSearchFocused(true);
    searchRef.current?.focus();
  };

  // Handle search submit
  const handleSubmit = () => {
    if (!searchQuery.trim()) return;
    // Navigate to copilot with query
    setLocation(`/copilot?q=${encodeURIComponent(searchQuery)}`);
  };

  // Handle tool click from intent preview
  const handleToolClick = (tool: OKXTool) => {
    setLocation(`/agent-trade-kit?tool=${encodeURIComponent(tool.name)}`);
  };

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchFocused(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const features = [
    { icon: Cpu, title: t("Agent Trade Kit", "Agent Trade Kit"), desc: t("83 tools across 7 modules. Spot, futures, options, algo orders, bots — full lifecycle coverage.", "83个工具覆盖7大模块。现货、合约、期权、算法单、Bot——完整交易生命周期。"), href: "/agent-trade-kit", tags: ["83 Tools", "7 Modules"], delay: 0 },
    { icon: Terminal, title: t("MCP Visualizer", "MCP 可视化"), desc: t("Visualize MCP tool calls with editable JSON payload. One-click copy for Claude/OpenClaw.", "可视化MCP工具调用，可编辑JSON载荷。一键复制到Claude/OpenClaw。"), href: "/mcp-visualizer", tags: ["MCP", "JSON", "CLI"], delay: 0.05 },
    { icon: Zap, title: t("Agent Skills", "Agent Skills"), desc: t("4 plug-and-play skills: market data, trading, portfolio, bot management.", "4个即插即用技能：行情数据、交易、投资组合、Bot管理。"), href: "/agent-skills", tags: ["Skills", "Plug-and-Play"], delay: 0.1 },
    { icon: Wallet, title: t("Wallet Connect", "钱包连接"), desc: t("Real OKX Wallet connection. View on-chain balance, auto-refresh.", "真实OKX钱包连接。查看链上余额，自动刷新。"), href: "/wallet", tags: ["OKX Wallet", "On-chain"], delay: 0.15 },
    { icon: Eye, title: t("Token Monitor", "代币监控"), desc: t("Real-time OKX V5 API prices. Custom watchlist with 8s refresh.", "OKX V5 API实时价格。自定义监控列表，8秒刷新。"), href: "/token-monitor", tags: ["OKX API", "Real-time"], delay: 0.2 },
    { icon: FlaskConical, title: t("Strategy Studio", "策略实验室"), desc: t("Build Grid/DCA/TWAP strategies with real historical price backtest.", "构建网格/DCA/TWAP策略，基于真实历史价格回测。"), href: "/strategy-studio", tags: ["Grid", "DCA", "Backtest"], delay: 0.25 },
    { icon: Shield, title: t("Risk Dashboard", "风控仪表盘"), desc: t("Real-time risk metrics based on wallet balance and OKX prices.", "基于钱包余额和OKX价格的实时风险指标。"), href: "/risk-dashboard", tags: ["Risk", "Real-time"], delay: 0.3 },
    { icon: History, title: t("Trade Review", "交易复盘"), desc: t("Full lifecycle review with win rate, Sharpe ratio, PnL curves.", "完整生命周期复盘，胜率、夏普比率、盈亏曲线。"), href: "/trade-review", tags: ["Sharpe", "PnL"], delay: 0.35 },
    { icon: Brain, title: t("Reasoning Chain", "推理链"), desc: t("Visualize Agent's complete reasoning: intent → tool → MCP → result.", "可视化Agent完整推理：意图→工具→MCP→结果。"), href: "/reasoning-chain", tags: ["Chain-of-Thought"], delay: 0.4 },
    { icon: BookOpen, title: t("Use Cases", "使用案例"), desc: t("3 official scenarios: grid bot, whale tracking, options strategy.", "3个官方场景：网格机器人、巨鲸跟单、期权策略。"), href: "/use-cases", tags: ["Demo", "Scenarios"], delay: 0.45 },
    { icon: Layers, title: t("OnchainOS", "OnchainOS"), desc: t("Panoramic dashboard for on-chain data and DeFi overview.", "链上数据和DeFi全景仪表盘。"), href: "/onchain-os", tags: ["Onchain", "DeFi"], delay: 0.5 },
    { icon: Sparkles, title: t("Claw Prompt Generator", "龙虾Prompt生成器"), desc: t("One-click generate Claw-ready prompts with Skills + MCP + --demo.", "一键生成含Skills + MCP + --demo的完整Claw Prompt。"), href: "/claw-prompt", tags: ["OpenClaw", "Prompt"], delay: 0.55 },
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Particle Background */}
        <div className="absolute inset-0 z-0">
          <ParticleBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
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
            <span className="text-sm font-medium text-primary">OKX Agent Trade Kit</span>
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
              "Trade on OKX with natural language. All prices from OKX V5 API. MCP Server + CLI + Skills, open source, keys never leave your device.",
              "用自然语言在OKX交易。所有行情来自OKX V5官方API。MCP Server + CLI + Skills，开源，密钥永不离开你的设备。"
            )}
          </motion.p>

          {/* ═══ Spotlight Search (REAL) ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-6 relative"
          >
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              <div className={`relative flex items-center gap-3 px-6 py-4 rounded-2xl border bg-card/80 backdrop-blur-xl transition-all duration-300 ${
                searchFocused ? "border-primary/40 okx-glow" : "border-border/50"
              }`}>
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={searchFocused ? t("Describe your trading intent...", "描述你的交易意图...") : ""}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                />
                {!searchFocused && !searchQuery && (
                  <span className="absolute left-14 text-muted-foreground text-sm pointer-events-none">
                    {typedText}
                    <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse align-middle" />
                  </span>
                )}
                {/* Voice button */}
                <button
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-lg transition-colors ${
                    listening ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  title={t("Voice input", "语音输入")}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                {searchQuery && (
                  <button
                    onClick={handleSubmit}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent text-xs text-muted-foreground border border-border/50">
                  ⌘K
                </kbd>
              </div>
            </div>

            {/* Intent Preview Dropdown */}
            <AnimatePresence>
              {searchFocused && matchedTools.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-20"
                >
                  <div className="px-4 py-2 border-b border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {t("Matched Tools", "匹配工具")} ({matchedTools.length})
                    </span>
                  </div>
                  {matchedTools.map((tool, i) => (
                    <button
                      key={tool.name}
                      onMouseDown={() => handleToolClick(tool)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tool.moduleColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-primary">{tool.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {t(tool.descEn, tool.descZh)}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent text-muted-foreground flex-shrink-0">
                        {tool.module}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Live Price Ticker */}
          <LivePriceTicker />

          {/* One-Click Demo Buttons */}
          <DemoButtons onDemo={handleDemo} />

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
              href="https://github.com/oiiaoiia02/okx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Github className="w-4 h-4" />
              {t("View Source", "查看源码")}
            </a>
            <a
              href="https://www.okx.com/zh-hans/web3/build/docs/devportal/introduction-to-developer-portal-interface"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border/50 text-foreground font-semibold text-sm hover:bg-accent/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t("OKX Docs", "OKX 文档")}
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
              {t("Natural Language → MCP → Execution", "自然语言 → MCP → 执行")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t(
                "Describe your intent, the agent calls OKX API and executes via MCP.",
                "描述你的意图，Agent调用OKX API并通过MCP执行。"
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
                "20+ modules covering the complete trading lifecycle, all powered by OKX official API.",
                "20+模块覆盖完整交易生命周期，全部基于OKX官方API驱动。"
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
                href="https://www.okx.com/zh-hans/web3/build/docs/devportal/introduction-to-developer-portal-interface"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {t("Visit OKX Agent Trade Kit", "访问 OKX Agent Trade Kit")}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://t.me/se77ouo"
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
