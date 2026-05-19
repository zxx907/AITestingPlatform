import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import TestCaseGenerator from "./pages/TestCaseGenerator";
import APITesting from "./pages/APITesting";
import ScriptGenerator from "./pages/ScriptGenerator";
import PerformanceTesting from "./pages/PerformanceTesting";
import BugAnalysis from "./pages/BugAnalysis";
import SQLGenerator from "./pages/SQLGenerator";
import TestReport from "./pages/TestReport";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={() => <DashboardLayout><Dashboard /></DashboardLayout>} />
      <Route path="/test-case-generator" component={() => <DashboardLayout><TestCaseGenerator /></DashboardLayout>} />
      <Route path="/api-testing" component={() => <DashboardLayout><APITesting /></DashboardLayout>} />
      <Route path="/script-generator" component={() => <DashboardLayout><ScriptGenerator /></DashboardLayout>} />
      <Route path="/performance-testing" component={() => <DashboardLayout><PerformanceTesting /></DashboardLayout>} />
      <Route path="/bug-analysis" component={() => <DashboardLayout><BugAnalysis /></DashboardLayout>} />
      <Route path="/sql-generator" component={() => <DashboardLayout><SQLGenerator /></DashboardLayout>} />
      <Route path="/test-report" component={() => <DashboardLayout><TestReport /></DashboardLayout>} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
