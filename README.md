# OKX AI CORE

> **The most complete, most real OKX Agent Trade Kit frontend terminal.**
>
> Apple-grade glassmorphism UI + Natural Language Copilot + Voice Input + Real-time Intent Prediction + Local MCP Real Trading (on-chain TX visible) + Claw Prompt One-click Migration + Whale Signal One-click Execution. Fully local, simulation-first, open-source and reproducible.

> **OKX AI Core 是目前最完整、最真实的 OKX Agent Trade Kit 前端终端：苹果级 glassmorphism UI + 自然语言 Copilot + 语音输入 + 实时意图猜测 + 本地 MCP 真实交易（链上 TX 可见）+ Claw Prompt 一键迁移 + 巨鲸跟单一键执行，全程安全本地、模拟优先、可复制开源。**

---

## Why OKX AI CORE?

OKX AI CORE is not just a showcase website — it is a **fully functional AI trading assistant terminal** that deeply integrates the entire OKX Agent Trade Kit ecosystem. Every feature is real, interactive, and verifiable.

| Dimension | What We Deliver |
|-----------|----------------|
| **83 Tools / 7 Modules** | Full catalog with real-time search, filtering, and live API execution |
| **4 Built-in Skills** | Market Analysis, Risk Management, Grid Bot, Portfolio Rebalance + Custom Skill Creator |
| **MCP + CLI Dual Entry** | Visual MCP JSON builder + CLI command generator + WebSocket local server connection |
| **Real Prices** | All market data from **OKX V5 Official API** (not CoinGecko) — millisecond-level accuracy |
| **Real Wallet** | OKX Wallet connection with on-chain balance query |
| **Real Trading** | Local MCP Server execution → real TX Hash → OKX Explorer on-chain verification |
| **Simulation First** | Default demo mode, real-trade requires explicit safety confirmation |
| **One-click Migration** | Claw Prompt generator with Skills + MCP sequence + --demo flag, copy to Lobster Bot |

---

## Core Features

### 1. AI Copilot Terminal (Natural Language → MCP → Trade)
The heart of OKX AI CORE. Type natural language commands and watch the AI:
- **Parse intent** → identify which tools to call
- **Generate MCP sequence** → build the JSON payload
- **Execute with real data** → market tools return live OKX prices
- **Visualize thinking** → 5-step reasoning chain with glow animations
- **Voice input** → Web Speech API microphone-to-text

### 2. Real-time Intent Prediction
As you type, 3-5 most likely tools/strategies appear as floating cards:
- Keyword-weighted matching against all 83 tools
- One-click to fill the Copilot with the selected tool
- Supports both English and Chinese input

### 3. One-click Demo Scenarios
Pre-built demo buttons on the homepage for instant evaluation:
- "Query BTC Real-time Price" → live OKX V5 API call
- "Simulate Buy 0.01 ETH" → full MCP flow in demo mode
- "Create Grid Bot Strategy" → generates complete MCP sequence
- "Check Wallet Balance" → connects OKX Wallet

### 4. Agent Trade Kit Explorer (83 Tools)
- Full 7-module catalog: Market, Spot, Swap, Account, Bot, Copytrading, Funding
- Real-time search and filter by module/tag/keyword
- **Live API execution**: 12 market tools directly call OKX V5 API and return real data
- MCP JSON + CLI command copy for every tool

### 5. Token Monitor (OKX V5 API)
- Real-time prices from `https://www.okx.com/api/v5/market/ticker`
- 8-second auto-refresh with sparkline charts
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
- Animated card flow with glow effects and timing

### 9. MCP Server Connection (WebSocket)
- Connect to local MCP Server at `ws://localhost:8765`
- Real trade execution in non-demo mode
- TX Hash display with OKX Explorer link
- TX status polling: pending → confirmed (green check + block number)

### 10. Safety First
- **Default simulation mode** — all trades are simulated unless explicitly switched
- **Apple-style safety modal** before any real trade execution
- Warnings: real fund risk, sub-account recommendation, read-only API suggestion
- **Keys never leave your machine** — 100% local, no backend server

### 11. Claw Prompt Generator
- 6 templates covering all major trading scenarios
- Includes Skills invocation + MCP sequence + `--demo` safety flag
- One-click copy, ready to paste into Lobster Bot (Claw)
- Custom template editor

### 12. Skill Creator
- 4 built-in Skills + unlimited custom Skills
- Visual editor with name, description, tools, and MCP sequence
- localStorage persistence + JSON import/export
- Shareable across team members

### 13. Whale Signal Detection
- Real-time large trade detection from OKX V5 `/market/trades`
- Configurable threshold (default: $500K+)
- Auto-refresh every 10 seconds
- One-click "Follow Whale" generates Copilot command

### 14. Risk Dashboard
- Portfolio risk metrics based on real OKX prices + simulation positions
- Concentration analysis, drawdown tracking, exposure monitoring
- VaR (Value at Risk) calculation
- Real-time portfolio value updates

### 15. Simulation Panel
- Full trading simulator with real OKX prices
- Position management (open/close with real-time P&L)
- Trade history with localStorage persistence
- Export to CSV for analysis

### 16. Dynamic Island Notifications
- Floating top-right notification bar (Apple Dynamic Island style)
- Real-time BTC/ETH/SOL price changes from OKX API
- Whale alert notifications
- Expandable with details, auto-rotate every 8 seconds

### 17. Additional Features
- **Particle background**: Cyber-neural network animation
- **Chinese/English toggle**: Full bilingual support
- **Command palette**: Cmd+K quick navigation
- **Trade Review**: Performance analytics from simulation trades
- **OnchainOS Dashboard**: Multi-chain overview with OKX token prices

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript + Vite |
| Styling | TailwindCSS 4 + Glassmorphism |
| Animation | Framer Motion |
| UI Components | Radix UI |
| Data Source | **OKX V5 Official API** (primary) |
| Wallet | OKX Wallet (window.okxwallet) |
| MCP Connection | WebSocket (ws://localhost:8765) |
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
# Start MCP Server for real trade execution
npx @anthropic/mcp-server --port 8765

# Or use OKX Agent Trade Kit CLI
okx-agent serve --port 8765 --demo
```

### Connect OKX Wallet (Optional)
1. Install [OKX Wallet](https://www.okx.com/web3) browser extension
2. Click "Connect Wallet" in the app
3. Approve the connection

---

## Safety Declaration

- **Simulation mode is enabled by default.** No real funds are at risk unless you explicitly switch to live mode.
- **API keys are stored locally** in your browser's localStorage. They are never sent to any server.
- **Real trading requires explicit confirmation** through a safety modal with risk warnings.
- We recommend using **sub-accounts** and **read-only API keys** for maximum safety.
- This is an open-source tool for educational and research purposes. **Trade at your own risk.**

---

## Project Structure

```
okx/
├── client/
│   └── src/
│       ├── components/       # Reusable UI components
│       │   ├── DynamicIsland.tsx    # Floating notification bar
│       │   ├── Layout.tsx           # Navigation + footer
│       │   ├── ParticleBackground.tsx # Cyber particle effect
│       │   ├── SafetyModal.tsx      # Trade safety confirmation
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
│       │   ├── ReasoningChain.tsx   # Thinking chain
│       │   ├── ClawPrompt.tsx       # Prompt generator
│       │   ├── AgentSkills.tsx      # Skill creator
│       │   ├── SimulationPanel.tsx  # Sim trading
│       │   ├── WhaleSignal.tsx      # Whale detection
│       │   ├── RiskDashboard.tsx    # Risk metrics
│       │   ├── WalletConnect.tsx    # OKX Wallet
│       │   ├── TradeReview.tsx      # Trade analytics
│       │   └── OnchainOS.tsx        # Multi-chain dashboard
│       └── services/
│           ├── okxApi.ts            # OKX V5 API service
│           └── mcpService.ts        # MCP WebSocket service
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
| Local MCP Server | WebSocket connection + real TX execution | Done |
| Simulation Mode | Default --demo flag, real-price simulation | Done |
| Claw/Lobster Bot | One-click prompt with Skills + MCP + safety | Done |
| OKX Wallet | Real on-chain balance + connection | Done |
| OKX V5 Market API | 12 market tools with live data | Done |
| TX Hash Verification | OKX Explorer link + status polling | Done |

---

## Community

- **Telegram**: [https://t.me/se77ouo](https://t.me/se77ouo)
- **GitHub**: [https://github.com/oiiaoiia02/okx](https://github.com/oiiaoiia02/okx)
- **Author**: 小天才铭77Ouo @Chen1904o

---

## License

MIT License. Open source, free to use, modify, and distribute.

---

*Built for the OKX AI Hackathon — Lobster Track. Powered by Agent Trade Kit.*
