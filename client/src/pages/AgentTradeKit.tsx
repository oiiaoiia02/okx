import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Search, Copy, Check, Play, ChevronRight, Terminal,
  Activity, Loader2, ExternalLink,
} from "lucide-react";
import { getTicker, getCandles, getOrderbook, getFundingRate } from "@/services/okxApi";
import SafetyModal from "@/components/SafetyModal";

const MODULES = [
  { id: "market", nameEn: "Market", nameZh: "行情", color: "#22c55e", tools: [
    { name: "market_ticker", desc: "Get real-time ticker", descZh: "获取实时行情", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "market_orderbook", desc: "Get orderbook depth", descZh: "获取订单簿深度", params: [{ name: "instId", type: "string", example: "ETH-USDT" }, { name: "sz", type: "number", example: "20" }] },
    { name: "market_candles", desc: "Get candlestick data", descZh: "获取K线数据", params: [{ name: "instId", type: "string", example: "BTC-USDT" }, { name: "bar", type: "string", example: "1H" }, { name: "limit", type: "number", example: "24" }] },
    { name: "market_index_tickers", desc: "Get index tickers", descZh: "获取指数行情", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "market_funding_rate", desc: "Get funding rate", descZh: "获取资金费率", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "market_open_interest", desc: "Get open interest", descZh: "获取持仓量", params: [{ name: "instType", type: "string", example: "SWAP" }] },
    { name: "market_trades", desc: "Get recent trades", descZh: "获取最近成交", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "market_24h_volume", desc: "Get 24h volume", descZh: "获取24小时成交量", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "market_mark_price", desc: "Get mark price", descZh: "获取标记价格", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "market_instruments", desc: "Get instrument info", descZh: "获取交易产品信息", params: [{ name: "instType", type: "string", example: "SPOT" }] },
    { name: "market_history_candles", desc: "Get history candles", descZh: "获取历史K线", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "market_estimated_price", desc: "Get estimated price", descZh: "获取预估价格", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
  ]},
  { id: "spot", nameEn: "Spot", nameZh: "现货", color: "#3b82f6", tools: [
    { name: "spot_place_order", desc: "Place spot order", descZh: "下现货单", params: [{ name: "instId", type: "string", example: "BTC-USDT" }, { name: "side", type: "string", example: "buy" }, { name: "sz", type: "string", example: "0.01" }] },
    { name: "spot_cancel_order", desc: "Cancel spot order", descZh: "撤销现货单", params: [{ name: "instId", type: "string", example: "BTC-USDT" }, { name: "ordId", type: "string", example: "123456" }] },
    { name: "spot_amend_order", desc: "Amend spot order", descZh: "修改现货单", params: [{ name: "instId", type: "string", example: "BTC-USDT" }, { name: "ordId", type: "string", example: "123456" }] },
    { name: "spot_batch_orders", desc: "Batch place orders", descZh: "批量下单", params: [{ name: "orders", type: "array", example: "[]" }] },
    { name: "spot_batch_cancel", desc: "Batch cancel orders", descZh: "批量撤单", params: [{ name: "orders", type: "array", example: "[]" }] },
    { name: "spot_order_details", desc: "Get order details", descZh: "获取订单详情", params: [{ name: "instId", type: "string", example: "BTC-USDT" }, { name: "ordId", type: "string", example: "123456" }] },
    { name: "spot_pending_orders", desc: "Get pending orders", descZh: "获取挂单列表", params: [{ name: "instType", type: "string", example: "SPOT" }] },
    { name: "spot_order_history", desc: "Get order history", descZh: "获取历史订单", params: [{ name: "instType", type: "string", example: "SPOT" }] },
    { name: "spot_fills", desc: "Get fill history", descZh: "获取成交明细", params: [{ name: "instType", type: "string", example: "SPOT" }] },
    { name: "spot_algo_order", desc: "Place algo order", descZh: "下算法单", params: [{ name: "instId", type: "string", example: "BTC-USDT" }, { name: "ordType", type: "string", example: "conditional" }] },
    { name: "spot_cancel_algo", desc: "Cancel algo order", descZh: "撤销算法单", params: [{ name: "algoId", type: "string", example: "789" }] },
    { name: "spot_algo_history", desc: "Get algo history", descZh: "获取算法单历史", params: [{ name: "ordType", type: "string", example: "conditional" }] },
  ]},
  { id: "swap", nameEn: "Swap/Futures", nameZh: "合约", color: "#a855f7", tools: [
    { name: "swap_place_order", desc: "Place swap order", descZh: "下合约单", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }, { name: "side", type: "string", example: "buy" }, { name: "sz", type: "string", example: "1" }] },
    { name: "swap_cancel_order", desc: "Cancel swap order", descZh: "撤销合约单", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "swap_get_positions", desc: "Get positions", descZh: "获取持仓", params: [{ name: "instType", type: "string", example: "SWAP" }] },
    { name: "swap_set_leverage", desc: "Set leverage", descZh: "设置杠杆", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }, { name: "lever", type: "string", example: "10" }] },
    { name: "swap_close_position", desc: "Close position", descZh: "平仓", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "swap_margin_balance", desc: "Adjust margin", descZh: "调整保证金", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "swap_position_history", desc: "Position history", descZh: "历史持仓", params: [{ name: "instType", type: "string", example: "SWAP" }] },
    { name: "swap_batch_orders", desc: "Batch swap orders", descZh: "批量合约下单", params: [{ name: "orders", type: "array", example: "[]" }] },
    { name: "swap_batch_cancel", desc: "Batch cancel", descZh: "批量撤单", params: [{ name: "orders", type: "array", example: "[]" }] },
    { name: "swap_algo_order", desc: "Swap algo order", descZh: "合约算法单", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "swap_tp_sl", desc: "Set TP/SL", descZh: "设置止盈止损", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "swap_trailing_stop", desc: "Trailing stop", descZh: "追踪止损", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
  ]},
  { id: "option", nameEn: "Options", nameZh: "期权", color: "#f59e0b", tools: [
    { name: "option_place_order", desc: "Place option order", descZh: "下期权单", params: [{ name: "instId", type: "string", example: "BTC-USD-240329-80000-C" }] },
    { name: "option_cancel_order", desc: "Cancel option order", descZh: "撤销期权单", params: [{ name: "instId", type: "string", example: "BTC-USD-240329-80000-C" }] },
    { name: "option_positions", desc: "Get option positions", descZh: "获取期权持仓", params: [{ name: "instType", type: "string", example: "OPTION" }] },
    { name: "option_greeks", desc: "Get option greeks", descZh: "获取希腊字母", params: [{ name: "instId", type: "string", example: "BTC-USD-240329-80000-C" }] },
    { name: "option_chain", desc: "Get option chain", descZh: "获取期权链", params: [{ name: "uly", type: "string", example: "BTC-USD" }] },
    { name: "option_exercise", desc: "Exercise option", descZh: "行权", params: [{ name: "instId", type: "string", example: "BTC-USD-240329-80000-C" }] },
  ]},
  { id: "account", nameEn: "Account", nameZh: "账户", color: "#06b6d4", tools: [
    { name: "account_balance", desc: "Get account balance", descZh: "获取账户余额", params: [] },
    { name: "account_positions", desc: "Get all positions", descZh: "获取所有持仓", params: [] },
    { name: "account_bills", desc: "Get billing history", descZh: "获取账单历史", params: [{ name: "type", type: "string", example: "1" }] },
    { name: "account_config", desc: "Get account config", descZh: "获取账户配置", params: [] },
    { name: "account_set_position_mode", desc: "Set position mode", descZh: "设置持仓模式", params: [{ name: "posMode", type: "string", example: "long_short_mode" }] },
    { name: "account_fee_rates", desc: "Get fee rates", descZh: "获取手续费率", params: [{ name: "instType", type: "string", example: "SPOT" }] },
    { name: "account_max_size", desc: "Get max order size", descZh: "获取最大下单量", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "account_max_avail_size", desc: "Max available size", descZh: "最大可用数量", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "account_interest", desc: "Get interest accrued", descZh: "获取计息", params: [] },
    { name: "account_max_loan", desc: "Get max loan", descZh: "获取最大借币量", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "account_risk_state", desc: "Get risk state", descZh: "获取风险状态", params: [] },
    { name: "account_transfer", desc: "Fund transfer", descZh: "资金划转", params: [{ name: "ccy", type: "string", example: "USDT" }, { name: "amt", type: "string", example: "100" }] },
  ]},
  { id: "bot", nameEn: "Bot/Grid", nameZh: "Bot/网格", color: "#ec4899", tools: [
    { name: "bot_grid_create", desc: "Create grid bot", descZh: "创建网格机器人", params: [{ name: "instId", type: "string", example: "ETH-USDT" }, { name: "gridNum", type: "string", example: "10" }] },
    { name: "bot_grid_stop", desc: "Stop grid bot", descZh: "停止网格机器人", params: [{ name: "algoId", type: "string", example: "123" }] },
    { name: "bot_grid_orders", desc: "Get grid orders", descZh: "获取网格订单", params: [{ name: "algoId", type: "string", example: "123" }] },
    { name: "bot_grid_positions", desc: "Grid positions", descZh: "网格持仓", params: [{ name: "algoId", type: "string", example: "123" }] },
    { name: "bot_dca_create", desc: "Create DCA bot", descZh: "创建DCA机器人", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "bot_dca_stop", desc: "Stop DCA bot", descZh: "停止DCA机器人", params: [{ name: "algoId", type: "string", example: "456" }] },
    { name: "bot_signal_create", desc: "Create signal bot", descZh: "创建信号机器人", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "bot_recurring_buy", desc: "Recurring buy", descZh: "定投", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
    { name: "bot_smart_portfolio", desc: "Smart portfolio", descZh: "智能组合", params: [] },
    { name: "bot_copy_trading", desc: "Copy trading", descZh: "跟单交易", params: [{ name: "leaderId", type: "string", example: "leader123" }] },
    { name: "bot_arbitrage", desc: "Arbitrage bot", descZh: "套利机器人", params: [{ name: "instId", type: "string", example: "BTC-USDT" }] },
  ]},
  { id: "futures", nameEn: "Futures Extra", nameZh: "期货扩展", color: "#ef4444", tools: [
    { name: "futures_delivery_price", desc: "Delivery price", descZh: "交割价格", params: [{ name: "instId", type: "string", example: "BTC-USD-240329" }] },
    { name: "futures_estimated_delivery", desc: "Estimated delivery", descZh: "预估交割价", params: [{ name: "instId", type: "string", example: "BTC-USD-240329" }] },
    { name: "futures_long_short_ratio", desc: "Long/short ratio", descZh: "多空比", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "futures_taker_volume", desc: "Taker buy/sell vol", descZh: "主买主卖量", params: [{ name: "instId", type: "string", example: "BTC-USDT-SWAP" }] },
    { name: "futures_insurance_fund", desc: "Insurance fund", descZh: "风险准备金", params: [{ name: "instType", type: "string", example: "SWAP" }] },
    { name: "futures_liquidation_orders", desc: "Liquidation orders", descZh: "强平订单", params: [{ name: "instType", type: "string", example: "SWAP" }] },
  ]},
];

const REAL_API_MAP: Record<string, (p: Record<string, string>) => Promise<any>> = {
  market_ticker: async (p) => ({ code: "0", data: [await getTicker(p.instId || "BTC-USDT")] }),
  market_orderbook: async (p) => ({ code: "0", data: [await getOrderbook(p.instId || "BTC-USDT", p.sz || "20")] }),
  market_candles: async (p) => ({ code: "0", data: await getCandles(p.instId || "BTC-USDT", p.bar || "1H", p.limit || "24") }),
  market_funding_rate: async (p) => ({ code: "0", data: [await getFundingRate(p.instId || "BTC-USDT-SWAP")] }),
  market_index_tickers: async (p) => (await fetch(`https://www.okx.com/api/v5/market/index-tickers?instId=${p.instId || "BTC-USDT"}`)).json(),
  market_open_interest: async (p) => (await fetch(`https://www.okx.com/api/v5/public/open-interest?instType=${p.instType || "SWAP"}`)).json(),
  market_trades: async (p) => (await fetch(`https://www.okx.com/api/v5/market/trades?instId=${p.instId || "BTC-USDT"}&limit=20`)).json(),
  market_24h_volume: async (p) => { const t = await getTicker(p.instId || "BTC-USDT"); return { code: "0", data: [{ instId: t.instId, vol24h: t.vol24h, volCcy24h: t.volCcy24h }] }; },
  market_mark_price: async (p) => (await fetch(`https://www.okx.com/api/v5/public/mark-price?instId=${p.instId || "BTC-USDT-SWAP"}&instType=SWAP`)).json(),
  market_instruments: async (p) => { const r = await (await fetch(`https://www.okx.com/api/v5/public/instruments?instType=${p.instType || "SPOT"}`)).json(); return { ...r, data: r.data?.slice(0, 20) }; },
  market_history_candles: async (p) => (await fetch(`https://www.okx.com/api/v5/market/history-candles?instId=${p.instId || "BTC-USDT"}&bar=1D&limit=30`)).json(),
  market_estimated_price: async (p) => (await fetch(`https://www.okx.com/api/v5/public/estimated-price?instId=${p.instId || "BTC-USDT"}`)).json(),
};

async function getSimResult(toolName: string, params: Record<string, string>) {
  let realPrice = "0";
  const instId = params.instId || "BTC-USDT";
  try {
    const base = instId.replace("-SWAP", "").split("-").slice(0, 2).join("-");
    if (base.includes("-")) { const t = await getTicker(base); realPrice = t.last; }
  } catch { /* skip */ }

  if (toolName.includes("place_order")) {
    return { code: "0", msg: "SIMULATED — Connect MCP Server for real execution", data: [{ ordId: `sim-${Date.now()}`, instId, side: params.side || "buy", sz: params.sz || "0.01", fillPx: realPrice, state: "filled", mode: "demo", ts: Date.now().toString() }] };
  }
  if (toolName.includes("balance")) {
    return { code: "0", msg: "SIMULATED", data: [{ totalEq: "100000.00", details: [{ ccy: "USDT", availBal: "50000.00" }, { ccy: "BTC", availBal: "0.5" }, { ccy: "ETH", availBal: "10.0" }] }] };
  }
  if (toolName.includes("positions")) {
    return { code: "0", msg: "SIMULATED", data: [{ instId: "BTC-USDT-SWAP", pos: "1", avgPx: realPrice, upl: "0.00", lever: "10", mgnMode: "cross" }] };
  }
  if (toolName.includes("grid_create")) {
    return { code: "0", msg: "SIMULATED", data: [{ algoId: `grid-${Date.now()}`, instId, gridNum: params.gridNum || "10", state: "running", mode: "demo" }] };
  }
  if (toolName.includes("cancel") || toolName.includes("stop")) {
    return { code: "0", msg: "SIMULATED", data: [{ ordId: params.ordId || params.algoId || "sim-123", state: "cancelled" }] };
  }
  return { code: "0", msg: "SIMULATED — This tool requires MCP Server connection for real execution. Use the MCP Payload below with your local MCP server.", data: [{ tool: toolName, params, status: "demo_mode", realPrice, note: "Connect ws://localhost:8765 for live execution" }] };
}

export default function AgentTradeKit() {
  const { t } = useLanguage();
  const [activeModule, setActiveModule] = useState("market");
  const [search, setSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultSource, setResultSource] = useState<"real" | "simulated">("simulated");
  const [showSafety, setShowSafety] = useState(false);

  const currentModule = MODULES.find((m) => m.id === activeModule)!;
  const filteredTools = useMemo(() => {
    if (!search) return currentModule.tools;
    const q = search.toLowerCase();
    return currentModule.tools.filter((tool) =>
      tool.name.toLowerCase().includes(q) || tool.desc.toLowerCase().includes(q) || tool.descZh.includes(q)
    );
  }, [currentModule, search]);

  const totalTools = MODULES.reduce((sum, m) => sum + m.tools.length, 0);
  const selectedToolData = currentModule.tools.find((tool) => tool.name === selectedTool);

  const generatePayload = () => {
    if (!selectedToolData) return "";
    const params: Record<string, any> = {};
    selectedToolData.params.forEach((p) => { params[p.name] = paramValues[p.name] || p.example; });
    return JSON.stringify({ tool: selectedToolData.name, params, mode: "demo" }, null, 2);
  };

  const generateCLI = () => {
    if (!selectedToolData) return "";
    const parts = selectedToolData.name.split("_");
    const args = selectedToolData.params.map((p) => `--${p.name} ${paramValues[p.name] || p.example}`).join(" ");
    return `okx-agent ${parts[0]} ${parts.slice(1).join("-")} ${args} --demo`.trim();
  };

  const handleExecute = async () => {
    if (!selectedToolData) return;
    setExecuting(true);
    setResult(null);

    const resolvedParams: Record<string, string> = {};
    selectedToolData.params.forEach((p) => { resolvedParams[p.name] = paramValues[p.name] || p.example; });

    const realHandler = REAL_API_MAP[selectedToolData.name];
    if (realHandler) {
      try {
        const data = await realHandler(resolvedParams);
        setResult(JSON.stringify(data, null, 2));
        setResultSource("real");
      } catch (err: any) {
        setResult(JSON.stringify({ error: err.message, note: "OKX API error. Check parameters." }, null, 2));
        setResultSource("real");
      }
    } else {
      const simResult = await getSimResult(selectedToolData.name, resolvedParams);
      setResult(JSON.stringify(simResult, null, 2));
      setResultSource("simulated");
    }
    setExecuting(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <SafetyModal open={showSafety} onConfirm={() => { setShowSafety(false); handleExecute(); }} onCancel={() => setShowSafety(false)} tool={selectedTool || ""} params={paramValues} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Terminal className="w-4 h-4" />
            <span>{t("Core Integration", "核心集成")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Agent Trade Kit</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Agent Trade Kit</h1>
          <p className="text-muted-foreground">
            {t(`${totalTools} tools across ${MODULES.length} modules. Market tools execute against real OKX V5 API.`, `${totalTools}个工具覆盖${MODULES.length}大模块。行情工具直接调用OKX V5真实API。`)}
          </p>
        </motion.div>

        {/* Module Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {MODULES.map((mod) => (
            <button key={mod.id} onClick={() => { setActiveModule(mod.id); setSelectedTool(null); setSearch(""); setResult(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeModule === mod.id ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground border border-transparent hover:bg-accent/50"}`}>
              <span className="w-2 h-2 rounded-full" style={{ background: mod.color }} />
              {t(mod.nameEn, mod.nameZh)}
              <span className="text-xs opacity-60">{mod.tools.length}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tool List */}
          <div className="lg:col-span-1">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search tools...", "搜索工具...")}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
              {filteredTools.map((tool) => (
                <button key={tool.name} onClick={() => { setSelectedTool(tool.name); setParamValues({}); setResult(null); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${selectedTool === tool.name ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50 border border-transparent"}`}>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-xs text-primary flex-1">{tool.name}</div>
                    {REAL_API_MAP[tool.name] && <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">LIVE</span>}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">{t(tool.desc, tool.descZh)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tool Detail */}
          <div className="lg:col-span-2">
            {selectedToolData ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-mono text-primary font-semibold">{selectedToolData.name}</h3>
                    {REAL_API_MAP[selectedToolData.name] ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Real OKX API
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        Requires MCP Server
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{t(selectedToolData.desc, selectedToolData.descZh)}</p>
                  {selectedToolData.params.length > 0 && (
                    <div className="space-y-3">
                      {selectedToolData.params.map((p) => (
                        <div key={p.name}>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">{p.name} <span className="text-xs opacity-50">({p.type})</span></label>
                          <input type="text" value={paramValues[p.name] || ""} onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })} placeholder={p.example}
                            className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button onClick={handleExecute} disabled={executing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                      {executing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      {executing ? t("Calling OKX API...", "调用OKX API...") : REAL_API_MAP[selectedToolData.name] ? t("Execute (Real API)", "执行 (真实API)") : t("Simulate Execute", "模拟执行")}
                    </button>
                  </div>
                </div>

                {/* MCP Payload */}
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <span className="text-xs font-medium text-muted-foreground">MCP JSON Payload</span>
                    <button onClick={() => copyText(generatePayload())} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} {t("Copy", "复制")}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-green-400 overflow-x-auto">{generatePayload()}</pre>
                </div>

                {/* CLI Command */}
                <div className="glass-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                    <span className="text-xs font-medium text-muted-foreground">CLI Command</span>
                    <button onClick={() => copyText(generateCLI())} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />} {t("Copy", "复制")}
                    </button>
                  </div>
                  <div className="p-4 font-mono text-xs text-primary">$ {generateCLI()}</div>
                </div>

                {/* Result */}
                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${resultSource === "real" ? "bg-green-400" : "bg-yellow-400"}`} />
                        <span className="text-xs font-medium text-muted-foreground">
                          {resultSource === "real" ? t("Real OKX API Response", "OKX真实API响应") : t("Simulated Response (Demo)", "模拟响应 (Demo)")}
                        </span>
                      </div>
                      {resultSource === "real" && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" /> {t("Data from OKX V5 Official API", "数据来自OKX V5官方API")}
                        </span>
                      )}
                    </div>
                    <pre className="p-4 text-xs font-mono text-foreground/80 overflow-x-auto max-h-96 overflow-y-auto">{result}</pre>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <div className="glass-card p-12 text-center">
                <Terminal className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">{t("Select a tool to view details and execute", "选择一个工具查看详情并执行")}</p>
                <p className="text-xs text-muted-foreground/60 mt-2">{t("Market tools return real OKX data. Trade tools require MCP Server.", "行情工具返回OKX真实数据。交易工具需要MCP Server。")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
