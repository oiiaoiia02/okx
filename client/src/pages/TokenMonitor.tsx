import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Eye, ChevronRight, RefreshCw, Plus, X, TrendingUp, TrendingDown, Search } from "lucide-react";

interface TokenData {
  id: string; symbol: string; name: string; current_price: number;
  price_change_percentage_24h: number; market_cap: number; total_volume: number;
  image: string; sparkline_in_7d?: { price: number[] };
}

const DEFAULT_TOKENS = ["bitcoin", "ethereum", "solana", "dogecoin", "ripple", "cardano", "avalanche-2", "polkadot", "chainlink", "uniswap"];

export default function TokenMonitor() {
  const { t } = useLanguage();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("neuro-link-watchlist");
    return saved ? JSON.parse(saved) : DEFAULT_TOKENS;
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      const ids = watchlist.join(",");
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=true`);
      if (res.ok) {
        const data = await res.json();
        setTokens(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch tokens:", err);
    } finally {
      setLoading(false);
    }
  }, [watchlist]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);
  useEffect(() => {
    const interval = setInterval(fetchTokens, 60000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  useEffect(() => {
    localStorage.setItem("neuro-link-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  const removeToken = (id: string) => setWatchlist((prev) => prev.filter((t) => t !== id));

  const formatNum = (n: number) => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toLocaleString()}`;
  };

  const filteredTokens = tokens.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const MiniSparkline = ({ prices, positive }: { prices: number[]; positive: boolean }) => {
    if (!prices || prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 80;
    const h = 30;
    const step = w / (prices.length - 1);
    const points = prices.map((p, i) => `${i * step},${h - ((p - min) / range) * h}`).join(" ");
    return (
      <svg width={w} height={h} className="opacity-60">
        <polyline fill="none" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth="1.5" points={points} />
      </svg>
    );
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Eye className="w-4 h-4" />
            <span>{t("Tools", "实用工具")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Token Monitor", "代币监控")}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t("Token Monitor", "代币监控")}</h1>
              <p className="text-muted-foreground">
                {t("Real-time prices from CoinGecko. Auto-refresh every 60s.", "CoinGecko实时价格。每60秒自动刷新。")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  {t("Updated", "更新于")} {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button onClick={fetchTokens} disabled={loading} className="p-2 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search tokens...", "搜索代币...")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Token Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Token", "代币")}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("Price", "价格")}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">24h</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">{t("Market Cap", "市值")}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("Volume", "成交量")}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">7d</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token, i) => {
                  const positive = token.price_change_percentage_24h >= 0;
                  return (
                    <motion.tr
                      key={token.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={token.image} alt={token.symbol} className="w-7 h-7 rounded-full" />
                          <div>
                            <span className="font-medium text-sm">{token.name}</span>
                            <span className="text-xs text-muted-foreground ml-2 uppercase">{token.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        ${token.current_price < 1 ? token.current_price.toFixed(6) : token.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-medium ${positive ? "text-green-400" : "text-red-400"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(token.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground hidden sm:table-cell">{formatNum(token.market_cap)}</td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground hidden md:table-cell">{formatNum(token.total_volume)}</td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <MiniSparkline prices={token.sparkline_in_7d?.price || []} positive={positive} />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeToken(token.id)} className="text-muted-foreground/50 hover:text-destructive transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
