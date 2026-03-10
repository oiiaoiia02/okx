import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, ChevronRight, Activity, Cpu, HardDrive, Wifi, Shield, Clock, TrendingUp, Zap } from "lucide-react";

const CHAINS = [
  { name: "Ethereum", symbol: "ETH", tps: "15.2", gasGwei: "23", validators: "945,231", tvl: "$48.2B", status: "healthy", color: "#627eea" },
  { name: "Arbitrum", symbol: "ARB", tps: "42.8", gasGwei: "0.1", validators: "—", tvl: "$3.1B", status: "healthy", color: "#28a0f0" },
  { name: "Polygon", symbol: "MATIC", tps: "35.1", gasGwei: "30", validators: "100+", tvl: "$1.2B", status: "healthy", color: "#8247e5" },
  { name: "Solana", symbol: "SOL", tps: "3,420", gasGwei: "—", validators: "1,800+", tvl: "$5.8B", status: "healthy", color: "#14f195" },
  { name: "BNB Chain", symbol: "BNB", tps: "62.5", gasGwei: "3", validators: "29", tvl: "$5.4B", status: "healthy", color: "#f3ba2f" },
  { name: "X Layer", symbol: "OKB", tps: "28.3", gasGwei: "0.01", validators: "—", tvl: "$420M", status: "healthy", color: "#000000" },
];

const DEFI_PROTOCOLS = [
  { name: "Uniswap V3", tvl: "$5.2B", vol24h: "$1.8B", chain: "Multi", apy: "12.4%" },
  { name: "Aave V3", tvl: "$12.8B", vol24h: "$340M", chain: "Multi", apy: "4.2%" },
  { name: "Lido", tvl: "$22.1B", vol24h: "$89M", chain: "ETH", apy: "3.8%" },
  { name: "MakerDAO", tvl: "$8.4B", vol24h: "$120M", chain: "ETH", apy: "5.1%" },
  { name: "Curve", tvl: "$2.1B", vol24h: "$450M", chain: "Multi", apy: "8.7%" },
];

export default function OnchainOS() {
  const { t } = useLanguage();
  const [blockNumber, setBlockNumber] = useState(19234567);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlockNumber((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 12000);
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
          <p className="text-muted-foreground">{t("Multi-chain overview with real-time network stats and DeFi protocol data.", "多链概览，实时网络状态和DeFi协议数据。")}</p>
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
              <span>ETH Block #{blockNumber.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>{t("Live data", "实时数据")}</span>
          </div>
        </div>

        {/* Chain Cards */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-primary" />
          {t("Network Status", "网络状态")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {CHAINS.map((chain, i) => (
            <motion.div
              key={chain.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
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
                  <p className="text-[10px] text-muted-foreground">{t("TPS", "TPS")}</p>
                  <p className="text-sm font-mono font-medium">{chain.tps}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("Gas", "Gas")}</p>
                  <p className="text-sm font-mono font-medium">{chain.gasGwei} {chain.gasGwei !== "—" ? "Gwei" : ""}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("Validators", "验证者")}</p>
                  <p className="text-sm font-mono font-medium">{chain.validators}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">TVL</p>
                  <p className="text-sm font-mono font-medium">{chain.tvl}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* DeFi Protocols */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          {t("Top DeFi Protocols", "顶级DeFi协议")}
        </h2>
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Protocol", "协议")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">TVL</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">{t("24h Volume", "24h成交量")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("Chain", "链")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">APY</th>
              </tr>
            </thead>
            <tbody>
              {DEFI_PROTOCOLS.map((protocol, i) => (
                <motion.tr key={protocol.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium">{protocol.name}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono">{protocol.tvl}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground hidden sm:table-cell">{protocol.vol24h}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">{protocol.chain}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-green-400">{protocol.apy}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
