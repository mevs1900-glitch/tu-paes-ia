import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { QuizProvider } from "./contexts/QuizContext";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Level from "./pages/Level";
import Config from "./pages/Config";
import Quiz from "./pages/Quiz";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/home" component={Home} />
      <Route path="/nivel/:subject" component={Level} />
      <Route path="/config/:subject/:level">
        {(params) => (
          <Config
            subject={params.subject as "lenguaje" | "matematicas"}
            level={parseInt(params.level) as 1 | 2 | 3 | 4}
          />
        )}
      </Route>
      <Route path="/quiz" component={Quiz} />
      <Route path="/" component={Login} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <QuizProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </QuizProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
