import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { OKX_TOOLS, type OKXTool } from "@/data/okxTools";
import { getTicker, formatPrice, formatVolume, type TokenDisplayData } from "@/services/okxApi";
import ParticleBackground from "@/components/ParticleBackground";
import TokenLogo from "@/components/TokenLogo";
import {
  Zap, Terminal, Cpu, Wallet, Eye, FlaskConical, Shield, History,
  Brain, BookOpen, Layers, Search, ArrowRight, Copy, Check,
  BarChart3, Bot, Sparkles, ChevronRight, ExternalLink, Github,
  Mic, MicOff, Play, Send, TrendingUp, TrendingDown, Activity, MessageSquare,
} from "lucide-react";

/* ─── Intent matching engine — searches all 83 tools ─── */
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

interface MatchedTool {
  tool: OKXTool;
  score: number;
}

function matchIntents(query: string): OKXTool[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: MatchedTool[] = [];

  for (const tool of OKX_TOOLS) {
    let score = 0;

    // Intent keyword matching
    const keywords = INTENT_KEYWORDS[tool.name];
    if (keywords) {
      for (const kw of keywords) {
        if (q.includes(kw)) score += kw.length * 2;
      }
    }

    // Tool name matching
    if (tool.name.toLowerCase().includes(q)) score += 10;
    // Module matching
    if (tool.module.toLowerCase().includes(q)) score += 6;
    // Description matching
    if (tool.descEn.toLowerCase().includes(q)) score += 4;
    if (tool.descZh.includes(q)) score += 4;
    // Tag matching
    for (const tag of tool.tags) {
      if (tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase())) score += 3;
    }

    if (score > 0) results.push({ tool, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((r) => r.tool);
}

function countMatchedTools(query: string): number {
  if (!query.trim()) return 0;
  const q = query.toLowerCase();
  return OKX_TOOLS.filter((tool) => {
    const keywords = INTENT_KEYWORDS[tool.name];
    if (keywords?.some((kw) => q.includes(kw))) return true;
    if (tool.name.toLowerCase().includes(q)) return true;
    if (tool.module.toLowerCase().includes(q)) return true;
    if (tool.descEn.toLowerCase().includes(q)) return true;
    if (tool.descZh.includes(q)) return true;
    if (tool.tags.some((tag) => tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase()))) return true;
    return false;
  }).length;
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
    const iv = setInterval(fetchPrices, 5000);
    return () => clearInterval(iv);
  }, [fetchPrices]);

  if (prices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="flex items-center justify-center gap-5 flex-wrap mb-14"
    >
      {prices.map((p) => (
        <Link key={p.instId} href="/token-monitor">
          <div className="flex items-center gap-3 px-6 py-3 rounded-[14px] border border-border/50 bg-card backdrop-blur-sm hover:border-primary/15 hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 hover:-translate-y-[1px] cursor-pointer">
            <TokenLogo symbol={p.symbol} size={22} />
            <span className="text-[13px] font-[700] text-foreground tracking-[0.3px]">{p.symbol}</span>
            <span className="text-[13px] font-mono text-foreground font-[500]">${formatPrice(p.price)}</span>
            <span className={`text-[11px] font-[700] font-mono px-2.5 py-[3px] rounded-[8px] ${
              p.change24h >= 0 ? "text-green-400 bg-green-400/8" : "text-red-400 bg-red-400/8"
            }`}>
              {p.change24h >= 0 ? "+" : ""}{p.change24h.toFixed(2)}%
            </span>
            <span className="text-[9px] text-muted-foreground font-[600] tracking-[1px] uppercase hidden sm:inline">OKX</span>
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
      className="flex items-center justify-center gap-3 flex-wrap mb-10"
    >
      <span className="text-[10px] text-muted-foreground uppercase tracking-[2px] font-[600]">
        {t("Quick Demo", "快速体验")}
      </span>
      {demos.map((d) => (
        <button
          key={d.label}
          onClick={() => onDemo(d.query)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] border border-primary/15 bg-primary/4 text-[12px] font-[600] text-primary hover:bg-primary/8 transition-all duration-200"
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
    { text: "  BTC-USDT  $70,126.00  ▲ +1.70%  24h Vol: $702.5M  [OKX]", type: "success" as const, delay: 600 },
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
    <div ref={ref} className="terminal-block w-full max-w-[840px] mx-auto">
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: "#ff5f57" }} />
        <div className="terminal-dot" style={{ background: "#febc2e" }} />
        <div className="terminal-dot" style={{ background: "#28c840" }} />
        <span className="ml-3.5 text-[12px] text-muted-foreground font-mono">okx-ai-core — Agent Trade Terminal</span>
      </div>
      <div className="p-6 space-y-2 min-h-[280px] font-mono text-[13px] leading-[2.2]">
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
        <div className="group glass-card feature-card-hover p-9 h-full">
          <div className="w-[52px] h-[52px] rounded-[16px] bg-gradient-to-br from-primary/6 to-[rgba(79,143,255,0.03)] border border-primary/8 flex items-center justify-center mb-8 group-hover:border-primary/20 group-hover:shadow-[0_0_24px_rgba(0,230,138,0.08)] transition-all duration-500">
            <Icon className="w-[24px] h-[24px] text-primary group-hover:scale-110 transition-transform duration-300" />
          </div>
          <h3 className="font-[700] text-[18px] text-foreground mb-3.5 group-hover:text-primary transition-colors duration-300 tracking-[-0.01em]">{title}</h3>
          <p className="text-[14px] text-muted-foreground leading-[1.8] mb-6">{desc}</p>
          {tags && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="text-[11px] px-3 py-1 rounded-[8px] bg-card border border-border/50 text-muted-foreground font-[500]">
                  {tag}
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
        <div key={name} className="px-6 py-3 rounded-[12px] border border-border/40 bg-card/50 text-[13px] font-[500] text-muted-foreground">
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
    <div className="flex items-center gap-3 max-w-lg mx-auto">
      <div className="flex-1 flex items-center gap-3 px-5 py-3.5 rounded-[14px] border border-border/40 bg-card/80 font-mono text-[13px]">
        <span className="text-muted-foreground">$</span>
        <span className="text-foreground">{cmd}</span>
      </div>
      <button
        onClick={copy}
        className="p-3 rounded-[14px] border border-border/40 bg-card/80 hover:bg-accent/30 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* ─── HOME PAGE — QUANTUM THEME ─── */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function Home() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const typingTexts = [
    t("Buy 0.1 BTC at market price", "以市价买入 0.1 BTC"),
    t("Show my portfolio P&L", "查看我的持仓盈亏"),
    t("Set up ETH grid bot 3200-3800", "设置 ETH 网格机器人 3200-3800"),
    t("Check BTC real-time price", "查询 BTC 实时价格"),
  ];
  const typedText = useTypingEffect(typingTexts);

  const matchedTools = useMemo(() => matchIntents(searchQuery), [searchQuery]);
  const totalMatched = useMemo(() => countMatchedTools(searchQuery), [searchQuery]);

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

  const handleDemo = (query: string) => {
    setSearchQuery(query);
    setSearchFocused(true);
    searchRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!searchQuery.trim()) return;
    setLocation(`/copilot?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleToolClick = (tool: OKXTool) => {
    setLocation(`/agent-trade-kit?tool=${encodeURIComponent(tool.name)}`);
  };

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
    { icon: Eye, title: t("Token Monitor", "代币监控"), desc: t("Real-time OKX V5 API prices. Custom watchlist with 5s refresh.", "OKX V5 API实时价格。自定义监控列表，5秒刷新。"), href: "/token-monitor", tags: ["OKX API", "Real-time"], delay: 0.2 },
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
      {/* ═══ Hero Section — Quantum ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <ParticleBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background" />
        </div>

        {/* Pulse Ring */}
        <div className="quantum-ring" />

        {/* Content */}
        <div className="relative z-10 max-w-[900px] mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 px-5 py-2 pl-5 pr-2 rounded-full border border-primary/10 bg-primary/3 mb-16"
          >
            <span className="text-[13px] font-[500] text-primary">OKX Agent Trade Kit</span>
            <span className="px-3.5 py-1 rounded-full bg-primary/8 text-[11px] font-[700] text-primary tracking-[0.5px]">
              83 · 7 · 4
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[clamp(48px,7vw,88px)] font-[900] leading-[1.05] tracking-[-0.04em] mb-8"
          >
            {t("If you can think it,", "凡你所思，")}
            <br />
            <span className="okx-gradient-text">
              {t("your agent can trade it.", "Agent 皆可为。")}
            </span>
          </motion.h1>

          {/* Subtitle — simplified */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[17px] text-muted-foreground max-w-[520px] mx-auto mb-16 leading-[1.8] font-[400]"
          >
            {t(
              "Natural language trading powered by OKX V5 API.",
              "基于 OKX V5 API 的自然语言交易。"
            )}
          </motion.p>

          {/* ═══ Quantum Search ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-[640px] mx-auto mb-14 relative"
          >
            <div className="quantum-search-border">
              <div className="quantum-search-inner">
                <Search className="w-[18px] h-[18px] text-muted-foreground flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={searchFocused ? t("Describe your trading intent...", "描述你的交易意图...") : ""}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-[15px]"
                />
                {!searchFocused && !searchQuery && (
                  <span className="absolute left-[72px] text-muted-foreground text-[15px] pointer-events-none">
                    {typedText}
                    <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-pulse align-middle" />
                  </span>
                )}
                <button
                  onClick={toggleVoice}
                  className={`p-1.5 rounded-[8px] transition-colors ${
                    listening ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  title={t("Voice input", "语音输入")}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                {searchQuery && (
                  <button
                    onClick={handleSubmit}
                    className="p-1.5 rounded-[8px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <div className="hidden sm:flex gap-1">
                  <kbd className="px-2 py-0.5 rounded-[5px] bg-card border border-border/50 text-[10px] text-muted-foreground font-mono font-[500]">⌘</kbd>
                  <kbd className="px-2 py-0.5 rounded-[5px] bg-card border border-border/50 text-[10px] text-muted-foreground font-mono font-[500]">K</kbd>
                </div>
              </div>
            </div>

            {/* Intent Preview Dropdown — real-time filter across all 83 tools */}
            <AnimatePresence>
              {searchFocused && matchedTools.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-full left-0 right-0 mt-3 rounded-[18px] border border-border/30 shadow-2xl overflow-hidden z-20"
                  style={{ background: "rgba(10, 10, 16, 0.96)", backdropFilter: "blur(24px)" }}
                >
                  <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-[2px] font-[600]">
                      {t("Matched Tools", "匹配工具")} ({totalMatched}/{OKX_TOOLS.length})
                    </span>
                    <span className="text-[9px] text-primary/60 font-[500]">
                      {t("Click to fill Copilot", "点击填充到 Copilot")}
                    </span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {matchedTools.map((tool, i) => (
                      <button
                        key={tool.name}
                        onMouseDown={() => {
                          setSearchQuery(t(tool.descEn, tool.descZh));
                          setLocation(`/copilot?q=${encodeURIComponent(t(tool.descEn, tool.descZh))}`);
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" style={{ background: tool.moduleColor }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-mono text-primary group-hover:text-primary/90">{tool.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {t(tool.descEn, tool.descZh)}
                          </div>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-[8px] border text-muted-foreground flex-shrink-0" style={{ borderColor: `${tool.moduleColor}30`, background: `${tool.moduleColor}08` }}>
                          {tool.module}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/60 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                  {totalMatched > 8 && (
                    <div className="px-5 py-2.5 border-t border-border/30 text-center">
                      <button
                        onMouseDown={() => setLocation(`/agent-trade-kit?search=${encodeURIComponent(searchQuery)}`)}
                        className="text-[11px] text-primary/70 hover:text-primary font-[500] transition-colors"
                      >
                        {t(`View all ${totalMatched} matched tools →`, `查看全部 ${totalMatched} 个匹配工具 →`)}
                      </button>
                    </div>
                  )}
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
            className="mb-12"
          >
            <InstallCommand />
          </motion.div>

          {/* CTA Buttons — Real links */}
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
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[14px] bg-gradient-to-r from-primary to-[#00cc7a] text-primary-foreground font-[700] text-[14px] hover:-translate-y-[2px] hover:shadow-[0_16px_48px_rgba(0,230,138,0.2)] transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Github className="w-[18px] h-[18px] relative z-10" />
              <span className="relative z-10">Agent Trade Kit</span>
            </a>
            <a
              href="https://app.okx.com/docs-v5/agent_zh"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[14px] border border-border/50 text-foreground font-[600] text-[14px] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] hover:-translate-y-[1px] transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4" />
              {t("Official Docs", "官方文档")}
            </a>
            <a
              href="https://t.me/se77ouo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[14px] border border-primary/30 text-primary font-[600] text-[14px] hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-[1px] transition-all duration-300"
            >
              <MessageSquare className="w-4 h-4" />
              Telegram
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══ Terminal Demo ═══ */}
      <section className="py-[180px] px-6">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-[60px]"
          >
            <p className="text-[11px] font-[700] text-primary mb-5 uppercase tracking-[3px]">
              {t("Live Demo", "实时演示")}
            </p>
            <h2 className="text-[clamp(30px,4vw,44px)] font-[800] mb-4 tracking-[-0.03em]">
              {t("Natural Language → MCP → Execution", "自然语言 → MCP → 执行")}
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-[460px] mx-auto leading-[1.7]">
              {t(
                "Describe your intent, the agent calls OKX API and executes via MCP.",
                "描述你的意图，Agent调用OKX API并通过MCP执行。"
              )}
            </p>
          </motion.div>
          <TerminalDemo />
        </div>
      </section>

      {/* ═══ Compatible Clients ═══ */}
      <section className="py-16 px-6">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <p className="text-[13px] text-muted-foreground">
              {t("Works with every MCP client", "兼容所有 MCP 客户端")}
            </p>
          </motion.div>
          <ClientLogos />
        </div>
      </section>

      {/* ═══ Feature Grid ═══ */}
      <section className="py-[180px] px-6">
        <div className="container max-w-[1280px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-[60px]"
          >
            <p className="text-[11px] font-[700] text-primary mb-5 uppercase tracking-[3px]">
              {t("Full Suite", "完整套件")}
            </p>
            <h2 className="text-[clamp(30px,4vw,44px)] font-[800] mb-4 tracking-[-0.03em]">
              {t("Everything you need to trade with AI", "AI交易所需的一切")}
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-[460px] mx-auto leading-[1.7]">
              {t(
                "20+ modules covering the complete trading lifecycle, all powered by OKX official API.",
                "20+模块覆盖完整交易生命周期，全部基于OKX官方API驱动。"
              )}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
            {features.map((f) => (
              <FeatureCard key={f.href + f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Stats ═══ */}
      <section className="py-[120px] px-6">
        <div className="container max-w-[1080px]">
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
                className="glass-card p-10 text-center"
              >
                <div className="text-[44px] font-[900] tracking-[-0.03em] okx-gradient-text mb-3">{stat.value}</div>
                <div className="text-[14px] text-muted-foreground font-[500]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Get Started ═══ */}
      <section className="py-[180px] px-6">
        <div className="container max-w-[780px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 sm:p-16 text-center relative"
          >
            {/* Top gradient line */}
            <div className="absolute top-[-1px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <h2 className="text-[32px] font-[800] mb-5 tracking-[-0.03em]">
              {t("Get Started in 3 Minutes", "3分钟快速开始")}
            </h2>
            <p className="text-[16px] text-muted-foreground mb-12 max-w-[440px] mx-auto leading-[1.7]">
              {t(
                "Install, configure your API key, and start trading with natural language.",
                "安装、配置API密钥，开始用自然语言交易。"
              )}
            </p>
            <div className="space-y-5 text-left max-w-md mx-auto mb-12">
              {[
                { step: "01", title: t("Install", "安装"), cmd: "npm install -g okx-trade-mcp okx-trade-cli" },
                { step: "02", title: t("Configure", "配置"), cmd: "vim ~/.okx/config.toml" },
                { step: "03", title: t("Trade", "交易"), cmd: 'okx market ticker BTC-USDT' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-5">
                  <span className="text-[12px] font-[700] text-primary bg-primary/8 px-3 py-1.5 rounded-[8px] mt-0.5">{s.step}</span>
                  <div className="flex-1">
                    <p className="font-[600] text-[14px] mb-1.5">{s.title}</p>
                    <code className="text-[12px] text-muted-foreground font-mono bg-card px-3 py-1.5 rounded-[8px] border border-border/40">{s.cmd}</code>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <a
                href="https://github.com/okx/agent-trade-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-10 py-4 rounded-[14px] bg-gradient-to-r from-primary to-[#00cc7a] text-primary-foreground font-[700] text-[14px] hover:-translate-y-[2px] hover:shadow-[0_16px_48px_rgba(0,230,138,0.2)] transition-all duration-300"
              >
                Agent Trade Kit
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://app.okx.com/docs-v5/agent_zh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-[14px] border border-border/50 text-foreground font-[600] text-[14px] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] transition-all duration-300"
              >
                {t("Official Docs", "官方文档")}
              </a>
              <a
                href="https://t.me/se77ouo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-[14px] border border-border/50 text-foreground font-[600] text-[14px] hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.02)] transition-all duration-300"
              >
                Telegram
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
