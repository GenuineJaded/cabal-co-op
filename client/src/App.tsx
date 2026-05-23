import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import Doorway from "./pages/Doorway";
import Forum from "./pages/Forum";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/field" component={Doorway} />
      <Route path="/field/:door" component={Forum} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster />
      <Router />
    </ErrorBoundary>
  );
}
