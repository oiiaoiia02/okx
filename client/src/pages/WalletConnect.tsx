import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTicker } from "@/services/okxApi";
import {
  Wallet, ChevronRight, RefreshCw, Shield, ExternalLink, Copy, Check,
  AlertTriangle, Zap, Globe, ArrowUpRight, ArrowDownLeft, Clock,
} from "lucide-react";

const CHAINS: Record<string, { name: string; symbol: string; color: string; explorer: string }> = {
  "0x1": { name: "Ethereum", symbol: "ETH", color: "#627eea", explorer: "https://etherscan.io" },
  "0x89": { name: "Polygon", symbol: "MATIC", color: "#8247e5", explorer: "https://polygonscan.com" },
  "0xa4b1": { name: "Arbitrum", symbol: "ETH", color: "#28a0f0", explorer: "https://arbiscan.io" },
  "0xa": { name: "Optimism", symbol: "ETH", color: "#ff0420", explorer: "https://optimistic.etherscan.io" },
  "0x38": { name: "BNB Chain", symbol: "BNB", color: "#f0b90b", explorer: "https://bscscan.com" },
  "0xa86a": { name: "Avalanche", symbol: "AVAX", color: "#e84142", explorer: "https://snowtrace.io" },
  "0x66eed": { name: "Arbitrum Goerli", symbol: "ETH", color: "#28a0f0", explorer: "https://goerli.arbiscan.io" },
};

interface TxRecord {
  hash: string;
  type: "send" | "receive";
  amount: string;
  symbol: string;
  timestamp: number;
}

export default function WalletConnect() {
  const { t } = useLanguage();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [ethPrice, setEthPrice] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [txHistory] = useState<TxRecord[]>(() => {
    return JSON.parse(localStorage.getItem("okx-tx-history") || "[]");
  });
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasProvider = typeof window !== "undefined" && (window as any).okxwallet;

  // Fetch ETH price for USD estimation
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const ticker = await getTicker("ETH-USDT");
        setEthPrice(parseFloat(ticker.last));
      } catch {}
    };
    fetchPrice();
    const iv = setInterval(fetchPrice, 15000);
    return () => clearInterval(iv);
  }, []);

  const connect = useCallback(async () => {
    if (!hasProvider) {
      setError(t("OKX Wallet not detected. Please install OKX Wallet extension.", "未检测到OKX钱包。请安装OKX Wallet浏览器扩展。"));
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const provider = (window as any).okxwallet;
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        const chain = await provider.request({ method: "eth_chainId" });
        setChainId(chain);
        const bal = await provider.request({ method: "eth_getBalance", params: [accounts[0], "latest"] });
        setBalance((parseInt(bal, 16) / 1e18).toFixed(6));
      }
    } catch (err: any) {
      setError(err.message || t("Connection failed", "连接失败"));
    } finally {
      setConnecting(false);
    }
  }, [hasProvider, t]);

  const refreshBalance = useCallback(async () => {
    if (!address || !hasProvider) return;
    setRefreshing(true);
    try {
      const provider = (window as any).okxwallet;
      const bal = await provider.request({ method: "eth_getBalance", params: [address, "latest"] });
      setBalance((parseInt(bal, 16) / 1e18).toFixed(6));
    } catch {}
    setTimeout(() => setRefreshing(false), 500);
  }, [address, hasProvider]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!address) return;
    refreshBalance();
    refreshTimerRef.current = setInterval(refreshBalance, 15000);
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [address, refreshBalance]);

  // Listen for chain/account changes
  useEffect(() => {
    if (!hasProvider) return;
    const provider = (window as any).okxwallet;
    const handleChainChanged = (newChainId: string) => setChainId(newChainId);
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) { setAddress(null); setBalance(null); setChainId(null); }
      else { setAddress(accounts[0]); refreshBalance(); }
    };
    provider.on?.("chainChanged", handleChainChanged);
    provider.on?.("accountsChanged", handleAccountsChanged);
    return () => {
      provider.removeListener?.("chainChanged", handleChainChanged);
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, [hasProvider, refreshBalance]);

  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const chain = chainId ? CHAINS[chainId] || { name: `Chain ${parseInt(chainId, 16)}`, symbol: "ETH", color: "#888", explorer: "" } : null;
  const balNum = balance ? parseFloat(balance) : 0;
  const usdValue = balNum * ethPrice;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Wallet className="w-4 h-4" />
            <span>{t("Core Integration", "核心集成")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Wallet Connect", "钱包连接")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("OKX Wallet Connection", "OKX 钱包连接")}</h1>
          <p className="text-muted-foreground">
            {t(
              "Connect your OKX Wallet to view real-time balances, USD value, and interact with on-chain data.",
              "连接你的OKX钱包查看实时余额、USD估值并与链上数据交互。"
            )}
          </p>
        </motion.div>

        {/* Security Notice */}
        <div className="glass-card p-4 mb-6 flex items-start gap-3 border-l-2 border-primary">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">{t("Security First", "安全第一")}</p>
            <p className="text-xs text-muted-foreground">
              {t(
                "Read-only access. Private keys never leave your wallet. No transactions signed without explicit approval. Uses eth_getBalance RPC only.",
                "只读访问。私钥永远不会离开钱包。未经明确批准不会签署任何交易。仅使用 eth_getBalance RPC。"
              )}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!address ? (
            <motion.div key="connect" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="glass-card p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t("Connect Your Wallet", "连接你的钱包")}</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {t(
                  "Connect OKX Wallet to view real-time ETH balance with USD estimation via OKX V5 API.",
                  "连接OKX钱包，通过OKX V5 API查看实时ETH余额和USD估值。"
                )}
              </p>

              {/* Supported chains */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {Object.entries(CHAINS).slice(0, 6).map(([id, c]) => (
                  <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-[500] border border-border/30" style={{ color: c.color }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                ))}
              </div>

              <button
                onClick={connect}
                disabled={connecting}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                {connecting ? t("Connecting...", "连接中...") : t("Connect OKX Wallet", "连接 OKX 钱包")}
              </button>

              {!hasProvider && (
                <div className="mt-4">
                  <a href="https://www.okx.com/web3" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    {t("Install OKX Wallet", "安装 OKX 钱包")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-destructive justify-center">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="connected" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Main Balance Card */}
              <div className="glass-card p-6 relative overflow-hidden">
                {/* Chain indicator glow */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{ background: chain?.color || "#00e68a" }} />

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-medium text-green-400">{t("Connected", "已连接")}</span>
                    {chain && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: `${chain.color}40`, color: chain.color }}>
                        {chain.name}
                      </span>
                    )}
                  </div>
                  <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-1 rounded-lg hover:bg-destructive/10">
                    {t("Disconnect", "断开连接")}
                  </button>
                </div>

                {/* Address */}
                <div className="mb-6">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[1px] mb-1.5">{t("Address", "地址")}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{address.slice(0, 8)}...{address.slice(-6)}</span>
                    <button onClick={copyAddress} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {chain?.explorer && (
                      <a href={`${chain.explorer}/address/${address}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Balance */}
                <div className="p-5 rounded-2xl bg-accent/30 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[1px]">{t("Balance", "余额")}</p>
                    <button onClick={refreshBalance} className={`p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all ${refreshing ? "animate-spin" : ""}`}>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-[700] tracking-tight">{balance}</span>
                    <span className="text-sm text-muted-foreground mb-1">{chain?.symbol || "ETH"}</span>
                  </div>
                  {ethPrice > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-[500]">
                        OKX V5 API
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{t("Auto Refresh", "自动刷新")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("Every 15 seconds", "每15秒")}</p>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{t("Multi-chain", "多链支持")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("ETH, Polygon, Arb...", "ETH, Polygon, Arb...")}</p>
                  </div>
                </div>
              </div>

              {/* RPC Method Info */}
              <div className="glass-card p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[1px] mb-3">{t("RPC Methods Used", "使用的RPC方法")}</p>
                <div className="space-y-2">
                  {[
                    { method: "eth_requestAccounts", desc: t("Request wallet connection", "请求钱包连接") },
                    { method: "eth_getBalance", desc: t("Query real-time balance", "查询实时余额") },
                    { method: "eth_chainId", desc: t("Get current chain", "获取当前链") },
                  ].map((rpc) => (
                    <div key={rpc.method} className="flex items-center justify-between py-2 px-3 rounded-lg bg-accent/20">
                      <code className="text-[11px] font-mono text-primary">{rpc.method}</code>
                      <span className="text-[10px] text-muted-foreground">{rpc.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              {txHistory.length > 0 && (
                <div className="glass-card p-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[1px] mb-3">{t("Recent Activity", "最近活动")}</p>
                  <div className="space-y-2">
                    {txHistory.slice(0, 5).map((tx) => (
                      <div key={tx.hash} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          {tx.type === "send" ? <ArrowUpRight className="w-4 h-4 text-red-400" /> : <ArrowDownLeft className="w-4 h-4 text-green-400" />}
                          <div>
                            <p className="text-xs font-medium">{tx.type === "send" ? t("Sent", "发送") : t("Received", "接收")}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{tx.hash.slice(0, 10)}...</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-mono">{tx.amount} {tx.symbol}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
