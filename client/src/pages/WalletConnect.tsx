import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Wallet, ChevronRight, RefreshCw, Shield, ExternalLink, Copy, Check, AlertTriangle } from "lucide-react";

export default function WalletConnect() {
  const { t } = useLanguage();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasProvider = typeof window !== "undefined" && (window as any).okxwallet;

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
    try {
      const provider = (window as any).okxwallet;
      const bal = await provider.request({ method: "eth_getBalance", params: [address, "latest"] });
      setBalance((parseInt(bal, 16) / 1e18).toFixed(6));
    } catch {}
  }, [address, hasProvider]);

  useEffect(() => {
    if (!address) return;
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [address, refreshBalance]);

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

  const chainName = chainId === "0x1" ? "Ethereum Mainnet" : chainId === "0x89" ? "Polygon" : chainId === "0xa4b1" ? "Arbitrum" : chainId ? `Chain ${parseInt(chainId, 16)}` : "Unknown";

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
            {t("Connect your OKX Wallet to view balances and interact with on-chain data.", "连接你的OKX钱包查看余额并与链上数据交互。")}
          </p>
        </motion.div>

        {/* Security Notice */}
        <div className="glass-card p-4 mb-6 flex items-start gap-3 border-l-2 border-primary">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">{t("Security First", "安全第一")}</p>
            <p className="text-xs text-muted-foreground">
              {t("Your private keys never leave your wallet. This app only reads public data (address, balance). No transactions are signed without your explicit approval.", "你的私钥永远不会离开钱包。本应用仅读取公开数据（地址、余额）。未经你明确批准不会签署任何交易。")}
            </p>
          </div>
        </div>

        {!address ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t("Connect Your Wallet", "连接你的钱包")}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {t("Connect OKX Wallet to view your ETH balance and chain info.", "连接OKX钱包查看ETH余额和链信息。")}
            </p>
            <button
              onClick={connect}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {connecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {connecting ? t("Connecting...", "连接中...") : t("Connect OKX Wallet", "连接 OKX 钱包")}
            </button>
            {!hasProvider && (
              <div className="mt-4">
                <a
                  href="https://www.okx.com/web3"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-green-400">{t("Connected", "已连接")}</span>
                </div>
                <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
                  {t("Disconnect", "断开连接")}
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("Address", "地址")}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{address.slice(0, 6)}...{address.slice(-4)}</span>
                    <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("Chain", "链")}</p>
                  <span className="text-sm">{chainName}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">{t("ETH Balance", "ETH 余额")}</p>
                    <button onClick={refreshBalance} className="text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-2xl font-bold">{balance} <span className="text-sm text-muted-foreground">ETH</span></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
