import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import Copilot from "./pages/Copilot";
import AgentTradeKit from "./pages/AgentTradeKit";
import MCPVisualizer from "./pages/MCPVisualizer";
import AgentSkills from "./pages/AgentSkills";
import WalletConnect from "./pages/WalletConnect";
import TokenMonitor from "./pages/TokenMonitor";
import StrategyStudio from "./pages/StrategyStudio";
import RiskDashboard from "./pages/RiskDashboard";
import TradeReview from "./pages/TradeReview";
import ReasoningChain from "./pages/ReasoningChain";
import UseCases from "./pages/UseCases";
import OnchainOS from "./pages/OnchainOS";
import ClawPrompt from "./pages/ClawPrompt";
import WhaleSignal from "./pages/WhaleSignal";
import SecurityAudit from "./pages/SecurityAudit";
import ShareToX from "./pages/ShareToX";
import SimulationPanel from "./pages/SimulationPanel";
import Layout from "./components/Layout";
import CommandPalette from "./components/CommandPalette";
import DynamicIsland from "./components/DynamicIsland";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/copilot" component={Copilot} />
        <Route path="/agent-trade-kit" component={AgentTradeKit} />
        <Route path="/mcp-visualizer" component={MCPVisualizer} />
        <Route path="/agent-skills" component={AgentSkills} />
        <Route path="/wallet" component={WalletConnect} />
        <Route path="/token-monitor" component={TokenMonitor} />
        <Route path="/strategy-studio" component={StrategyStudio} />
        <Route path="/risk-dashboard" component={RiskDashboard} />
        <Route path="/trade-review" component={TradeReview} />
        <Route path="/simulation" component={SimulationPanel} />
        <Route path="/reasoning-chain" component={ReasoningChain} />
        <Route path="/claw-prompt" component={ClawPrompt} />
        <Route path="/use-cases" component={UseCases} />
        <Route path="/whale-signal" component={WhaleSignal} />
        <Route path="/onchain-os" component={OnchainOS} />
        <Route path="/security-audit" component={SecurityAudit} />
        <Route path="/share-to-x" component={ShareToX} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: 'oklch(0.14 0.005 260)',
                  border: '1px solid oklch(1 0 0 / 8%)',
                  color: 'oklch(0.93 0.005 260)',
                },
              }}
            />
            <CommandPalette />
            <DynamicIsland />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
