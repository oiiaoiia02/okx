import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, ChevronRight, AlertTriangle, CheckCircle, TrendingDown, Zap, ArrowRight } from "lucide-react";

const RISK_METRICS = [
  { nameEn: "Portfolio Risk Score", nameZh: "组合风险评分", value: "72", max: "100", status: "medium", color: "#f59e0b" },
  { nameEn: "Max Drawdown", nameZh: "最大回撤", value: "-8.3%", status: "ok", color: "#22c55e" },
  { nameEn: "Leverage Ratio", nameZh: "杠杆率", value: "3.2x", status: "medium", color: "#f59e0b" },
  { nameEn: "Liquidation Distance", nameZh: "爆仓距离", value: "42.1%", status: "ok", color: "#22c55e" },
  { nameEn: "Concentration Risk", nameZh: "集中度风险", value: "High", status: "high", color: "#ef4444" },
  { nameEn: "Funding Rate Exposure", nameZh: "资金费率敞口", value: "-0.012%", status: "ok", color: "#22c55e" },
];

const AI_SUGGESTIONS = [
  { titleEn: "Reduce BTC-USDT-SWAP position", titleZh: "减少BTC合约持仓", descEn: "Your BTC position accounts for 68% of total exposure. Consider reducing to below 40% for better diversification.", descZh: "你的BTC持仓占总敞口的68%。建议减少到40%以下以获得更好的分散化。", priority: "high", action: "Reduce 30%" },
  { titleEn: "Set stop-loss on ETH position", titleZh: "为ETH持仓设置止损", descEn: "Your ETH-USDT-SWAP long has no stop-loss. Set SL at $3,200 to limit downside risk.", descZh: "你的ETH合约多头没有止损。建议在$3,200设置止损以限制下行风险。", priority: "medium", action: "Set SL" },
  { titleEn: "Take partial profits", titleZh: "部分止盈", descEn: "SOL position is up +23%. Consider taking 50% profit to lock in gains.", descZh: "SOL持仓已盈利+23%。建议止盈50%以锁定收益。", priority: "low", action: "Take 50%" },
];

export default function RiskDashboard() {
  const { t } = useLanguage();
  const [executedActions, setExecutedActions] = useState<Set<number>>(new Set());

  const executeAction = (idx: number) => {
    setExecutedActions((prev) => new Set(prev).add(idx));
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Shield className="w-4 h-4" />
            <span>{t("Tools", "实用工具")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Risk Dashboard", "风控仪表盘")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Risk Dashboard", "风控仪表盘")}</h1>
          <p className="text-muted-foreground">{t("Monitor risk metrics and execute AI-powered suggestions.", "监控风险指标并执行AI驱动的建议。")}</p>
        </motion.div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {RISK_METRICS.map((metric, i) => (
            <motion.div
              key={metric.nameEn}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{t(metric.nameEn, metric.nameZh)}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: metric.color }} />
              </div>
              <div className="text-2xl font-bold" style={{ color: metric.color }}>{metric.value}</div>
              {metric.max && (
                <div className="mt-2 h-1.5 rounded-full bg-accent overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(parseFloat(metric.value) / parseFloat(metric.max)) * 100}%`, background: metric.color }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* AI Suggestions */}
        <div className="mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">{t("AI Risk Suggestions", "AI 风控建议")}</h2>
        </div>
        <div className="space-y-3">
          {AI_SUGGESTIONS.map((suggestion, i) => {
            const executed = executedActions.has(i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-5 ${executed ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {suggestion.priority === "high" ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : suggestion.priority === "medium" ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      <span className="font-medium text-sm">{t(suggestion.titleEn, suggestion.titleZh)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        suggestion.priority === "high" ? "bg-red-500/10 text-red-400" :
                        suggestion.priority === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-green-500/10 text-green-400"
                      }`}>
                        {suggestion.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{t(suggestion.descEn, suggestion.descZh)}</p>
                  </div>
                  <button
                    onClick={() => executeAction(i)}
                    disabled={executed}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      executed
                        ? "bg-green-500/10 text-green-400"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {executed ? (
                      <><CheckCircle className="w-3.5 h-3.5" /> {t("Executed", "已执行")}</>
                    ) : (
                      <><ArrowRight className="w-3.5 h-3.5" /> {suggestion.action}</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Demo Mode Notice */}
        <div className="mt-8 glass-card p-4 flex items-start gap-3 border-l-2 border-primary">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">{t("Demo Mode", "演示模式")}</p>
            <p className="text-xs text-muted-foreground">
              {t("All data shown is simulated. In production, connect your OKX API key (read-only recommended) for real risk monitoring.", "所有数据均为模拟。在生产环境中，连接你的OKX API密钥（建议只读）以获取真实风险监控。")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
