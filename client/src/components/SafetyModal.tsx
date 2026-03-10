import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertTriangle, Shield, X, Lock, Eye, Server, Timer } from "lucide-react";

interface SafetyModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tool: string;
  params: Record<string, string>;
}

function getRiskLevel(tool: string, params: Record<string, string>): { level: "low" | "medium" | "high"; color: string } {
  if (tool.startsWith("market_") || tool.startsWith("account_")) return { level: "low", color: "#00e68a" };
  const sz = parseFloat(params.sz || params.size || "0");
  if (sz > 1 || tool.includes("swap_")) return { level: "high", color: "#ef4444" };
  return { level: "medium", color: "#f59e0b" };
}

export default function SafetyModal({ open, onConfirm, onCancel, tool, params }: SafetyModalProps) {
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const risk = getRiskLevel(tool, params);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setChecked(false);
      setCountdown(5);
    }
  }, [open]);

  // Countdown timer - button only enabled after countdown
  useEffect(() => {
    if (!open || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown]);

  const handleConfirm = useCallback(() => {
    if (checked && countdown <= 0) {
      onConfirm();
      setChecked(false);
    }
  }, [checked, countdown, onConfirm]);

  const canConfirm = checked && countdown <= 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onCancel} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg rounded-2xl border border-red-500/20 overflow-hidden"
            style={{ background: "oklch(0.12 0.005 260)" }}
          >
            {/* Risk level strip */}
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${risk.color}, ${risk.color}80, ${risk.color})` }} />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {t("Live Trading Confirmation", "实盘交易确认")}
                    </h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider" style={{ background: `${risk.color}15`, color: risk.color, border: `1px solid ${risk.color}30` }}>
                      {risk.level} risk
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "You are about to execute a REAL trade with REAL funds. This action cannot be undone.",
                      "你即将执行一笔真实交易，使用真实资金。此操作不可撤销。"
                    )}
                  </p>
                </div>
                <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-accent/50 text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Trade Details */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[1px] text-muted-foreground">{t("Trade Details", "交易详情")}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400">LIVE MODE</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground mb-3">
                  {t("Tool", "工具")}: <span className="text-red-400 font-semibold">{tool}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(params).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs py-1 border-b border-border/20 last:border-0">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono text-foreground font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Checklist */}
              <div className="space-y-2 mb-5">
                {[
                  { icon: Lock, titleEn: "Keys Local Only", titleZh: "密钥仅本地存储", descEn: "API keys stored in ~/.okx/config.toml, never uploaded.", descZh: "API密钥存储在 ~/.okx/config.toml，永远不会上传。" },
                  { icon: Eye, titleEn: "Read-Only Default", titleZh: "默认只读模式", descEn: "MCP Server uses read-only mode. Trade requires --demo=false.", descZh: "MCP Server默认只读。交易需要 --demo=false 标志。" },
                  { icon: Shield, titleEn: "Sub-account Recommended", titleZh: "建议使用子账户", descEn: "Use OKX sub-account with limited permissions for safety.", descZh: "使用OKX子账户并限制权限，更安全。" },
                  { icon: Server, titleEn: "MCP Protocol", titleZh: "MCP协议", descEn: "All trades go through MCP JSON-RPC 2.0 with full audit log.", descZh: "所有交易通过MCP JSON-RPC 2.0协议，完整审计日志。" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent/20 border border-border/10">
                    <item.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">{t(item.titleEn, item.titleZh)}</p>
                      <p className="text-[10px] text-muted-foreground">{t(item.descEn, item.descZh)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-center gap-3 mb-5 cursor-pointer p-3 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-colors">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="w-5 h-5 rounded border-red-500/50 text-red-500 focus:ring-red-500/30 flex-shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    "I understand this is a REAL trade with REAL funds. I have verified all parameters and accept all risks including potential financial loss.",
                    "我理解这是一笔真实交易，使用真实资金。我已验证所有参数，并接受所有风险，包括潜在的资金损失。"
                  )}
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-xl border border-border/50 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                >
                  {t("Cancel (Use Demo)", "取消（使用模拟）")}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600 flex items-center justify-center gap-2"
                >
                  {countdown > 0 ? (
                    <>
                      <Timer className="w-4 h-4" />
                      {t(`Wait ${countdown}s`, `等待 ${countdown}s`)}
                    </>
                  ) : (
                    t("Confirm Live Trade", "确认实盘交易")
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
