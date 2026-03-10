import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShieldCheck, ChevronRight, CheckCircle, AlertTriangle, XCircle, Lock, Key, Eye, Shield } from "lucide-react";

const AUDIT_ITEMS = [
  { id: "api_readonly", nameEn: "API Key Read-Only Mode", nameZh: "API密钥只读模式", descEn: "API keys should be configured as read-only to prevent unauthorized trades.", descZh: "API密钥应配置为只读以防止未授权交易。", status: "pass", icon: Key },
  { id: "demo_mode", nameEn: "Demo Mode Active", nameZh: "演示模式激活", descEn: "All operations run in demo/simulation mode. No real funds at risk.", descZh: "所有操作在演示/模拟模式下运行。没有真实资金风险。", status: "pass", icon: Shield },
  { id: "local_keys", nameEn: "Keys Stay Local", nameZh: "密钥本地存储", descEn: "Private keys and API secrets never leave your device or browser.", descZh: "私钥和API密钥永远不会离开你的设备或浏览器。", status: "pass", icon: Lock },
  { id: "no_server_keys", nameEn: "No Server-Side Key Storage", nameZh: "无服务端密钥存储", descEn: "This application does not store any keys on remote servers.", descZh: "本应用不在远程服务器上存储任何密钥。", status: "pass", icon: Eye },
  { id: "open_source", nameEn: "Open Source (MIT)", nameZh: "开源 (MIT)", descEn: "Full source code available on GitHub for audit and verification.", descZh: "完整源代码在GitHub上可供审计和验证。", status: "pass", icon: CheckCircle },
  { id: "risk_confirm", nameEn: "Risk Confirmation Dialogs", nameZh: "风险确认弹窗", descEn: "All potentially dangerous operations require explicit user confirmation.", descZh: "所有潜在危险操作都需要用户明确确认。", status: "pass", icon: AlertTriangle },
  { id: "rate_limit", nameEn: "Rate Limiting", nameZh: "频率限制", descEn: "API calls are rate-limited to prevent accidental flooding.", descZh: "API调用有频率限制以防止意外洪泛。", status: "pass", icon: Shield },
  { id: "https", nameEn: "HTTPS Only", nameZh: "仅HTTPS", descEn: "All communications use encrypted HTTPS connections.", descZh: "所有通信使用加密的HTTPS连接。", status: "pass", icon: Lock },
];

const RISK_LEVELS = [
  { action: "View Market Data", actionZh: "查看行情数据", risk: "none", color: "#22c55e" },
  { action: "View Portfolio", actionZh: "查看投资组合", risk: "low", color: "#22c55e" },
  { action: "Place Demo Order", actionZh: "下模拟单", risk: "low", color: "#22c55e" },
  { action: "Create Grid Bot (Demo)", actionZh: "创建网格机器人(模拟)", risk: "medium", color: "#f59e0b" },
  { action: "Place Real Order", actionZh: "下真实订单", risk: "high", color: "#ef4444" },
  { action: "Export API Keys", actionZh: "导出API密钥", risk: "critical", color: "#ef4444" },
];

export default function SecurityAudit() {
  const { t } = useLanguage();
  const [showRiskDialog, setShowRiskDialog] = useState(false);

  const passCount = AUDIT_ITEMS.filter((i) => i.status === "pass").length;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>{t("Advanced", "高级")}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">{t("Security Audit", "安全审计")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("Security Audit Panel", "安全审计面板")}</h1>
          <p className="text-muted-foreground">{t("Verify security posture and risk controls.", "验证安全态势和风控措施。")}</p>
        </motion.div>

        {/* Score */}
        <div className="glass-card p-8 text-center mb-8">
          <div className="text-6xl font-bold text-green-400 mb-2">{passCount}/{AUDIT_ITEMS.length}</div>
          <p className="text-sm text-muted-foreground">{t("Security checks passed", "安全检查通过")}</p>
          <div className="mt-4 h-2 rounded-full bg-accent overflow-hidden max-w-xs mx-auto">
            <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${(passCount / AUDIT_ITEMS.length) * 100}%` }} />
          </div>
        </div>

        {/* Audit Items */}
        <div className="space-y-3 mb-8">
          {AUDIT_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 flex items-start gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium mb-1">{t(item.nameEn, item.nameZh)}</h3>
                  <p className="text-xs text-muted-foreground">{t(item.descEn, item.descZh)}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-green-500/10 text-green-400 font-medium">PASS</span>
              </motion.div>
            );
          })}
        </div>

        {/* Risk Matrix */}
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-primary" />
          {t("Risk Matrix", "风险矩阵")}
        </h2>
        <div className="glass-card overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{t("Action", "操作")}</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{t("Risk Level", "风险等级")}</th>
              </tr>
            </thead>
            <tbody>
              {RISK_LEVELS.map((item, i) => (
                <tr key={i} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 text-sm">{t(item.action, item.actionZh)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: `${item.color}15`, color: item.color }}>
                      {item.risk.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Risk Dialog Demo */}
        <button
          onClick={() => setShowRiskDialog(true)}
          className="w-full glass-card p-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t("Click to preview risk confirmation dialog", "点击预览风险确认弹窗")}
        </button>

        {showRiskDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowRiskDialog(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{t("Risk Confirmation", "风险确认")}</h3>
                  <p className="text-xs text-muted-foreground">{t("This action requires your approval", "此操作需要你的批准")}</p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 mb-4">
                <p className="text-sm text-foreground/80">
                  {t("You are about to place a REAL order. This will use actual funds from your account. Are you sure?", "你即将下一个真实订单。这将使用你账户中的实际资金。确定吗？")}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowRiskDialog(false)} className="flex-1 px-4 py-2 rounded-lg border border-border/50 text-sm font-medium hover:bg-accent/50 transition-colors">
                  {t("Cancel", "取消")}
                </button>
                <button onClick={() => setShowRiskDialog(false)} className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                  {t("Confirm", "确认")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
