/**
 * Crypto Token Icon Utility
 * Uses multiple CDN sources for reliable token logo display
 */

// Primary: CoinGecko CDN (most reliable)
const COINGECKO_CDN = "https://assets.coingecko.com/coins/images";

// Fallback: CryptoCompare
const CRYPTOCOMPARE_CDN = "https://www.cryptocompare.com/media/";

// Known CoinGecko image IDs for top tokens
const COINGECKO_IDS: Record<string, { id: number; slug: string }> = {
  BTC: { id: 1, slug: "bitcoin" },
  ETH: { id: 279, slug: "ethereum" },
  SOL: { id: 4128, slug: "solana" },
  DOGE: { id: 5, slug: "dogecoin" },
  XRP: { id: 44, slug: "xrp" },
  ADA: { id: 975, slug: "cardano" },
  AVAX: { id: 12559, slug: "avalanche-2" },
  DOT: { id: 6636, slug: "polkadot" },
  LINK: { id: 877, slug: "chainlink" },
  UNI: { id: 12504, slug: "uniswap" },
  MATIC: { id: 4713, slug: "matic-network" },
  ATOM: { id: 1481, slug: "cosmos" },
  FIL: { id: 5426, slug: "filecoin" },
  APT: { id: 26455, slug: "aptos" },
  ARB: { id: 11841, slug: "arbitrum" },
  OP: { id: 25244, slug: "optimism" },
  SUI: { id: 26375, slug: "sui" },
  NEAR: { id: 10365, slug: "near" },
  PEPE: { id: 24613, slug: "pepe" },
  WIF: { id: 28752, slug: "dogwifcoin" },
  TON: { id: 17980, slug: "toncoin" },
  TRX: { id: 1094, slug: "tron" },
  LTC: { id: 2, slug: "litecoin" },
  BCH: { id: 780, slug: "bitcoin-cash" },
  SHIB: { id: 11939, slug: "shiba-inu" },
  BNB: { id: 825, slug: "binancecoin" },
  USDT: { id: 325, slug: "tether" },
  USDC: { id: 6319, slug: "usd-coin" },
  DAI: { id: 9956, slug: "dai" },
  AAVE: { id: 7278, slug: "aave" },
  CRV: { id: 12124, slug: "curve-dao-token" },
  MKR: { id: 1348, slug: "maker" },
  COMP: { id: 9985, slug: "compound-governance-token" },
  SNX: { id: 2138, slug: "havven" },
  YFI: { id: 11849, slug: "yearn-finance" },
  SUSHI: { id: 12271, slug: "sushi" },
  SAND: { id: 12129, slug: "the-sandbox" },
  MANA: { id: 1966, slug: "decentraland" },
  AXS: { id: 13783, slug: "axie-infinity" },
  ENS: { id: 18547, slug: "ethereum-name-service" },
  LDO: { id: 13573, slug: "lido-dao" },
  IMX: { id: 17233, slug: "immutable-x" },
  INJ: { id: 7226, slug: "injective-protocol" },
  TIA: { id: 22861, slug: "celestia" },
  SEI: { id: 23149, slug: "sei-network" },
  BLUR: { id: 28453, slug: "blur" },
  JTO: { id: 28541, slug: "jito-governance-token" },
  PYTH: { id: 28177, slug: "pyth-network" },
  JUP: { id: 29210, slug: "jupiter-exchange-solana" },
  ONDO: { id: 29519, slug: "ondo-finance" },
  RENDER: { id: 11636, slug: "render-token" },
  FET: { id: 5681, slug: "fetch-ai" },
  AGIX: { id: 2137, slug: "singularitynet" },
  WLD: { id: 31069, slug: "worldcoin-wld" },
  STX: { id: 4847, slug: "blockstack" },
  ORDI: { id: 28299, slug: "ordinals" },
  BONK: { id: 28600, slug: "bonk" },
  FLOKI: { id: 10804, slug: "floki" },
  ETC: { id: 1321, slug: "ethereum-classic" },
  XLM: { id: 100, slug: "stellar" },
  ALGO: { id: 4030, slug: "algorand" },
  VET: { id: 3077, slug: "vechain" },
  HBAR: { id: 3688, slug: "hedera-hashgraph" },
  ICP: { id: 8916, slug: "internet-computer" },
  FTM: { id: 4001, slug: "fantom" },
  THETA: { id: 2416, slug: "theta-token" },
  GRT: { id: 13397, slug: "the-graph" },
  RUNE: { id: 6783, slug: "thorchain" },
  FLOW: { id: 4558, slug: "flow" },
  GALA: { id: 12493, slug: "gala" },
  APE: { id: 24383, slug: "apecoin" },
  CRO: { id: 7310, slug: "crypto-com-chain" },
  EGLD: { id: 11462, slug: "elrond-erd-2" },
  KAVA: { id: 6461, slug: "kava" },
  MINA: { id: 13457, slug: "mina-protocol" },
  CFX: { id: 7334, slug: "conflux-token" },
  ZIL: { id: 2469, slug: "zilliqa" },
  ROSE: { id: 7653, slug: "oasis-network" },
  ONE: { id: 3945, slug: "harmony" },
  ZEC: { id: 486, slug: "zcash" },
  DASH: { id: 131, slug: "dash" },
  XMR: { id: 69, slug: "monero" },
  NEO: { id: 480, slug: "neo" },
  WAVES: { id: 1274, slug: "waves" },
  IOTA: { id: 1290, slug: "iota" },
  OKB: { id: 3897, slug: "okb" },
};

/**
 * Get token logo URL
 * Uses CoinGecko CDN with known image IDs for reliability
 */
export function getTokenLogoUrl(symbol: string, size: "small" | "large" = "small"): string {
  const s = symbol.toUpperCase().replace(/^W/, ""); // handle WBTC -> BTC etc
  // CoinCap CDN - verified working for all major tokens
  return `https://assets.coincap.io/assets/icons/${s.toLowerCase()}@2x.png`;
}

/**
 * Get fallback gradient color for a token (when image fails)
 */
export function getTokenColor(symbol: string): string {
  const colors: Record<string, string> = {
    BTC: "#f7931a",
    ETH: "#627eea",
    SOL: "#9945ff",
    DOGE: "#c2a633",
    XRP: "#23292f",
    ADA: "#0033ad",
    AVAX: "#e84142",
    DOT: "#e6007a",
    LINK: "#2a5ada",
    UNI: "#ff007a",
    MATIC: "#8247e5",
    ATOM: "#2e3148",
    FIL: "#0090ff",
    APT: "#000000",
    ARB: "#28a0f0",
    OP: "#ff0420",
    SUI: "#6fbcf0",
    NEAR: "#000000",
    PEPE: "#3e7b27",
    WIF: "#d4a574",
    TON: "#0098ea",
    TRX: "#ef0027",
    LTC: "#bfbbbb",
    BCH: "#0ac18e",
    SHIB: "#ffa409",
    BNB: "#f3ba2f",
    OKB: "#000000",
  };
  return colors[symbol.toUpperCase()] || "#00e68a";
}

/**
 * Token logo component data
 */
export interface TokenLogoData {
  url: string;
  fallbackColor: string;
  symbol: string;
}

export function getTokenLogoData(symbol: string): TokenLogoData {
  return {
    url: getTokenLogoUrl(symbol),
    fallbackColor: getTokenColor(symbol),
    symbol: symbol.toUpperCase(),
  };
}
