// OKX Agent Trade Kit - Complete 83 Tools / 7 Modules
export interface OKXTool {
  name: string;
  module: string;
  moduleColor: string;
  descEn: string;
  descZh: string;
  tags: string[];
}

export const OKX_TOOLS: OKXTool[] = [
  // Market Module (12 tools)
  { name: "market_ticker", module: "Market", moduleColor: "#22c55e", descEn: "Get real-time ticker data", descZh: "获取实时行情数据", tags: ["price", "ticker", "real-time"] },
  { name: "market_orderbook", module: "Market", moduleColor: "#22c55e", descEn: "Get orderbook depth", descZh: "获取订单簿深度", tags: ["orderbook", "depth", "bid", "ask"] },
  { name: "market_candles", module: "Market", moduleColor: "#22c55e", descEn: "Get candlestick data", descZh: "获取K线数据", tags: ["candles", "kline", "chart"] },
  { name: "market_index_tickers", module: "Market", moduleColor: "#22c55e", descEn: "Get index tickers", descZh: "获取指数行情", tags: ["index", "ticker"] },
  { name: "market_funding_rate", module: "Market", moduleColor: "#22c55e", descEn: "Get funding rate", descZh: "获取资金费率", tags: ["funding", "rate", "perpetual"] },
  { name: "market_open_interest", module: "Market", moduleColor: "#22c55e", descEn: "Get open interest", descZh: "获取持仓量", tags: ["open-interest", "OI"] },
  { name: "market_trades", module: "Market", moduleColor: "#22c55e", descEn: "Get recent trades", descZh: "获取最近成交", tags: ["trades", "recent"] },
  { name: "market_24h_volume", module: "Market", moduleColor: "#22c55e", descEn: "Get 24h volume", descZh: "获取24小时成交量", tags: ["volume", "24h"] },
  { name: "market_mark_price", module: "Market", moduleColor: "#22c55e", descEn: "Get mark price", descZh: "获取标记价格", tags: ["mark", "price"] },
  { name: "market_instruments", module: "Market", moduleColor: "#22c55e", descEn: "Get instrument info", descZh: "获取交易产品信息", tags: ["instruments", "info"] },
  { name: "market_history_candles", module: "Market", moduleColor: "#22c55e", descEn: "Get history candles", descZh: "获取历史K线", tags: ["history", "candles"] },
  { name: "market_estimated_price", module: "Market", moduleColor: "#22c55e", descEn: "Get estimated price", descZh: "获取预估价格", tags: ["estimated", "price"] },

  // Spot Module (12 tools)
  { name: "spot_place_order", module: "Spot", moduleColor: "#3b82f6", descEn: "Place spot order", descZh: "下现货单", tags: ["order", "buy", "sell", "spot"] },
  { name: "spot_cancel_order", module: "Spot", moduleColor: "#3b82f6", descEn: "Cancel spot order", descZh: "撤销现货单", tags: ["cancel", "order"] },
  { name: "spot_amend_order", module: "Spot", moduleColor: "#3b82f6", descEn: "Amend spot order", descZh: "修改现货单", tags: ["amend", "modify"] },
  { name: "spot_batch_orders", module: "Spot", moduleColor: "#3b82f6", descEn: "Batch place orders", descZh: "批量下单", tags: ["batch", "orders"] },
  { name: "spot_batch_cancel", module: "Spot", moduleColor: "#3b82f6", descEn: "Batch cancel orders", descZh: "批量撤单", tags: ["batch", "cancel"] },
  { name: "spot_order_details", module: "Spot", moduleColor: "#3b82f6", descEn: "Get order details", descZh: "获取订单详情", tags: ["order", "details"] },
  { name: "spot_pending_orders", module: "Spot", moduleColor: "#3b82f6", descEn: "Get pending orders", descZh: "获取挂单列表", tags: ["pending", "orders"] },
  { name: "spot_order_history", module: "Spot", moduleColor: "#3b82f6", descEn: "Get order history", descZh: "获取历史订单", tags: ["history", "orders"] },
  { name: "spot_fills", module: "Spot", moduleColor: "#3b82f6", descEn: "Get fill history", descZh: "获取成交明细", tags: ["fills", "trades"] },
  { name: "spot_algo_order", module: "Spot", moduleColor: "#3b82f6", descEn: "Place algo order", descZh: "下算法单", tags: ["algo", "conditional"] },
  { name: "spot_cancel_algo", module: "Spot", moduleColor: "#3b82f6", descEn: "Cancel algo order", descZh: "撤销算法单", tags: ["cancel", "algo"] },
  { name: "spot_algo_history", module: "Spot", moduleColor: "#3b82f6", descEn: "Get algo history", descZh: "获取算法单历史", tags: ["algo", "history"] },

  // Swap/Futures Module (12 tools)
  { name: "swap_place_order", module: "Swap", moduleColor: "#a855f7", descEn: "Place swap order", descZh: "下合约单", tags: ["swap", "futures", "order"] },
  { name: "swap_cancel_order", module: "Swap", moduleColor: "#a855f7", descEn: "Cancel swap order", descZh: "撤销合约单", tags: ["cancel", "swap"] },
  { name: "swap_get_positions", module: "Swap", moduleColor: "#a855f7", descEn: "Get positions", descZh: "获取持仓", tags: ["positions", "swap"] },
  { name: "swap_set_leverage", module: "Swap", moduleColor: "#a855f7", descEn: "Set leverage", descZh: "设置杠杆", tags: ["leverage", "margin"] },
  { name: "swap_close_position", module: "Swap", moduleColor: "#a855f7", descEn: "Close position", descZh: "平仓", tags: ["close", "position"] },
  { name: "swap_margin_balance", module: "Swap", moduleColor: "#a855f7", descEn: "Adjust margin", descZh: "调整保证金", tags: ["margin", "balance"] },
  { name: "swap_position_history", module: "Swap", moduleColor: "#a855f7", descEn: "Position history", descZh: "历史持仓", tags: ["history", "positions"] },
  { name: "swap_batch_orders", module: "Swap", moduleColor: "#a855f7", descEn: "Batch swap orders", descZh: "批量合约下单", tags: ["batch", "swap"] },
  { name: "swap_batch_cancel", module: "Swap", moduleColor: "#a855f7", descEn: "Batch cancel", descZh: "批量撤单", tags: ["batch", "cancel"] },
  { name: "swap_algo_order", module: "Swap", moduleColor: "#a855f7", descEn: "Swap algo order", descZh: "合约算法单", tags: ["algo", "swap"] },
  { name: "swap_tp_sl", module: "Swap", moduleColor: "#a855f7", descEn: "Set TP/SL", descZh: "设置止盈止损", tags: ["tp", "sl", "stop-loss"] },
  { name: "swap_trailing_stop", module: "Swap", moduleColor: "#a855f7", descEn: "Trailing stop", descZh: "追踪止损", tags: ["trailing", "stop"] },

  // Options Module (6 tools)
  { name: "option_place_order", module: "Options", moduleColor: "#f59e0b", descEn: "Place option order", descZh: "下期权单", tags: ["option", "order"] },
  { name: "option_cancel_order", module: "Options", moduleColor: "#f59e0b", descEn: "Cancel option order", descZh: "撤销期权单", tags: ["cancel", "option"] },
  { name: "option_positions", module: "Options", moduleColor: "#f59e0b", descEn: "Get option positions", descZh: "获取期权持仓", tags: ["positions", "option"] },
  { name: "option_greeks", module: "Options", moduleColor: "#f59e0b", descEn: "Get option greeks", descZh: "获取希腊字母", tags: ["greeks", "delta", "gamma"] },
  { name: "option_chain", module: "Options", moduleColor: "#f59e0b", descEn: "Get option chain", descZh: "获取期权链", tags: ["chain", "option"] },
  { name: "option_exercise", module: "Options", moduleColor: "#f59e0b", descEn: "Exercise option", descZh: "行权", tags: ["exercise", "option"] },

  // Account Module (12 tools)
  { name: "account_balance", module: "Account", moduleColor: "#06b6d4", descEn: "Get account balance", descZh: "获取账户余额", tags: ["balance", "account"] },
  { name: "account_positions", module: "Account", moduleColor: "#06b6d4", descEn: "Get all positions", descZh: "获取所有持仓", tags: ["positions", "account"] },
  { name: "account_bills", module: "Account", moduleColor: "#06b6d4", descEn: "Get billing history", descZh: "获取账单历史", tags: ["bills", "history"] },
  { name: "account_config", module: "Account", moduleColor: "#06b6d4", descEn: "Get account config", descZh: "获取账户配置", tags: ["config", "settings"] },
  { name: "account_set_position_mode", module: "Account", moduleColor: "#06b6d4", descEn: "Set position mode", descZh: "设置持仓模式", tags: ["position", "mode"] },
  { name: "account_fee_rates", module: "Account", moduleColor: "#06b6d4", descEn: "Get fee rates", descZh: "获取手续费率", tags: ["fee", "rates"] },
  { name: "account_max_size", module: "Account", moduleColor: "#06b6d4", descEn: "Get max order size", descZh: "获取最大下单量", tags: ["max", "size"] },
  { name: "account_max_avail_size", module: "Account", moduleColor: "#06b6d4", descEn: "Max available size", descZh: "最大可用数量", tags: ["max", "available"] },
  { name: "account_interest", module: "Account", moduleColor: "#06b6d4", descEn: "Get interest accrued", descZh: "获取计息", tags: ["interest", "accrued"] },
  { name: "account_max_loan", module: "Account", moduleColor: "#06b6d4", descEn: "Get max loan", descZh: "获取最大借币量", tags: ["loan", "borrow"] },
  { name: "account_risk_state", module: "Account", moduleColor: "#06b6d4", descEn: "Get risk state", descZh: "获取风险状态", tags: ["risk", "state"] },
  { name: "account_transfer", module: "Account", moduleColor: "#06b6d4", descEn: "Fund transfer", descZh: "资金划转", tags: ["transfer", "fund"] },

  // Bot/Grid Module (11 tools)
  { name: "bot_grid_create", module: "Bot", moduleColor: "#ec4899", descEn: "Create grid bot", descZh: "创建网格机器人", tags: ["grid", "bot", "create"] },
  { name: "bot_grid_stop", module: "Bot", moduleColor: "#ec4899", descEn: "Stop grid bot", descZh: "停止网格机器人", tags: ["grid", "stop"] },
  { name: "bot_grid_orders", module: "Bot", moduleColor: "#ec4899", descEn: "Get grid orders", descZh: "获取网格订单", tags: ["grid", "orders"] },
  { name: "bot_grid_positions", module: "Bot", moduleColor: "#ec4899", descEn: "Grid positions", descZh: "网格持仓", tags: ["grid", "positions"] },
  { name: "bot_dca_create", module: "Bot", moduleColor: "#ec4899", descEn: "Create DCA bot", descZh: "创建DCA机器人", tags: ["dca", "bot"] },
  { name: "bot_dca_stop", module: "Bot", moduleColor: "#ec4899", descEn: "Stop DCA bot", descZh: "停止DCA机器人", tags: ["dca", "stop"] },
  { name: "bot_signal_create", module: "Bot", moduleColor: "#ec4899", descEn: "Create signal bot", descZh: "创建信号机器人", tags: ["signal", "bot"] },
  { name: "bot_recurring_buy", module: "Bot", moduleColor: "#ec4899", descEn: "Recurring buy", descZh: "定投", tags: ["recurring", "dca"] },
  { name: "bot_smart_portfolio", module: "Bot", moduleColor: "#ec4899", descEn: "Smart portfolio", descZh: "智能组合", tags: ["portfolio", "smart"] },
  { name: "bot_copy_trading", module: "Bot", moduleColor: "#ec4899", descEn: "Copy trading", descZh: "跟单交易", tags: ["copy", "trading"] },
  { name: "bot_arbitrage", module: "Bot", moduleColor: "#ec4899", descEn: "Arbitrage bot", descZh: "套利机器人", tags: ["arbitrage", "bot"] },

  // Futures Extra Module (6 tools)
  { name: "futures_delivery_price", module: "Futures", moduleColor: "#ef4444", descEn: "Delivery price", descZh: "交割价格", tags: ["delivery", "price"] },
  { name: "futures_estimated_delivery", module: "Futures", moduleColor: "#ef4444", descEn: "Estimated delivery", descZh: "预估交割价", tags: ["estimated", "delivery"] },
  { name: "futures_long_short_ratio", module: "Futures", moduleColor: "#ef4444", descEn: "Long/short ratio", descZh: "多空比", tags: ["long", "short", "ratio"] },
  { name: "futures_taker_volume", module: "Futures", moduleColor: "#ef4444", descEn: "Taker buy/sell vol", descZh: "主买主卖量", tags: ["taker", "volume"] },
  { name: "futures_insurance_fund", module: "Futures", moduleColor: "#ef4444", descEn: "Insurance fund", descZh: "风险准备金", tags: ["insurance", "fund"] },
  { name: "futures_liquidation_orders", module: "Futures", moduleColor: "#ef4444", descEn: "Liquidation orders", descZh: "强平订单", tags: ["liquidation", "orders"] },

  // Extra tools to reach 83
  { name: "market_block_tickers", module: "Market", moduleColor: "#22c55e", descEn: "Get block tickers", descZh: "获取大宗行情", tags: ["block", "ticker"] },
  { name: "spot_easy_convert", module: "Spot", moduleColor: "#3b82f6", descEn: "Easy convert assets", descZh: "闪兑资产", tags: ["convert", "swap"] },
  { name: "account_withdrawal", module: "Account", moduleColor: "#06b6d4", descEn: "Withdraw funds", descZh: "提币", tags: ["withdraw", "funds"] },
  { name: "account_deposit_address", module: "Account", moduleColor: "#06b6d4", descEn: "Get deposit address", descZh: "获取充值地址", tags: ["deposit", "address"] },
  { name: "account_deposit_history", module: "Account", moduleColor: "#06b6d4", descEn: "Deposit history", descZh: "充值记录", tags: ["deposit", "history"] },
  { name: "account_withdrawal_history", module: "Account", moduleColor: "#06b6d4", descEn: "Withdrawal history", descZh: "提币记录", tags: ["withdrawal", "history"] },
  { name: "bot_moon_grid", module: "Bot", moduleColor: "#ec4899", descEn: "Moon grid bot", descZh: "天地网格", tags: ["moon", "grid"] },
  { name: "bot_portfolio_margin", module: "Bot", moduleColor: "#ec4899", descEn: "Portfolio margin", descZh: "组合保证金", tags: ["portfolio", "margin"] },
  { name: "swap_adl_info", module: "Swap", moduleColor: "#a855f7", descEn: "ADL information", descZh: "自动减仓信息", tags: ["adl", "auto-deleverage"] },
  { name: "swap_mark_px_candles", module: "Swap", moduleColor: "#a855f7", descEn: "Mark price candles", descZh: "标记价格K线", tags: ["mark", "candles"] },
  { name: "option_settlement_history", module: "Options", moduleColor: "#f59e0b", descEn: "Settlement history", descZh: "结算历史", tags: ["settlement", "history"] },
  { name: "option_underlying", module: "Options", moduleColor: "#f59e0b", descEn: "Get underlying assets", descZh: "获取标的资产", tags: ["underlying", "assets"] },
];

export const OKX_MODULES = [
  { id: "Market", color: "#22c55e", count: 13 },
  { id: "Spot", color: "#3b82f6", count: 13 },
  { id: "Swap", color: "#a855f7", count: 14 },
  { id: "Options", color: "#f59e0b", count: 8 },
  { id: "Account", color: "#06b6d4", count: 18 },
  { id: "Bot", color: "#ec4899", count: 13 },
  { id: "Futures", color: "#ef4444", count: 6 },
];
