import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertTriangle, Shield, X, CheckCircle2, ExternalLink } from "lucide-react";

interface SafetyModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tool: string;
  params: Record<string, string>;
}

export default function SafetyModal({ open, onConfirm, onCancel, tool, params }: SafetyModalProps) {
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);

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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl border border-red-500/20 overflow-hidden"
            style={{ background: "oklch(0.12 0.005 260)" }}
          >
            {/* Red warning strip */}
            <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {t("Live Trading Confirmation", "实盘交易确认")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "You are about to execute a REAL trade with REAL funds. This action cannot be undone.",
                      "你即将执行一笔真实交易，使用真实资金。此操作不可撤销。"
                    )}
                  </p>
                </div>
                <button onClick={onCancel} className="p-1 rounded-lg hover:bg-accent/50 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Trade Details */}
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 mb-4">
                <div className="text-xs font-mono text-muted-foreground mb-2">
                  {t("Tool", "工具")}: <span className="text-red-400">{tool}</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(params).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-mono text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Checklist */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{t("Sub-account Recommended", "建议使用子账户")}</strong>
                    <br />
                    {t(
                      "Use an OKX sub-account with limited permissions for safer trading.",
                      "使用OKX子账户并限制权限，交易更安全。"
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{t("Keys Local Only", "密钥仅本地存储")}</strong>
                    <br />
                    {t(
                      "Your API keys are stored locally in ~/.okx/config.toml and never uploaded.",
                      "你的API密钥存储在本地 ~/.okx/config.toml，永远不会上传。"
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                  <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{t("Read-Only by Default", "默认只读权限")}</strong>
                    <br />
                    {t(
                      "MCP Server uses read-only mode by default. Trade requires explicit --demo=false flag.",
                      "MCP Server默认使用只读模式。交易需要显式 --demo=false 标志。"
                    )}
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-center gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-red-500/50 text-red-500 focus:ring-red-500/30"
                />
                <span className="text-xs text-muted-foreground">
                  {t(
                    "I understand this is a REAL trade with REAL funds and accept all risks.",
                    "我理解这是一笔真实交易，使用真实资金，并接受所有风险。"
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
                  onClick={() => { if (checked) { onConfirm(); setChecked(false); } }}
                  disabled={!checked}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {t("Confirm Live Trade", "确认实盘交易")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
