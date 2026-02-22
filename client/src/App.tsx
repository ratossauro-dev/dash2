import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import CyberpunkLayout from "./components/CyberpunkLayout";
import Home from "./pages/Home";
import Bots from "./pages/Bots";
import Media from "./pages/Media";
import Subscribers from "./pages/Subscribers";
import Payments from "./pages/Payments";
import SocialAccounts from "./pages/SocialAccounts";
import Prompts from "./pages/Prompts";
import Assistant from "./pages/Assistant";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Tokens from "./pages/Tokens";

function Router() {
  return (
    <CyberpunkLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/bots" component={Bots} />
        <Route path="/media" component={Media} />
        <Route path="/subscribers" component={Subscribers} />
        <Route path="/payments" component={Payments} />
        <Route path="/social" component={SocialAccounts} />
        <Route path="/prompts" component={Prompts} />
        <Route path="/assistant" component={Assistant} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/settings" component={Settings} />
        <Route path="/tokens" component={Tokens} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </CyberpunkLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" toastOptions={{
            style: {
              background: "#0f0f1a",
              border: "1px solid #1a1a2e",
              color: "#e0e0f0",
              fontFamily: "'Rajdhani', sans-serif",
            }
          }} />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
