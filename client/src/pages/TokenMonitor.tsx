import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getTicker, getCandles, formatPrice, formatVolume, type OKXTicker } from "@/services/okxApi";
import TokenLogo from "@/components/TokenLogo";
import {
  Eye, ChevronRight, RefreshCw, Plus, X, TrendingUp, TrendingDown,
  Search, Activity, ExternalLink, ArrowUpDown, Clock, Star, StarOff,
} from "lucide-react";

interface WatchlistToken {
  instId: string;
  ticker?: OKXTicker;
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
  "BNB-USDT", "OKB-USDT", "INJ-USDT", "TIA-USDT", "SEI-USDT",
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
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("okx-ai-core-favorites");
    return saved ? new Set(JSON.parse(saved)) : new Set(["BTC-USDT", "ETH-USDT", "SOL-USDT"]);
  });
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
          let candles: number[] = [];
          try {
            const candleData = await getCandles(instId, "4H", "42");
            candles = candleData.map((c) => parseFloat(c.c));
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

  useEffect(() => {
    fetchAllTickers();
    intervalRef.current = setInterval(fetchAllTickers, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAllTickers]);

  useEffect(() => {
    localStorage.setItem("okx-ai-core-watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("okx-ai-core-favorites", JSON.stringify([...favorites]));
  }, [favorites]);

  const addToken = (instId: string) => {
    if (!watchlist.includes(instId)) {
      setWatchlist((prev) => [...prev, instId]);
    }
    setShowAddPanel(false);
    setAddSearch("");
  };

  const removeToken = (instId: string) => {
    setWatchlist((prev) => prev.filter((p) => p !== instId));
  };

  const toggleFavorite = (instId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(instId)) next.delete(instId);
      else next.add(instId);
      return next;
    });
  };

  const sortedTokens = useMemo(() => {
    return [...watchlist]
      .map((instId) => tokens.get(instId) || { instId, loading: true })
      .filter((t) => {
        if (!search) return true;
        return t.instId.toLowerCase().includes(search.toLowerCase());
      })
      .sort((a, b) => {
        // Favorites first
        const aFav = favorites.has(a.instId) ? 1 : 0;
        const bFav = favorites.has(b.instId) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;

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
  }, [watchlist, tokens, search, sortBy, sortDir, favorites]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  // Mini sparkline SVG
  const MiniSparkline = ({ prices, positive }: { prices: number[]; positive: boolean }) => {
    if (!prices || prices.length < 2) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const w = 100;
    const h = 36;
    const step = w / (prices.length - 1);
    const points = prices.map((p, i) => `${i * step},${h - ((p - min) / range) * (h - 4) - 2}`).join(" ");
    const color = positive ? "#22c55e" : "#ef4444";
    const gradId = `grad-${positive ? "g" : "r"}-${Math.random().toString(36).slice(2, 6)}`;
    
    // Create area fill path
    const areaPoints = `0,${h} ${points} ${w},${h}`;
    
    return (
      <svg width={w} height={h} className="opacity-80">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#${gradId})`} points={areaPoints} />
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const addSuggestions = POPULAR_PAIRS.filter(
    (p) => !watchlist.includes(p) && (!addSearch || p.toLowerCase().includes(addSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen py-14 px-4 sm:px-6">
      <div className="container max-w-[1400px]">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Eye className="w-4 h-4" />
            <span>{t("Tools", "实用工具")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground font-medium">{t("Token Monitor", "代币监控")}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div>
              <h1 className="text-3xl font-[800] mb-3 tracking-[-0.02em]">{t("Token Monitor", "代币监控")}</h1>
              <p className="text-muted-foreground text-[15px] leading-relaxed">
                {t(
                  "Real-time prices from OKX V5 Official API. Auto-refresh every 5s.",
                  "OKX V5官方API实时价格。每5秒自动刷新。"
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/5 border border-primary/12 backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-[600] text-primary tracking-wide">
                  {t("LIVE · OKX V5 API", "实时 · OKX V5 API")}
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
                className="p-2.5 rounded-xl hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground border border-border/30"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setShowAddPanel(!showAddPanel)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-[13px] font-[600] hover:bg-primary/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
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
              className="mb-8 overflow-hidden"
            >
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
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
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-[600]"
                    >
                      {t("Add Custom", "添加自定义")}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {addSuggestions.slice(0, 20).map((pair) => {
                    const sym = pair.split("-")[0];
                    return (
                      <button
                        key={pair}
                        onClick={() => addToken(pair)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 text-xs font-mono text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        <TokenLogo symbol={sym} size={18} />
                        {pair}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Filter watchlist...", "过滤监控列表...")}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-border/50 bg-card/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>

        {/* Token Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-card/30">
                  <th className="text-left px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider">{t("Pair", "交易对")}</th>
                  <th
                    className="text-right px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("price")}
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      {t("Price", "价格")}
                      <ArrowUpDown className={`w-3 h-3 ${sortBy === "price" ? "text-primary" : ""}`} />
                    </span>
                  </th>
                  <th
                    className="text-right px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("change")}
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      24h %
                      <ArrowUpDown className={`w-3 h-3 ${sortBy === "change" ? "text-primary" : ""}`} />
                    </span>
                  </th>
                  <th className="text-right px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    {t("24h High / Low", "24h最高/最低")}
                  </th>
                  <th
                    className="text-right px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider hidden md:table-cell cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("volume")}
                  >
                    <span className="flex items-center justify-end gap-1.5">
                      {t("Volume", "成交额")}
                      <ArrowUpDown className={`w-3 h-3 ${sortBy === "volume" ? "text-primary" : ""}`} />
                    </span>
                  </th>
                  <th className="text-right px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    {t("Bid / Ask", "买 / 卖")}
                  </th>
                  <th className="text-right px-5 py-4 text-[11px] font-[600] text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                    7d
                  </th>
                  <th className="px-5 py-4 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {sortedTokens.map((token, i) => {
                  const ticker = token.ticker;
                  const symbol = token.instId.split("-")[0];
                  const isFav = favorites.has(token.instId);

                  if (!ticker) {
                    return (
                      <tr key={token.instId} className="border-b border-border/20">
                        <td className="px-5 py-5 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <TokenLogo symbol={symbol} size={32} />
                            <div>
                              <span className="font-[600] text-[14px]">{symbol}</span>
                              <span className="text-muted-foreground text-[12px] ml-2 font-mono">{token.instId}</span>
                            </div>
                          </div>
                        </td>
                        <td colSpan={7} className="px-5 py-5 text-center text-xs text-muted-foreground">
                          {token.loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              {t("Loading...", "加载中...")}
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

                  return (
                    <motion.tr
                      key={token.instId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/20 hover:bg-accent/20 transition-colors group"
                    >
                      <td className="px-5 py-5 text-[12px] text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-3.5">
                          <TokenLogo symbol={symbol} size={36} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-[700] text-[15px] text-foreground">{symbol}</span>
                              <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">/ USDT</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground/60 mt-0.5">{token.instId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <span className="font-mono text-[15px] font-[600] text-foreground">
                          ${formatPrice(last)}
                        </span>
                      </td>
                      <td className={`px-5 py-5 text-right`}>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-[600] ${
                          positive 
                            ? "text-green-400 bg-green-400/8" 
                            : "text-red-400 bg-red-400/8"
                        }`}>
                          {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {positive ? "+" : ""}{change.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right hidden sm:table-cell">
                        <div className="space-y-1">
                          <div className="text-[12px] text-muted-foreground font-mono">${formatPrice(parseFloat(ticker.high24h))}</div>
                          <div className="text-[12px] text-muted-foreground/60 font-mono">${formatPrice(parseFloat(ticker.low24h))}</div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right hidden md:table-cell">
                        <span className="text-[13px] text-muted-foreground font-[500]">
                          {formatVolume(parseFloat(ticker.volCcy24h))}
                        </span>
                      </td>
                      <td className="px-5 py-5 text-right hidden lg:table-cell">
                        <div className="space-y-1">
                          <div className="text-[12px] text-green-400 font-mono">{formatPrice(parseFloat(ticker.bidPx))}</div>
                          <div className="text-[12px] text-red-400 font-mono">{formatPrice(parseFloat(ticker.askPx))}</div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right hidden xl:table-cell">
                        <MiniSparkline prices={(token as any).candles || []} positive={positive} />
                      </td>
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleFavorite(token.instId)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isFav ? "text-yellow-400 hover:text-yellow-300" : "text-muted-foreground/40 hover:text-yellow-400"
                            }`}
                            title={t("Toggle favorite", "切换收藏")}
                          >
                            {isFav ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={`https://www.okx.com/trade-spot/${token.instId.toLowerCase()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-primary transition-colors"
                            title={t("Trade on OKX", "在OKX交易")}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => removeToken(token.instId)}
                            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-400 transition-colors"
                            title={t("Remove", "移除")}
                          >
                            <X className="w-3.5 h-3.5" />
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
          <div className="px-5 py-4 border-t border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span>{t("Source: OKX V5 Official API", "数据来源: OKX V5官方API")}</span>
              </div>
              <span className="text-border">|</span>
              <span>{t("Auto-refresh: 5s", "自动刷新: 5秒")}</span>
              <span className="text-border">|</span>
              <span>{watchlist.length} {t("pairs", "交易对")}</span>
            </div>
            <a
              href="https://www.okx.com/docs-v5/en/#order-book-trading-market-data-get-tickers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-[500]"
            >
              API Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
