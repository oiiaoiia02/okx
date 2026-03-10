import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, ChevronRight, Activity, Wifi, Clock, Zap, RefreshCw } from "lucide-react";
import { getTicker, formatPrice, formatVolume } from "@/services/okxApi";

interface ChainData {
  name: string;
  symbol: string;
  instId: string;
  color: string;
  price?: number;
  change24h?: number;
  volume?: number;
  tps: string;
  validators: string;
}

const CHAIN_CONFIG: ChainData[] = [
  { name: "Ethereum", symbol: "ETH", instId: "ETH-USDT", color: "#627eea", tps: "~15", validators: "945K+" },
  { name: "Solana", symbol: "SOL", instId: "SOL-USDT", color: "#14f195", tps: "~3,000", validators: "1,800+" },
  { name: "BNB Chain", symbol: "BNB", instId: "BNB-USDT", color: "#f3ba2f", tps: "~60", validators: "29" },
  { name: "Polygon", symbol: "POL", instId: "POL-USDT", color: "#8247e5", tps: "~35", validators: "100+" },
  { name: "Avalanche", symbol: "AVAX", instId: "AVAX-USDT", color: "#e84142", tps: "~4,500", validators: "1,200+" },
  { name: "X Layer (OKB)", symbol: "OKB", instId: "OKB-USDT", color: "#121212", tps: "~28", validators: "—" },
];

export default function OnchainOS() {
  const { t } = useLanguage();
  const [chains, setChains] = useState<ChainData[]>(CHAIN_CONFIG);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchChainData = async () => {
    const updated = [...CHAIN_CONFIG];
    for (const chain of updated) {
      try {
        const ticker = await getTicker(chain.instId);
        const price = parseFloat(ticker.last);
        const open = parseFloat(ticker.open24h);
        chain.price = price;
        chain.change24h = ((price - open) / open) * 100;
        chain.volume = parseFloat(ticker.volCcy24h);
      } catch {
        // Keep defaults
      }
    }
    setChains(updated);
    setLastUpdate(Date.now());
    setLoading(false);
  };

  useEffect(() => {
    fetchChainData();
    const interval = setInterval(fetchChainData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Globe className="w-4 h-4" />
            <span>{t("Advanced", "高级")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">OnchainOS</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("OnchainOS Dashboard", "OnchainOS 全景仪表盘")}</h1>
          <p className="text-muted-foreground">{t("Multi-chain overview with real-time token prices from OKX V5 API.", "多链概览，代币价格来自OKX V5 API实时数据。")}</p>
        </motion.div>

        {/* Network Status Bar */}
        <div className="glass-card p-4 mb-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium">{t("All Networks Operational", "所有网络正常运行")}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{t("Last update", "最后更新")}: {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-primary px-2 py-1 rounded bg-primary/5">
            <Activity className="w-3 h-3" />
            {t("Prices: OKX V5 API", "价格: OKX V5 API")}
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-12 text-center">
            <RefreshCw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">{t("Fetching chain data from OKX...", "正在从OKX获取链数据...")}</p>
          </div>
        ) : (
          <>
            {/* Chain Cards */}
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-primary" />
              {t("Network Status & Token Prices", "网络状态 & 代币价格")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {chains.map((chain, i) => (
                <motion.div key={chain.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="glass-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: chain.color }}>
                        {chain.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{chain.name}</h3>
                        <span className="text-xs text-muted-foreground">{chain.symbol}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-green-400">{t("Healthy", "健康")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t("Price", "价格")}</p>
                      <p className="text-sm font-mono font-medium">${chain.price ? formatPrice(chain.price) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">24h</p>
                      <p className={`text-sm font-mono font-medium ${chain.change24h && chain.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {chain.change24h !== undefined ? `${chain.change24h >= 0 ? "+" : ""}${chain.change24h.toFixed(2)}%` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t("TPS", "TPS")}</p>
                      <p className="text-sm font-mono font-medium">{chain.tps}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">{t("24h Volume", "24h成交量")}</p>
                      <p className="text-sm font-mono font-medium">{chain.volume ? formatVolume(chain.volume) : "—"}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* OKX Ecosystem highlight */}
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {t("OKX Ecosystem Integration", "OKX 生态集成")}
            </h2>
            <div className="glass-card p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("Agent Trade Kit", "Agent Trade Kit")}</p>
                  <p className="text-2xl font-bold text-primary">83</p>
                  <p className="text-xs text-muted-foreground">{t("tools across 7 modules", "工具覆盖7大模块")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("MCP + CLI", "MCP + CLI")}</p>
                  <p className="text-2xl font-bold text-primary">2</p>
                  <p className="text-xs text-muted-foreground">{t("dual entry points", "双入口")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("Skills", "Skills")}</p>
                  <p className="text-2xl font-bold text-primary">4</p>
                  <p className="text-xs text-muted-foreground">{t("built-in + custom", "内置 + 自定义")}</p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 text-[10px] text-muted-foreground flex items-center gap-1">
          <Activity className="w-3 h-3" />
          {t("Token prices from OKX V5 /market/ticker API. Network stats are reference values.", "代币价格来自OKX V5 /market/ticker API。网络统计为参考值。")}
        </div>
      </div>
    </div>
  );
}
