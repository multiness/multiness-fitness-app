import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "./contexts/UserContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import CreateChallenge from "./pages/CreateChallenge";
import CreatePost from "./pages/CreatePost";
import CreateGroup from "./pages/CreateGroup";
import CreateEvent from "./pages/CreateEvent";
import CreateNotification from "./pages/CreateNotification";
import CreateProduct from "./pages/CreateProduct";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Groups from "./pages/Groups";
import GroupPage from "./pages/GroupPage";
import Events from "./pages/Events";
import Members from "./pages/Members";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/profile/:id" component={Profile} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/challenges/:id" component={ChallengeDetail} />
        <Route path="/create/challenge" component={CreateChallenge} />
        <Route path="/create/post" component={CreatePost} />
        <Route path="/create/group" component={CreateGroup} />
        <Route path="/create/event" component={CreateEvent} />
        <Route path="/create/notification" component={CreateNotification} />
        <Route path="/create/product" component={CreateProduct} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/groups" component={Groups} />
        <Route path="/groups/:id" component={GroupPage} />
        <Route path="/events" component={Events} />
        <Route path="/members" component={Members} />
        <Route path="/chat" component={Chat} />
        <Route path="/chat/:id" component={Chat} />
        <Route path="/admin" component={Admin} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <Router />
          <Toaster />
        </UserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;