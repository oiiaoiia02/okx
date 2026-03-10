import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Zap, ChevronRight, Copy, Check, ExternalLink, Terminal, BarChart3,
  Wallet, Bot, Plus, Trash2, Save, Download, Upload, X, Edit3,
} from "lucide-react";

// ─── Built-in Skills ────────────────────────────────────────────────────────

const BUILTIN_SKILLS = [
  {
    id: "okx-cex-market",
    nameEn: "Market Data",
    nameZh: "行情数据",
    iconName: "BarChart3",
    color: "#22c55e",
    descEn: "Real-time tickers, orderbook depth, candlesticks, funding rates, open interest, and index data. No API key required.",
    descZh: "实时行情、订单簿深度、K线、资金费率、持仓量和指数数据。无需API密钥。",
    tags: ["Public", "Real-time", "No Auth"],
    install: "npx skills add okx/agent-skills/okx-cex-market",
    builtin: true,
    capabilities: [
      { nameEn: "Get real-time ticker", nameZh: "获取实时行情", example: "What's the BTC price?" },
      { nameEn: "Get orderbook depth", nameZh: "获取订单簿深度", example: "Show me ETH orderbook" },
      { nameEn: "Get candlestick data", nameZh: "获取K线数据", example: "Show BTC 1H candles" },
      { nameEn: "Get funding rate", nameZh: "获取资金费率", example: "What's BTC funding rate?" },
      { nameEn: "Get open interest", nameZh: "获取持仓量", example: "Show SWAP open interest" },
      { nameEn: "Get index data", nameZh: "获取指数数据", example: "Get BTC index price" },
    ],
  },
  {
    id: "okx-cex-trade",
    nameEn: "Trading",
    nameZh: "交易",
    iconName: "Terminal",
    color: "#3b82f6",
    descEn: "Spot, futures, options, and advanced orders. Execute, cancel, amend, or batch orders, including OCO, trailing stops, and grid bots.",
    descZh: "现货、合约、期权和高级订单。执行、撤销、修改或批量操作，包括OCO、追踪止损和网格机器人。",
    tags: ["Spot", "Futures", "Options", "Algo"],
    install: "npx skills add okx/agent-skills/okx-cex-trade",
    builtin: true,
    capabilities: [
      { nameEn: "Place spot/futures orders", nameZh: "下现货/合约单", example: "Buy 0.1 BTC at market" },
      { nameEn: "Cancel/amend orders", nameZh: "撤销/修改订单", example: "Cancel all BTC orders" },
      { nameEn: "Batch operations", nameZh: "批量操作", example: "Batch place 5 limit orders" },
      { nameEn: "Algo orders (OCO/trailing)", nameZh: "算法单(OCO/追踪)", example: "Set trailing stop at 2%" },
      { nameEn: "Options trading", nameZh: "期权交易", example: "Buy BTC call option" },
    ],
  },
  {
    id: "okx-cex-portfolio",
    nameEn: "Portfolio",
    nameZh: "投资组合",
    iconName: "Wallet",
    color: "#a855f7",
    descEn: "Track balances, positions, PnL, billing history, fee rates, and transfers. Get full portfolio visibility with a single skill.",
    descZh: "追踪余额、持仓、盈亏、账单历史、费率和划转。一个技能获得完整的投资组合可见性。",
    tags: ["Balance", "Positions", "P&L", "Fees"],
    install: "npx skills add okx/agent-skills/okx-cex-portfolio",
    builtin: true,
    capabilities: [
      { nameEn: "Get account balance", nameZh: "获取账户余额", example: "Show my balance" },
      { nameEn: "Track positions & PnL", nameZh: "追踪持仓和盈亏", example: "Show my P&L" },
      { nameEn: "Billing history", nameZh: "账单历史", example: "Show fees this week" },
      { nameEn: "Fee rate lookup", nameZh: "费率查询", example: "What's my fee rate?" },
      { nameEn: "Fund transfers", nameZh: "资金划转", example: "Transfer 100 USDT" },
    ],
  },
  {
    id: "okx-cex-bot",
    nameEn: "Bot Management",
    nameZh: "Bot管理",
    iconName: "Bot",
    color: "#ec4899",
    descEn: "Create and manage grid bots, DCA bots, signal bots, and more. Automate your trading strategies.",
    descZh: "创建和管理网格机器人、DCA机器人、信号机器人等。自动化你的交易策略。",
    tags: ["Grid", "DCA", "Signal", "Automation"],
    install: "npx skills add okx/agent-skills/okx-cex-bot",
    builtin: true,
    capabilities: [
      { nameEn: "Create grid bot", nameZh: "创建网格机器人", example: "Create ETH grid bot" },
      { nameEn: "DCA automation", nameZh: "DCA自动化", example: "DCA into BTC weekly" },
      { nameEn: "Signal bot", nameZh: "信号机器人", example: "Create signal bot" },
      { nameEn: "Copy trading", nameZh: "跟单交易", example: "Follow top trader" },
      { nameEn: "Bot monitoring", nameZh: "Bot监控", example: "Show my active bots" },
    ],
  },
];

interface CustomSkill {
  id: string;
  name: string;
  description: string;
  color: string;
  tags: string[];
  tools: string[];
  prompt: string;
  createdAt: number;
}

const iconMap: Record<string, any> = { BarChart3, Terminal, Wallet, Bot, Zap };

export default function AgentSkills() {
  const { t } = useLanguage();
  const [activeSkill, setActiveSkill] = useState("okx-cex-market");
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>(() => {
    return JSON.parse(localStorage.getItem("okx-custom-skills") || "[]");
  });

  // Creator form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newTools, setNewTools] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("okx-custom-skills", JSON.stringify(customSkills));
  }, [customSkills]);

  const saveSkill = () => {
    if (!newName.trim()) return;
    const skill: CustomSkill = {
      id: editingId || `custom-${Date.now()}`,
      name: newName,
      description: newDesc,
      color: "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0"),
      tags: newTags.split(",").map((t) => t.trim()).filter(Boolean),
      tools: newTools.split(",").map((t) => t.trim()).filter(Boolean),
      prompt: newPrompt,
      createdAt: Date.now(),
    };

    if (editingId) {
      setCustomSkills((prev) => prev.map((s) => s.id === editingId ? skill : s));
    } else {
      setCustomSkills((prev) => [...prev, skill]);
    }

    resetForm();
  };

  const deleteSkill = (id: string) => {
    setCustomSkills((prev) => prev.filter((s) => s.id !== id));
    if (activeSkill === id) setActiveSkill("okx-cex-market");
  };

  const editSkill = (skill: CustomSkill) => {
    setEditingId(skill.id);
    setNewName(skill.name);
    setNewDesc(skill.description);
    setNewTags(skill.tags.join(", "));
    setNewTools(skill.tools.join(", "));
    setNewPrompt(skill.prompt);
    setShowCreator(true);
  };

  const resetForm = () => {
    setShowCreator(false);
    setEditingId(null);
    setNewName("");
    setNewDesc("");
    setNewTags("");
    setNewTools("");
    setNewPrompt("");
  };

  const exportSkills = () => {
    const blob = new Blob([JSON.stringify(customSkills, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `okx-custom-skills-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSkills = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as CustomSkill[];
        setCustomSkills((prev) => [...prev, ...data]);
      } catch { /* ignore */ }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const builtinSkill = BUILTIN_SKILLS.find((s) => s.id === activeSkill);
  const customSkill = customSkills.find((s) => s.id === activeSkill);
  const isBuiltin = !!builtinSkill;

  const copyInstall = () => {
    if (builtinSkill) {
      navigator.clipboard.writeText(builtinSkill.install);
    } else if (customSkill) {
      navigator.clipboard.writeText(customSkill.prompt);
    }
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Zap className="w-4 h-4" />
            <span>{t("Core Integration", "核心集成")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Agent Skills</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("Plug-and-Play Skills", "即插即用技能")}</h1>
              <p className="text-muted-foreground">
                {t("4 official skills + create your own custom skills.", "4个官方技能 + 创建你自己的自定义技能。")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreator(!showCreator)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                {t("Create Skill", "创建技能")}
              </button>
              {customSkills.length > 0 && (
                <button onClick={exportSkills} className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground" title="Export">
                  <Download className="w-4 h-4" />
                </button>
              )}
              <label className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground cursor-pointer" title="Import">
                <Upload className="w-4 h-4" />
                <input type="file" accept=".json" onChange={importSkills} className="hidden" />
              </label>
            </div>
          </div>
        </motion.div>

        {/* Install all */}
        <div className="glass-card p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="text-muted-foreground">$</span>
            <span className="text-primary">npx skills add okx/agent-skills</span>
          </div>
          <button onClick={() => navigator.clipboard.writeText("npx skills add okx/agent-skills")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* Skill Creator Panel */}
        <AnimatePresence>
          {showCreator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary" />
                    {editingId ? t("Edit Skill", "编辑技能") : t("Create Custom Skill", "创建自定义技能")}
                  </h3>
                  <button onClick={resetForm} className="text-muted-foreground"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t("Skill Name", "技能名称")} *</label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Whale Tracker"
                      className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t("Tags (comma-separated)", "标签 (逗号分隔)")}</label>
                    <input
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      placeholder="e.g. Whale, Alert, Custom"
                      className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">{t("Description", "描述")}</label>
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="What does this skill do?"
                    className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">{t("MCP Tools Used (comma-separated)", "使用的MCP工具 (逗号分隔)")}</label>
                  <input
                    value={newTools}
                    onChange={(e) => setNewTools(e.target.value)}
                    placeholder="e.g. market_ticker, market_orderbook, spot_place_order"
                    className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">{t("Prompt Template", "Prompt模板")}</label>
                  <textarea
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Write the prompt template for this skill..."
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                  />
                </div>
                <button
                  onClick={saveSkill}
                  disabled={!newName.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-30"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? t("Update Skill", "更新技能") : t("Save Skill", "保存技能")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill Tabs — Built-in */}
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">{t("Official Skills", "官方技能")} (4)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {BUILTIN_SKILLS.map((s) => {
            const SIcon = iconMap[s.iconName] || Zap;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSkill(s.id)}
                className={`p-4 rounded-xl text-left transition-all ${
                  activeSkill === s.id
                    ? "glass-card border-primary/20 shadow-lg shadow-primary/5"
                    : "border border-border/30 hover:border-border/60 hover:bg-accent/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SIcon className="w-5 h-5" style={{ color: s.color }} />
                  <span className="font-mono text-[10px]" style={{ color: s.color }}>{s.id}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{t(s.nameEn, s.nameZh)}</h3>
                <div className="flex flex-wrap gap-1">
                  {s.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">#{tag}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Skills */}
        {customSkills.length > 0 && (
          <>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {t("Custom Skills", "自定义技能")} ({customSkills.length})
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              {customSkills.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSkill(s.id)}
                  className={`p-4 rounded-xl text-left transition-all relative group ${
                    activeSkill === s.id
                      ? "glass-card border-primary/20 shadow-lg shadow-primary/5"
                      : "border border-border/30 hover:border-border/60 hover:bg-accent/30"
                  }`}
                >
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); editSkill(s); }}
                      className="p-1 rounded bg-accent/50 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSkill(s.id); }}
                      className="p-1 rounded bg-accent/50 text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5" style={{ color: s.color }} />
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Custom</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{s.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {s.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Skill Detail */}
        <motion.div key={activeSkill} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {isBuiltin && builtinSkill && (
            <>
              <div className="glass-card p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${builtinSkill.color}15`, border: `1px solid ${builtinSkill.color}30` }}>
                    {(() => { const SIcon = iconMap[builtinSkill.iconName] || Zap; return <SIcon className="w-6 h-6" style={{ color: builtinSkill.color }} />; })()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1">{t(builtinSkill.nameEn, builtinSkill.nameZh)}</h2>
                    <p className="text-sm text-muted-foreground">{t(builtinSkill.descEn, builtinSkill.descZh)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border/50">
                  <span className="text-muted-foreground font-mono text-xs">$</span>
                  <span className="font-mono text-xs text-primary flex-1">{builtinSkill.install}</span>
                  <button onClick={copyInstall} className="text-muted-foreground hover:text-foreground transition-colors">
                    {copiedCmd ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">{t("Capabilities", "能力列表")}</h3>
                <div className="space-y-3">
                  {builtinSkill.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t(cap.nameEn, cap.nameZh)}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">"{cap.example}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!isBuiltin && customSkill && (
            <>
              <div className="glass-card p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${customSkill.color}15`, border: `1px solid ${customSkill.color}30` }}>
                    <Zap className="w-6 h-6" style={{ color: customSkill.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">{customSkill.name}</h2>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">Custom</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{customSkill.description}</p>
                  </div>
                </div>
                {customSkill.tools.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-xs text-muted-foreground">{t("MCP Tools:", "MCP工具:")}</span>
                    {customSkill.tools.map((tool) => (
                      <span key={tool} className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/5 border border-primary/10 text-primary font-mono">
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
                {customSkill.prompt && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">{t("Prompt Template", "Prompt模板")}</span>
                      <button onClick={copyInstall} className="flex items-center gap-1 text-xs text-primary">
                        {copiedCmd ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedCmd ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="p-4 rounded-lg bg-background border border-border/50 text-xs font-mono text-foreground/80 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {customSkill.prompt}
                    </pre>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => editSkill(customSkill)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm font-medium hover:bg-accent/50">
                  <Edit3 className="w-4 h-4" /> {t("Edit", "编辑")}
                </button>
                <button onClick={() => deleteSkill(customSkill.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-sm font-medium text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" /> {t("Delete", "删除")}
                </button>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <a
              href="https://github.com/okx/agent-trade-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              {t("Browse on GitHub", "在GitHub查看")}
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
