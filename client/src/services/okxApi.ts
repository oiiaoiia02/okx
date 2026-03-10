/**
 * OKX V5 Public Market API Service
 * All market data fetched from OKX official API — no API key required.
 * Fallback to CoinGecko only for tokens not listed on OKX.
 */

const OKX_BASE = "https://www.okx.com/api/v5";
const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OKXTicker {
  instId: string;
  instType: string;
  last: string;
  lastSz: string;
  askPx: string;
  askSz: string;
  bidPx: string;
  bidSz: string;
  open24h: string;
  high24h: string;
  low24h: string;
  volCcy24h: string;
  vol24h: string;
  ts: string;
  sodUtc0: string;
  sodUtc8: string;
}

export interface TokenDisplayData {
  instId: string;
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  volumeCcy24h: number;
  askPx: number;
  bidPx: number;
  timestamp: number;
  source: "OKX" | "CoinGecko";
}

export interface OKXCandle {
  ts: string;
  o: string;
  h: string;
  l: string;
  c: string;
  vol: string;
  volCcy: string;
}

export interface OKXFundingRate {
  instId: string;
  fundingRate: string;
  nextFundingRate: string;
  fundingTime: string;
  nextFundingTime: string;
}

export interface OKXOrderbook {
  asks: [string, string, string, string][];
  bids: [string, string, string, string][];
  ts: string;
}

// ─── Core Fetch ──────────────────────────────────────────────────────────────

async function okxFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${OKX_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`OKX API error: ${res.status}`);
  const json = await res.json();
  if (json.code !== "0") throw new Error(`OKX API error: ${json.msg}`);
  return json.data as T[];
}

// ─── Market Ticker ───────────────────────────────────────────────────────────

export async function getTicker(instId: string): Promise<OKXTicker> {
  const data = await okxFetch<OKXTicker>("/market/ticker", { instId });
  if (!data.length) throw new Error(`No data for ${instId}`);
  return data[0];
}

export async function getTickers(instType: string = "SPOT"): Promise<OKXTicker[]> {
  return okxFetch<OKXTicker>("/market/tickers", { instType });
}

export function tickerToDisplay(ticker: OKXTicker): TokenDisplayData {
  const last = parseFloat(ticker.last);
  const open = parseFloat(ticker.open24h);
  const change = open > 0 ? ((last - open) / open) * 100 : 0;
  const parts = ticker.instId.split("-");
  return {
    instId: ticker.instId,
    symbol: parts[0],
    price: last,
    change24h: change,
    high24h: parseFloat(ticker.high24h),
    low24h: parseFloat(ticker.low24h),
    volume24h: parseFloat(ticker.vol24h),
    volumeCcy24h: parseFloat(ticker.volCcy24h),
    askPx: parseFloat(ticker.askPx),
    bidPx: parseFloat(ticker.bidPx),
    timestamp: parseInt(ticker.ts),
    source: "OKX",
  };
}

// ─── Batch fetch multiple tickers ────────────────────────────────────────────

export async function getMultipleTickers(instIds: string[]): Promise<TokenDisplayData[]> {
  const results: TokenDisplayData[] = [];
  // Use batch endpoint for efficiency
  try {
    const allTickers = await getTickers("SPOT");
    const tickerMap = new Map(allTickers.map((t) => [t.instId, t]));
    for (const id of instIds) {
      const ticker = tickerMap.get(id);
      if (ticker) {
        results.push(tickerToDisplay(ticker));
      }
    }
  } catch {
    // Fallback: fetch individually
    for (const id of instIds) {
      try {
        const ticker = await getTicker(id);
        results.push(tickerToDisplay(ticker));
      } catch {
        // Skip failed tickers
      }
    }
  }
  return results;
}

// ─── Candles / K-Line ────────────────────────────────────────────────────────

export async function getCandles(
  instId: string,
  bar: string = "1H",
  limit: string = "100"
): Promise<OKXCandle[]> {
  const data = await okxFetch<string[]>("/market/candles", { instId, bar, limit });
  return data.map((d) => ({
    ts: d[0],
    o: d[1],
    h: d[2],
    l: d[3],
    c: d[4],
    vol: d[5],
    volCcy: d[6],
  }));
}

// ─── Funding Rate ────────────────────────────────────────────────────────────

export async function getFundingRate(instId: string): Promise<OKXFundingRate> {
  const data = await okxFetch<OKXFundingRate>("/public/funding-rate", { instId });
  if (!data.length) throw new Error(`No funding rate for ${instId}`);
  return data[0];
}

// ─── Orderbook ───────────────────────────────────────────────────────────────

export async function getOrderbook(instId: string, sz: string = "20"): Promise<OKXOrderbook> {
  const data = await okxFetch<OKXOrderbook>("/market/books", { instId, sz });
  if (!data.length) throw new Error(`No orderbook for ${instId}`);
  return data[0];
}

// ─── Search OKX instruments ──────────────────────────────────────────────────

export interface OKXInstrument {
  instId: string;
  instType: string;
  baseCcy: string;
  quoteCcy: string;
  state: string;
}

let instrumentCache: OKXInstrument[] | null = null;

export async function getInstruments(instType: string = "SPOT"): Promise<OKXInstrument[]> {
  if (instrumentCache) return instrumentCache;
  const data = await okxFetch<OKXInstrument>("/public/instruments", { instType });
  instrumentCache = data;
  return data;
}

export async function searchInstruments(query: string): Promise<OKXInstrument[]> {
  const instruments = await getInstruments();
  const q = query.toUpperCase();
  return instruments
    .filter(
      (i) =>
        i.instId.includes(q) ||
        i.baseCcy.includes(q) ||
        i.quoteCcy.includes(q)
    )
    .slice(0, 20);
}

// ─── Format helpers ──────────────────────────────────────────────────────────

export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

export function formatVolume(vol: number): string {
  if (vol >= 1e12) return `$${(vol / 1e12).toFixed(2)}T`;
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
  return `$${vol.toFixed(2)}`;
}

// ─── CoinGecko Fallback ─────────────────────────────────────────────────────

export async function getCoinGeckoPrice(coinId: string): Promise<TokenDisplayData | null> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coinId}&sparkline=false`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    const coin = data[0];
    return {
      instId: `${coin.symbol.toUpperCase()}-USDT`,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h || 0,
      high24h: coin.high_24h || 0,
      low24h: coin.low_24h || 0,
      volume24h: 0,
      volumeCcy24h: coin.total_volume || 0,
      askPx: 0,
      bidPx: 0,
      timestamp: Date.now(),
      source: "CoinGecko",
    };
  } catch {
    return null;
  }
}
