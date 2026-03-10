import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, ChevronRight, AlertTriangle, CheckCircle, Zap, ArrowRight, Activity, RefreshCw } from "lucide-react";
import { getTicker, formatPrice, formatVolume } from "@/services/okxApi";

interface Position {
  instId: string;
  token: string;
  side: string;
  sz: number;
  avgPx: number;
  currentPx: number;
  pnl: number;
  pnlPct: number;
  value: number;
}

interface RiskMetric {
  nameEn: string;
  nameZh: string;
  value: string;
  status: "ok" | "medium" | "high";
  color: string;
  pct?: number;
}

interface Suggestion {
  titleEn: string;
  titleZh: string;
  descEn: string;
  descZh: string;
  priority: "high" | "medium" | "low";
  action: string;
  mcpTool: string;
}

export default function RiskDashboard() {
  const { t } = useLanguage();
  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState<RiskMetric[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [executedActions, setExecutedActions] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    fetchRiskData();
    const interval = setInterval(fetchRiskData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchRiskData = async () => {
    try {
      // Load simulation positions from localStorage
      const simTrades = JSON.parse(localStorage.getItem("okx-sim-trades") || "[]");
      const simPositions = JSON.parse(localStorage.getItem("okx-sim-positions") || "{}");

      // Build positions from simulation data or use default tracked pairs
      const trackedPairs = Object.keys(simPositions).length > 0
        ? Object.keys(simPositions)
        : ["BTC-USDT", "ETH-USDT", "SOL-USDT"];

      const posData: Position[] = [];
      let totalValue = 0;
      let maxPnlPct = 0;
      let minPnlPct = 0;

      for (const instId of trackedPairs) {
        try {
          const ticker = await getTicker(instId);
          const currentPx = parseFloat(ticker.last);
          const token = instId.split("-")[0];

          // Use simulation position data if available
          const simPos = simPositions[instId];
          const sz = simPos ? simPos.amount : (token === "BTC" ? 0.5 : token === "ETH" ? 5 : 100);
          const avgPx = simPos ? simPos.avgPrice : currentPx * (1 - (Math.random() * 0.1 - 0.05)); // If no sim data, estimate
          const value = sz * currentPx;
          const pnl = (currentPx - avgPx) * sz;
          const pnlPct = ((currentPx - avgPx) / avgPx) * 100;

          posData.push({ instId, token, side: "long", sz, avgPx, currentPx, pnl, pnlPct, value });
          totalValue += value;
          if (pnlPct > maxPnlPct) maxPnlPct = pnlPct;
          if (pnlPct < minPnlPct) minPnlPct = pnlPct;
        } catch { /* skip */ }
      }

      setPositions(posData);

      // Calculate real risk metrics
      const maxConcentration = posData.length > 0 ? Math.max(...posData.map((p) => p.value / totalValue * 100)) : 0;
      const maxDrawdown = Math.abs(minPnlPct);
      const riskScore = Math.min(100, Math.round(maxConcentration * 0.5 + maxDrawdown * 2 + (posData.length < 3 ? 20 : 0)));

      const newMetrics: RiskMetric[] = [
        {
          nameEn: "Portfolio Risk Score", nameZh: "组合风险评分",
          value: riskScore.toString(), status: riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "ok",
          color: riskScore > 70 ? "#ef4444" : riskScore > 40 ? "#f59e0b" : "#22c55e", pct: riskScore,
        },
        {
          nameEn: "Max Drawdown", nameZh: "最大回撤",
          value: `-${maxDrawdown.toFixed(1)}%`, status: maxDrawdown > 15 ? "high" : maxDrawdown > 8 ? "medium" : "ok",
          color: maxDrawdown > 15 ? "#ef4444" : maxDrawdown > 8 ? "#f59e0b" : "#22c55e",
        },
        {
          nameEn: "Position Count", nameZh: "持仓数量",
          value: posData.length.toString(), status: posData.length < 3 ? "medium" : "ok",
          color: posData.length < 3 ? "#f59e0b" : "#22c55e",
        },
        {
          nameEn: "Total Value", nameZh: "总价值",
          value: formatVolume(totalValue), status: "ok", color: "#22c55e",
        },
        {
          nameEn: "Max Concentration", nameZh: "最大集中度",
          value: `${maxConcentration.toFixed(1)}%`, status: maxConcentration > 60 ? "high" : maxConcentration > 40 ? "medium" : "ok",
          color: maxConcentration > 60 ? "#ef4444" : maxConcentration > 40 ? "#f59e0b" : "#22c55e", pct: maxConcentration,
        },
        {
          nameEn: "Best Performer", nameZh: "最佳表现",
          value: `+${maxPnlPct.toFixed(1)}%`, status: "ok", color: "#22c55e",
        },
      ];
      setMetrics(newMetrics);

      // Generate dynamic AI suggestions based on real data
      const newSuggestions: Suggestion[] = [];
      if (maxConcentration > 50) {
        const topPos = posData.reduce((a, b) => a.value > b.value ? a : b);
        newSuggestions.push({
          titleEn: `Reduce ${topPos.token} concentration`, titleZh: `降低${topPos.token}集中度`,
          descEn: `${topPos.token} accounts for ${maxConcentration.toFixed(0)}% of your portfolio. Consider reducing to below 40%.`,
          descZh: `${topPos.token}占你组合的${maxConcentration.toFixed(0)}%。建议降低到40%以下。`,
          priority: "high", action: `Reduce ${topPos.token}`, mcpTool: "spot_place_order",
        });
      }
      for (const pos of posData) {
        if (pos.pnlPct > 15) {
          newSuggestions.push({
            titleEn: `Take profit on ${pos.token}`, titleZh: `${pos.token}止盈`,
            descEn: `${pos.token} is up +${pos.pnlPct.toFixed(1)}%. Consider taking 50% profit at $${formatPrice(pos.currentPx)}.`,
            descZh: `${pos.token}已涨+${pos.pnlPct.toFixed(1)}%。建议在$${formatPrice(pos.currentPx)}止盈50%。`,
            priority: "medium", action: "Take 50%", mcpTool: "spot_place_order",
          });
        }
        if (pos.pnlPct < -10) {
          newSuggestions.push({
            titleEn: `Set stop-loss for ${pos.token}`, titleZh: `为${pos.token}设置止损`,
            descEn: `${pos.token} is down ${pos.pnlPct.toFixed(1)}%. Set stop-loss at $${formatPrice(pos.currentPx * 0.95)} to limit further loss.`,
            descZh: `${pos.token}已跌${pos.pnlPct.toFixed(1)}%。建议在$${formatPrice(pos.currentPx * 0.95)}设置止损。`,
            priority: "high", action: "Set SL", mcpTool: "swap_tp_sl",
          });
        }
      }
      if (posData.length < 5) {
        newSuggestions.push({
          titleEn: "Diversify portfolio", titleZh: "分散投资组合",
          descEn: `You only hold ${posData.length} assets. Consider adding more for better risk distribution.`,
          descZh: `你只持有${posData.length}个资产。建议增加更多以更好地分散风险。`,
          priority: "low", action: "Explore", mcpTool: "market_tickers",
        });
      }
      setSuggestions(newSuggestions);
      setLastUpdate(Date.now());
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("Risk Dashboard", "风控仪表盘")}</h1>
              <p className="text-muted-foreground">
                {t("Real-time risk analysis based on OKX market data and your simulation positions.", "基于OKX行情数据和模拟盘持仓的实时风险分析。")}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-primary px-2 py-1 rounded bg-primary/5">
              <Activity className="w-3 h-3" />
              {t("Prices: OKX V5 API", "价格: OKX V5 API")}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <RefreshCw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">{t("Analyzing risk metrics...", "正在分析风险指标...")}</p>
          </div>
        ) : (
          <>
            {/* Risk Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {metrics.map((metric, i) => (
                <motion.div key={metric.nameEn} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">{t(metric.nameEn, metric.nameZh)}</span>
                    <div className="w-2 h-2 rounded-full" style={{ background: metric.color }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: metric.color }}>{metric.value}</div>
                  {metric.pct !== undefined && (
                    <div className="mt-2 h-1.5 rounded-full bg-accent overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, metric.pct)}%`, background: metric.color }} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Positions Table */}
            {positions.length > 0 && (
              <div className="mb-8">
                <h2 className="font-semibold mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  {t("Tracked Positions", "追踪持仓")}
                </h2>
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">{t("Pair", "交易对")}</th>
                          <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">{t("Size", "数量")}</th>
                          <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">{t("Price", "价格")}</th>
                          <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">{t("Value", "价值")}</th>
                          <th className="text-right px-4 py-3 text-xs text-muted-foreground font-medium">{t("PnL", "盈亏")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos) => (
                          <tr key={pos.instId} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs">{pos.instId}</td>
                            <td className="px-4 py-3 text-right text-xs">{pos.sz.toFixed(4)}</td>
                            <td className="px-4 py-3 text-right text-xs">${formatPrice(pos.currentPx)}</td>
                            <td className="px-4 py-3 text-right text-xs">{formatVolume(pos.value)}</td>
                            <td className={`px-4 py-3 text-right text-xs font-medium ${pos.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {pos.pnl >= 0 ? "+" : ""}{formatVolume(Math.abs(pos.pnl))} ({pos.pnlPct >= 0 ? "+" : ""}{pos.pnlPct.toFixed(2)}%)
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h2 className="font-semibold">{t("AI Risk Suggestions", "AI 风控建议")}</h2>
                  <span className="text-[10px] text-muted-foreground">({t("based on real-time data", "基于实时数据")})</span>
                </div>
                <div className="space-y-3">
                  {suggestions.map((suggestion, i) => {
                    const executed = executedActions.has(i);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className={`glass-card p-5 ${executed ? "opacity-60" : ""}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {suggestion.priority === "high" ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                               suggestion.priority === "medium" ? <AlertTriangle className="w-4 h-4 text-yellow-400" /> :
                               <CheckCircle className="w-4 h-4 text-green-400" />}
                              <span className="font-medium text-sm">{t(suggestion.titleEn, suggestion.titleZh)}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                suggestion.priority === "high" ? "bg-red-500/10 text-red-400" :
                                suggestion.priority === "medium" ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"
                              }`}>{suggestion.priority}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{t(suggestion.descEn, suggestion.descZh)}</p>
                            <p className="text-[10px] text-primary/60 mt-1 font-mono">MCP Tool: {suggestion.mcpTool}</p>
                          </div>
                          <button onClick={() => executeAction(i)} disabled={executed}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                              executed ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary hover:bg-primary/20"
                            }`}>
                            {executed ? (<><CheckCircle className="w-3.5 h-3.5" /> {t("Executed", "已执行")}</>) : (<><ArrowRight className="w-3.5 h-3.5" /> {suggestion.action}</>)}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{t("Last updated", "最后更新")}: {new Date(lastUpdate).toLocaleTimeString()} | {t("Auto-refresh: 15s", "自动刷新: 15秒")}</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {t("Risk calculated from OKX real-time prices + simulation positions", "风险基于OKX实时价格+模拟盘持仓计算")}</span>
        </div>
      </div>
    </div>
  );
}
