import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Share2, ChevronRight, Download, Twitter, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const CARD_TEMPLATES = [
  { id: "pnl", nameEn: "P&L Card", nameZh: "盈亏卡片" },
  { id: "trade", nameEn: "Trade Card", nameZh: "交易卡片" },
  { id: "portfolio", nameEn: "Portfolio Card", nameZh: "组合卡片" },
];

export default function ShareToX() {
  const { t } = useLanguage();
  const [activeTemplate, setActiveTemplate] = useState("pnl");
  const cardRef = useRef<HTMLDivElement>(null);

  const shareToX = () => {
    const text = encodeURIComponent(`My trading performance on Neuro-Link 🚀\n\n+$1,481.40 (+14.8%) this week\nWin Rate: 72.5%\nSharpe: 1.85\n\nBuilt with OKX Agent Trade Kit\n#OKX #AI #Trading #NeuroLink\n\nby @Chen1904o`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Share2 className="w-4 h-4" />
            <span>{t("Advanced", "高级")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Share to X", "分享到X")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Share to X", "分享到 X")}</h1>
          <p className="text-muted-foreground">{t("Generate beautiful trading cards and share to X (Twitter).", "生成精美的交易卡片并分享到X (Twitter)。")}</p>
        </motion.div>

        {/* Template Selector */}
        <div className="flex gap-2 mb-6">
          {CARD_TEMPLATES.map((tp) => (
            <button
              key={tp.id}
              onClick={() => setActiveTemplate(tp.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTemplate === tp.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground border border-transparent hover:bg-accent/50"
              }`}
            >
              {t(tp.nameEn, tp.nameZh)}
            </button>
          ))}
        </div>

        {/* Card Preview */}
        <div ref={cardRef} className="glass-card overflow-hidden mb-6">
          {activeTemplate === "pnl" && (
            <div className="p-8 bg-gradient-to-br from-background via-background to-primary/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">NL</span>
                </div>
                <span className="font-bold">Neuro-Link</span>
                <span className="text-xs text-muted-foreground ml-auto">Weekly P&L</span>
              </div>
              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-1">{t("Total P&L", "总盈亏")}</p>
                <p className="text-4xl font-bold text-green-400">+$1,481.40</p>
                <p className="text-sm text-green-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +14.8%
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("Win Rate", "胜率")}</p>
                  <p className="text-lg font-bold">72.5%</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("Sharpe", "夏普")}</p>
                  <p className="text-lg font-bold">1.85</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("Trades", "交易数")}</p>
                  <p className="text-lg font-bold">47</p>
                </div>
              </div>
              {/* Mini chart */}
              <svg viewBox="0 0 300 60" className="w-full h-16 mb-4">
                <defs>
                  <linearGradient id="shareGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon fill="url(#shareGrad)" points="0,60 0,50 30,45 60,48 90,35 120,38 150,25 180,20 210,22 240,15 270,10 300,5 300,60" />
                <polyline fill="none" stroke="#22c55e" strokeWidth="2" points="0,50 30,45 60,48 90,35 120,38 150,25 180,20 210,22 240,15 270,10 300,5" />
              </svg>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Built by @Chen1904o</span>
                <span>Powered by OKX Agent Trade Kit</span>
              </div>
            </div>
          )}

          {activeTemplate === "trade" && (
            <div className="p-8 bg-gradient-to-br from-background via-background to-blue-500/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">NL</span>
                </div>
                <span className="font-bold">Neuro-Link</span>
                <span className="text-xs text-muted-foreground ml-auto">Trade Card</span>
              </div>
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">BTC-USDT</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-medium">LONG</span>
                </div>
                <p className="text-2xl font-bold text-green-400">+$567.80</p>
                <p className="text-xs text-muted-foreground mt-1">Entry: $86,100 → Exit: $87,432</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Built by @Chen1904o</span>
                <span>Powered by OKX Agent Trade Kit</span>
              </div>
            </div>
          )}

          {activeTemplate === "portfolio" && (
            <div className="p-8 bg-gradient-to-br from-background via-background to-purple-500/5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">NL</span>
                </div>
                <span className="font-bold">Neuro-Link</span>
                <span className="text-xs text-muted-foreground ml-auto">Portfolio</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{t("Total Value", "总价值")}</p>
              <p className="text-3xl font-bold mb-4">$52,340.82</p>
              <div className="space-y-2 mb-4">
                {[
                  { token: "BTC", pct: "45%", value: "$23,553", change: "+2.1%" },
                  { token: "ETH", pct: "30%", value: "$15,702", change: "+0.8%" },
                  { token: "SOL", pct: "15%", value: "$7,851", change: "+5.2%" },
                  { token: "Others", pct: "10%", value: "$5,234", change: "-0.3%" },
                ].map((item) => (
                  <div key={item.token} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.token} <span className="text-xs text-muted-foreground">{item.pct}</span></span>
                    <div className="text-right">
                      <span className="font-mono">{item.value}</span>
                      <span className={`text-xs ml-2 ${item.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}>{item.change}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Built by @Chen1904o</span>
                <span>Powered by OKX Agent Trade Kit</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={shareToX}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Twitter className="w-4 h-4" />
            {t("Share to X", "分享到 X")}
          </button>
        </div>
      </div>
    </div>
  );
}
