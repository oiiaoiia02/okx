# OKX AI CORE

> **The most complete, most real OKX Agent Trade Kit frontend terminal.**
>
> glassmorphism UI + Natural Language Copilot + Voice Input + Real-time Intent Prediction + Local MCP Real Trading (on-chain TX visible) + Claw Prompt One-click Migration + Whale Signal One-click Execution. Fully local, simulation-first, open-source and reproducible.

> **OKX AI Core 是目前最完整、最真实的 OKX Agent Trade Kit 前端终端： + 自然语言 Copilot + 语音输入 + 实时意图猜测 + 本地 MCP 真实交易（链上 TX 可见）+ Claw Prompt 一键迁移 + 巨鲸跟单一键执行，全程安全本地、模拟优先、可复制开源。**

---

## v2.1 Updates (Latest)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **UI Overhaul** | Increased whitespace (48px+ card gaps), softened particle background, premium glassmorphism with `backdrop-blur(20px)`, hover pulse glow effects, consistent `font-[800]` headings |
| 2 | **Token Monitor V2** | OKX V5 API real-time refresh every 5s, improved card layout with larger padding, sparkline charts, real volume data |
| 3 | **Enhanced Search Engine** | Keyword-weighted matching across all 83 tools, module/tag/description search, one-click fill Copilot |
| 4 | **Wallet Connect V2** | Real OKX Wallet `eth_getBalance` + multi-chain + USD value via OKX V5 ETH price, improved spacing |
| 5 | **Cyber-Neural Particles V2** | Parallax depth layers, thinking chain data pulses traveling between nodes, softer organic motion, breathing gradient orbs |
| 6 | **MCP Server Panel** | Live connection status indicator, URL input, connect/disconnect toggle, TX Hash display with explorer links, simulation fallback |
| 7 | **Safety Modal** | 5s countdown timer, risk level indicator (low/medium/high), MCP protocol audit info, mandatory checkbox |
| 8 | **Claw Prompt Generator** | 6 templates with quick presets, Skills + MCP + Safety toggles, one-click copy/download |

## v2.0 Updates

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Simplified Navigation** | Clean left-top: Logo + "OKX AI CORE" only, increased whitespace |
| 2 | **Real Agent Trade Kit Link** | All links point to `https://github.com/okx/agent-trade-kit` |
| 3 | **Dynamic Island Notification** | Right-bottom floating, Framer Motion, 8s auto-dismiss, non-blocking |
| 4 | **Real Search (83 Tools)** | Hero search box filters all 83 tools in real-time, one-click fill Copilot |
| 5 | **OKX V5 API Prices** | Ticker endpoint, 5-second auto-refresh, real-time BTC/ETH/SOL |
| 6 | **OKX Wallet Enhanced** | Multi-chain support (ETH/Polygon/Arbitrum/OP/BSC/AVAX), USD value via OKX V5 API, 15s auto-refresh |
| 7 | **Cyber-Neural Background** | Soft neural-network particle animation with thinking chain data packets |
| 8 | **MCP Server Enhanced** | JSON-RPC 2.0 handshake, auto-reconnect, TX Hash with explorer links |
| 9 | **Safety Modal Enhanced** | 5s countdown timer, risk level indicator, MCP protocol info |
| 10 | **Claw Prompt Enhanced** | Quick presets, 4-step usage guide, OpenClaw + OKX API docs links |

---

## Why OKX AI CORE?

OKX AI CORE is not just a showcase website — it is a **fully functional AI trading assistant terminal** that deeply integrates the entire OKX Agent Trade Kit ecosystem. Every feature is real, interactive, and verifiable.

| Dimension | What We Deliver |
|-----------|----------------|
| **83 Tools / 7 Modules** | Full catalog with real-time search, filtering, and live API execution |
| **4 Built-in Skills** | Market Analysis, Risk Management, Grid Bot, Portfolio Rebalance + Custom Skill Creator |
| **MCP + CLI Dual Entry** | Visual MCP JSON builder + CLI command generator + WebSocket local server connection |
| **Real Prices** | All market data from **OKX V5 Official API** (not CoinGecko) — millisecond-level accuracy |
| **Real Wallet** | OKX Wallet connection with multi-chain support + USD value estimation |
| **Real Trading** | Local MCP Server execution → real TX Hash → on-chain explorer verification |
| **Simulation First** | Default demo mode, real-trade requires 5-second countdown + explicit safety confirmation |
| **One-click Migration** | Claw Prompt generator with Skills + MCP sequence + --demo flag, copy to Lobster Bot |

---

## Core Features

### 1. AI Copilot Terminal (Natural Language → MCP → Trade)
The heart of OKX AI CORE. Type natural language commands and watch the AI:
- **Parse intent** → identify which tools to call
- **Generate MCP sequence** → build the JSON payload
- **Execute with real data** → market tools return live OKX prices
- **Visualize thinking** → step-by-step reasoning chain with neural glow animations
- **Voice input** → Web Speech API microphone-to-text

### 2. Real-time Intent Prediction & Tool Search
As you type, the system filters all 83 tools in real-time:
- Keyword-weighted matching against all 83 tools across 7 modules
- Module color tags for visual categorization
- One-click to fill the Copilot with the selected tool
- Supports both English and Chinese input

### 3. One-click Demo Scenarios
Pre-built demo buttons on the homepage for instant evaluation:
- "Query BTC Real-time Price" → live OKX V5 API call
- "Simulate Buy 0.01 ETH" → full MCP flow in demo mode
- "Create Grid Bot Strategy" → generates complete MCP sequence

### 4. Agent Trade Kit Explorer (83 Tools)
- Full 7-module catalog: Market, Spot, Swap, Account, Bot, Copytrading, Funding
- Real-time search and filter by module/tag/keyword
- **Live API execution**: 12 market tools directly call OKX V5 API and return real data
- MCP JSON + CLI command copy for every tool

### 5. Token Monitor (OKX V5 API)
- Real-time prices from `https://www.okx.com/api/v5/market/ticker`
- 5-second auto-refresh with sparkline charts
- Add any OKX trading pair (BTC-USDT, ETH-USDT, SOL-USDT, etc.)
- Data source badge: "OKX Official API"

### 6. Strategy Laboratory (Real Backtesting)
- Fetch real historical K-line data from OKX V5 `/market/candles`
- SMA crossover / RSI / Bollinger Band strategies
- Real P&L calculation based on actual price movements
- JSON import/export for strategy sharing

### 7. MCP Visualizer (Live Execution)
- 5 pre-built flows with step-by-step visualization
- Market tools execute against real OKX API (tagged "LIVE API")
- Copy MCP JSON or CLI command per step
- "Execute All" button for full flow demonstration

### 8. Reasoning Chain Visualization
- Dynamic step generation with **real OKX market data**
- 3 scenarios: BTC Buy with Risk Check, ETH Grid Bot, Multi-Asset Scan
- Each `market_ticker` step fetches live prices (tagged "LIVE")
- Neural timeline with pulsing node dots and step counters

### 9. MCP Server Connection (WebSocket + JSON-RPC 2.0)
- Connect to local MCP Server at `ws://localhost:8765`
- **JSON-RPC 2.0 protocol** with proper handshake and request ID matching
- Auto-reconnect (up to 3 attempts with exponential backoff)
- Real trade execution with TX Hash → on-chain explorer link
- TX status polling: pending → confirmed (with block number + gas used)

### 10. OKX Wallet Connection (Multi-Chain)
- **6 chains supported**: Ethereum, Polygon, Arbitrum, Optimism, BNB Chain, Avalanche
- Real-time balance via `eth_getBalance` RPC
- **USD value estimation** using OKX V5 API ETH price
- 15-second auto-refresh + manual refresh
- Chain/account change listeners for seamless switching
- Explorer link for address verification

### 11. Safety System
- **Default simulation mode** — all trades are simulated unless explicitly switched
- **Enhanced safety modal** with:
  - 5-second countdown timer (cannot confirm immediately)
  - Risk level indicator (low/medium/high based on trade parameters)
  - MCP protocol audit trail information
  - Mandatory checkbox acknowledgment
- Warnings: real fund risk, sub-account recommendation, read-only API suggestion
- **Keys never leave your machine** — 100% local, no backend server

### 12. Claw Prompt Generator
- 6 templates: Market Query, Smart Trade, Grid Bot, Portfolio Audit, Whale Copy, DCA Strategy
- Includes Skills invocation + MCP sequence + `--demo` safety flag
- **Quick presets**: BTC Market Scan, ETH Smart Buy, SOL Grid Bot, etc.
- One-click copy, ready to paste into Lobster Bot (Claw) or any MCP agent
- Links to Agent Trade Kit repo and OKX V5 API docs

### 13. Skill Creator
- 4 built-in Skills + unlimited custom Skills
- Visual editor with name, description, tools, and MCP sequence
- localStorage persistence + JSON import/export
- Shareable across team members

### 14. Whale Signal Detection
- Real-time large trade detection from OKX V5 `/market/trades`
- Configurable threshold (default: $500K+)
- Auto-refresh every 10 seconds
- One-click "Follow Whale" generates Copilot command

### 15. Risk Dashboard
- Portfolio risk metrics based on real OKX prices + simulation positions
- Concentration analysis, drawdown tracking, exposure monitoring
- VaR (Value at Risk) calculation
- Real-time portfolio value updates

### 16. Dynamic Island Notifications
- **Right-bottom floating** notification (Apple Dynamic Island style)
- Real-time BTC/ETH/SOL price changes from OKX API
- Whale alert notifications
- Expandable with details, auto-rotate every 8 seconds, non-blocking

### 17. Cyber-Neural Particle Background
- 40 neural nodes with soft glow and breathing animation
- Neural-network connections with proximity detection
- **Thinking chain data packets** traveling along connections
- Subtle dot grid with radial fade
- Gradient orbs for depth — all at very low opacity to stay behind content

### 18. Additional Features
- **Chinese/English toggle**: Full bilingual support
- **Command palette**: Cmd+K quick navigation
- **Trade Review**: Performance analytics from simulation trades
- **OnchainOS Dashboard**: Multi-chain overview with OKX token prices
- **Simulation Panel**: Full trading simulator with real OKX prices

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript + Vite |
| Styling | TailwindCSS 4 + Glassmorphism |
| Animation | Framer Motion |
| UI Components | Radix UI |
| Data Source | **OKX V5 Official API** (primary) |
| Wallet | OKX Wallet (window.okxwallet) — Multi-chain |
| MCP Connection | WebSocket JSON-RPC 2.0 (ws://localhost:8765) |
| Voice | Web Speech API |
| Storage | localStorage (keys never uploaded) |
| Deployment | Static site (no backend required) |

---

## Data Source Declaration

> **All market data comes from OKX V5 Official API**, ensuring the most accurate and real-time trading decisions, perfectly integrated with the Agent Trade Kit ecosystem.

- Ticker: `GET /api/v5/market/ticker?instId=BTC-USDT`
- Orderbook: `GET /api/v5/market/books?instId=BTC-USDT`
- K-lines: `GET /api/v5/market/candles?instId=BTC-USDT&bar=1H`
- Trades: `GET /api/v5/market/trades?instId=BTC-USDT`
- Funding Rate: `GET /api/v5/public/funding-rate?instId=BTC-USDT-SWAP`

No API key required for public market data. All requests are made directly from the browser.

---

## Quick Start
```bash
# Clone
git clone https://github.com/oiiaoiia02/okx.git
cd okx

# Install
pnpm install

# Dev
pnpm dev

# Build
pnpm build
```

### Connect Local MCP Server (Optional)
```bash
# Install OKX Agent Trade Kit
npm install -g okx-trade-mcp okx-trade-cli

# Start MCP Server (demo mode — safe, no real trades)
okx-agent serve --port 8765 --demo

# Start MCP Server (live mode — REAL FUNDS AT RISK)
okx-agent serve --port 8765 --demo=false
```

### Connect OKX Wallet (Optional)
1. Install [OKX Wallet](https://www.okx.com/web3) browser extension
2. Click "Wallet Connect" in the app
3. Approve the connection
4. View real-time balance with USD estimation

---

## Safety Declaration

> **This project is designed with safety as the highest priority.**

- **Simulation mode is enabled by default.** No real funds are at risk unless you explicitly switch to live mode.
- **Real trading requires a 5-second countdown + explicit checkbox confirmation** through an enhanced safety modal with risk level indicators.
- **API keys are stored locally** in your browser's localStorage or `~/.okx/config.toml`. They are **never** sent to any server.
- **MCP Server uses read-only mode by default.** Trade execution requires the explicit `--demo=false` flag.
- We strongly recommend using **OKX sub-accounts** with **limited permissions** and **IP whitelist** for maximum safety.
- All MCP communications follow the **JSON-RPC 2.0 protocol** with full audit logging.
- This is an open-source tool for educational and research purposes. **Trade at your own risk.**

---

## Project Structure

```
okx/
├── client/
│   └── src/
│       ├── components/       # Reusable UI components
│       │   ├── DynamicIsland.tsx    # Right-bottom floating notification
│       │   ├── Layout.tsx           # Navigation + footer
│       │   ├── ParticleBackground.tsx # Cyber-neural particle effect
│       │   ├── SafetyModal.tsx      # Enhanced trade safety confirmation
│       │   └── CommandPalette.tsx   # Cmd+K quick nav
│       ├── contexts/
│       │   └── LanguageContext.tsx   # i18n (EN/ZH)
│       ├── data/
│       │   └── okxTools.ts          # 83 tools JSON data
│       ├── pages/
│       │   ├── Home.tsx             # Hero + search + demos
│       │   ├── Copilot.tsx          # AI Copilot terminal
│       │   ├── AgentTradeKit.tsx    # 83 tools explorer
│       │   ├── TokenMonitor.tsx     # Real-time prices
│       │   ├── StrategyStudio.tsx   # Backtesting lab
│       │   ├── MCPVisualizer.tsx    # MCP flow visualizer
│       │   ├── ReasoningChain.tsx   # Thinking chain (neural timeline)
│       │   ├── ClawPrompt.tsx       # Prompt generator (with presets)
│       │   ├── AgentSkills.tsx      # Skill creator
│       │   ├── SimulationPanel.tsx  # Sim trading
│       │   ├── WhaleSignal.tsx      # Whale detection
│       │   ├── RiskDashboard.tsx    # Risk metrics
│       │   ├── WalletConnect.tsx    # OKX Wallet (multi-chain)
│       │   ├── TradeReview.tsx      # Trade analytics
│       │   └── OnchainOS.tsx        # Multi-chain dashboard
│       └── services/
│           ├── okxApi.ts            # OKX V5 API service
│           └── mcpService.ts        # MCP WebSocket + JSON-RPC 2.0
├── server/                   # Express server (optional)
├── vite.config.ts
└── package.json
```

---

## OKX Agent Trade Kit Integration Depth

| Integration Point | Implementation | Status |
|------------------|---------------|--------|
| 83 Tools Full Catalog | Searchable, filterable, with live execution | Done |
| 7 Modules Coverage | Market, Spot, Swap, Account, Bot, Copytrading, Funding | Done |
| 4 Built-in Skills | Market Analysis, Risk Mgmt, Grid Bot, Portfolio Rebalance | Done |
| Custom Skill Creator | Visual editor + localStorage + JSON export | Done |
| MCP JSON Payload | Visual builder + copy + live execution | Done |
| CLI Command | Auto-generated for every tool | Done |
| Local MCP Server | WebSocket JSON-RPC 2.0 + auto-reconnect + real TX execution | Done |
| Simulation Mode | Default --demo flag, real-price simulation | Done |
| Safety Modal | 5s countdown + risk level + MCP audit info | Done |
| Claw/Lobster Bot | One-click prompt with Skills + MCP + safety + presets | Done |
| OKX Wallet | Multi-chain (6 chains) + USD value + auto-refresh | Done |
| OKX V5 Market API | 12 market tools with live data, 5s refresh | Done |
| TX Hash Verification | Explorer link + status polling + gas info | Done |
| Neural Background | Cyber-neural particles with thinking chain animation | Done |

---

## Community

- **Telegram**: [https://t.me/se77ouo](https://t.me/se77ouo)
- **GitHub**: [https://github.com/oiiaoiia02/okx](https://github.com/oiiaoiia02/okx)
- **Agent Trade Kit**: [https://github.com/okx/agent-trade-kit](https://github.com/okx/agent-trade-kit)
- **Author**: 小天才铭77Ouo @Chen1904o

---

## License

MIT License. Open source, free to use, modify, and distribute.

---

*Built for the OKX AI Hackathon — Lobster Track. Powered by Agent Trade Kit.*
