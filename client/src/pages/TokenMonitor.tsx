import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTicker, getCandles, formatPrice, formatVolume, type OKXTickerData } from "@/services/okxApi";
import {
  Eye, ChevronRight, RefreshCw, Plus, X, TrendingUp, TrendingDown,
  Search, Activity, ExternalLink, ArrowUpDown, Clock,
} from "lucide-react";

interface WatchlistToken {
  instId: string;
  ticker?: OKXTickerData;
  candles?: number[];
  loading: boolean;
  error?: string;
}

const DEFAULT_PAIRS = [
  "BTC-USDT", "ETH-USDT", "SOL-USDT", "DOGE-USDT", "XRP-USDT",
  "ADA-USDT", "AVAX-USDT", "DOT-USDT", "LINK-USDT", "UNI-USDT",
];

const POPULAR_PAIRS = [
  "BTC-USDT", "ETH-USDT", "SOL-USDT", "DOGE-USDT", "XRP-USDT",
  "ADA-USDT", "AVAX-USDT", "DOT-USDT", "LINK-USDT", "UNI-USDT",
  "MATIC-USDT", "ATOM-USDT", "FIL-USDT", "APT-USDT", "ARB-USDT",
  "OP-USDT", "SUI-USDT", "NEAR-USDT", "PEPE-USDT", "WIF-USDT",
  "TON-USDT", "TRX-USDT", "LTC-USDT", "BCH-USDT", "SHIB-USDT",
];

export default function TokenMonitor() {
  const { t } = useLanguage();
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("okx-ai-core-watchlist");
    return saved ? JSON.parse(saved) : DEFAULT_PAIRS;
  });
  const [tokens, setTokens] = useState<Map<string, WatchlistToken>>(new Map());
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price" | "change" | "volume">("default");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Fetch all tickers from OKX V5 API
  const fetchAllTickers = useCallback(async () => {
    setRefreshing(true);
    const newTokens = new Map<string, WatchlistToken>();

    await Promise.all(
      watchlist.map(async (instId) => {
        const existing = tokens.get(instId);
        newTokens.set(instId, { instId, loading: true, ticker: existing?.ticker, candles: existing?.candles });

        try {
          const ticker = await getTicker(instId);
          // Also fetch 7d candles for sparkline
          let candles: number[] = [];
          try {
            const candleData = await getCandles(instId, "4H", "42"); // ~7 days of 4H candles
            candles = candleData.map((c) => parseFloat(c.c)); // close prices
          } catch { /* candles optional */ }

          newTokens.set(instId, { instId, ticker, candles, loading: false });
        } catch (err: any) {
          newTokens.set(instId, {
            instId,
            loading: false,
            error: err.message,
            ticker: existing?.ticker,
            candles: existing?.candles,
          });
        }
      })
    );

    setTokens(newTokens);
    setLastUpdate(new Date());
    setRefreshing(false);
  }, [watchlist]);

  // Initial fetch + auto-refresh every 8 seconds
  useEffect(() => {
    fetchAllTickers();
    intervalRef.current = setInterval(fetchAllTickers, 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAllTickers]);

  // Save watchlist
  useEffect(() => {
    localStorage.setItem("okx-ai-core-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Add token
  const addToken = (instId: string) => {
    if (!watchlist.includes(instId)) {
      setWatchlist((prev) => [...prev, instId]);
    }
    setShowAddPanel(false);
    setAddSearch("");
  };

  // Remove token
  const removeToken = (instId: string) => {
    setWatchlist((prev) => prev.filter((p) => p !== instId));
  };

  // Sort tokens
  const sortedTokens = [...watchlist]
    .map((instId) => tokens.get(instId) || { instId, loading: true })
    .filter((t) => {
      if (!search) return true;
      return t.instId.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "default") return 0;
      const aT = a.ticker;
      const bT = b.ticker;
      if (!aT || !bT) return 0;
      const mul = sortDir === "desc" ? -1 : 1;
      if (sortBy === "price") return (parseFloat(aT.last) - parseFloat(bT.last)) * mul;
      if (sortBy === "change") {
        const aChg = (parseFloat(aT.last) - parseFloat(aT.open24h)) / parseFloat(aT.open24h);
        const bChg = (parseFloat(bT.last) - parseFloat(bT.open24h)) / parseFloat(bT.open24h);
        return (aChg - bChg) * mul;
      }
      if (sortBy === "volume") return (parseFloat(aT.volCcy24h) - parseFloat(bT.volCcy24h)) * mul;
      return 0;
    });

  // Toggle sort
  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  // Mini sparkline
  const MiniSparkline = ({ prices, positive }: { prices: number[]; positive: boolean }) => {
    if (!prices || prices.length < 2) return null;
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

  // Filtered add suggestions
  const addSuggestions = POPULAR_PAIRS.filter(
    (p) => !watchlist.includes(p) && (!addSearch || p.toLowerCase().includes(addSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container">
        {/* Header */}
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
                {t(
                  "Real-time prices from OKX V5 Official API. Auto-refresh every 8s.",
                  "OKX V5官方API实时价格。每8秒自动刷新。"
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                <Activity className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-medium text-primary">
                  {t("Source: OKX Official", "数据来源: OKX官方")}
                </span>
              </div>
              {lastUpdate && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={fetchAllTickers}
                disabled={refreshing}
                className="p-2 rounded-lg hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowAddPanel(!showAddPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("Add Pair", "添加币对")}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Add Panel */}
        <AnimatePresence>
          {showAddPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="glass-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value.toUpperCase())}
                    placeholder={t("Search OKX pairs (e.g. BTC-USDT)...", "搜索OKX币对 (如 BTC-USDT)...")}
                    className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
                    autoFocus
                  />
                  {addSearch && !POPULAR_PAIRS.includes(addSearch) && addSearch.includes("-") && (
                    <button
                      onClick={() => addToken(addSearch)}
                      className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                    >
                      {t("Add Custom", "添加自定义")}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {addSuggestions.slice(0, 15).map((pair) => (
                    <button
                      key={pair}
                      onClick={() => addToken(pair)}
                      className="px-3 py-1.5 rounded-lg border border-border/50 text-xs font-mono text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    >
                      {pair}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Filter watchlist...", "过滤监控列表...")}
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
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Pair", "交易对")}</th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("price")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {t("Price", "价格")}
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("change")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      24h
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    {t("24h High/Low", "24h最高/最低")}
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort("volume")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {t("Volume", "成交额")}
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    {t("Bid/Ask", "买/卖")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">7d</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sortedTokens.map((token, i) => {
                  const ticker = token.ticker;
                  if (!ticker) {
                    return (
                      <tr key={token.instId} className="border-b border-border/30">
                        <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">{token.instId}</span>
                        </td>
                        <td colSpan={7} className="px-4 py-3 text-center text-xs text-muted-foreground">
                          {token.loading ? (
                            <span className="flex items-center justify-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
                            </span>
                          ) : (
                            token.error || "No data"
                          )}
                        </td>
                      </tr>
                    );
                  }

                  const last = parseFloat(ticker.last);
                  const open = parseFloat(ticker.open24h);
                  const change = open > 0 ? ((last - open) / open) * 100 : 0;
                  const positive = change >= 0;
                  const symbol = token.instId.split("-")[0];

                  return (
                    <motion.tr
                      key={token.instId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {symbol.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-medium text-sm font-mono">{token.instId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-medium">
                        ${formatPrice(last)}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-medium ${positive ? "text-green-400" : "text-red-400"}`}>
                        <div className="flex items-center justify-end gap-1">
                          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {positive ? "+" : ""}{change.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">
                        <div>${formatPrice(parseFloat(ticker.high24h))}</div>
                        <div>${formatPrice(parseFloat(ticker.low24h))}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground hidden md:table-cell">
                        {formatVolume(parseFloat(ticker.volCcy24h))}
                      </td>
                      <td className="px-4 py-3 text-right text-xs hidden lg:table-cell">
                        <div className="text-green-400">{formatPrice(parseFloat(ticker.bidPx))}</div>
                        <div className="text-red-400">{formatPrice(parseFloat(ticker.askPx))}</div>
                      </td>
                      <td className="px-4 py-3 text-right hidden xl:table-cell">
                        <MiniSparkline prices={(token as any).candles || []} positive={positive} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://www.okx.com/trade-spot/${token.instId.toLowerCase()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded text-muted-foreground/50 hover:text-primary transition-colors"
                            title={t("Trade on OKX", "在OKX交易")}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => removeToken(token.instId)}
                            className="p-1 rounded text-muted-foreground/50 hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer */}
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Activity className="w-3 h-3 text-primary" />
              <span>{t("Data source: OKX V5 Official API", "数据来源: OKX V5官方API")}</span>
              <span>·</span>
              <span>{t("Auto-refresh: 8s", "自动刷新: 8秒")}</span>
              <span>·</span>
              <span>{watchlist.length} {t("pairs", "交易对")}</span>
            </div>
            <a
              href="https://www.okx.com/docs-v5/en/#order-book-trading-market-data-get-tickers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-1"
            >
              API Docs <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
