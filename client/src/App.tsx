import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import Groups from "./pages/Groups";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/profile/:id" component={Profile} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/challenges/:id" component={ChallengeDetail} />
        <Route path="/groups" component={Groups} />
        <Route path="/chat" component={Chat} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;