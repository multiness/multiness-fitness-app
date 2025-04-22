import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "./contexts/UserContext";
import { AdminProvider } from "./contexts/AdminContext";
import { ProductProvider } from "./contexts/ProductContext";
import { EventProvider } from "./contexts/EventContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { AuthProvider } from "./hooks/use-auth";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import CreateChallenge from "./pages/CreateChallenge";
import CreatePost from "./pages/CreatePost";
import CreateGroup from "./pages/CreateGroup";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import CreateNotification from "./pages/CreateNotification";
import CreateProduct from "./pages/CreateProduct";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Groups from "./pages/Groups";
import GroupPage from "./pages/GroupPage";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventManager from "./pages/EventManager";
import Members from "./pages/Members";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import { initializeGroupSync } from "./lib/groupSynchronizer";
import { ProtectedRoute, AdminRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/">
        {() => (
          <Layout>
            <Switch>
              <ProtectedRoute path="/" component={Home} />
              <ProtectedRoute path="/profile/:id" component={Profile} />
              <ProtectedRoute path="/challenges" component={Challenges} />
              <ProtectedRoute path="/challenges/:id" component={ChallengeDetail} />
              <ProtectedRoute path="/create/challenge" component={CreateChallenge} />
              <ProtectedRoute path="/create/post" component={CreatePost} />
              <ProtectedRoute path="/create/group" component={CreateGroup} />
              <ProtectedRoute path="/create/event" component={CreateEvent} />
              <ProtectedRoute path="/create/notification" component={CreateNotification} />
              <ProtectedRoute path="/create/product" component={CreateProduct} />
              <ProtectedRoute path="/products" component={Products} />
              <ProtectedRoute path="/products/:id" component={ProductDetail} />
              <ProtectedRoute path="/groups" component={Groups} />
              <ProtectedRoute path="/groups/:id" component={GroupPage} />
              <ProtectedRoute path="/events" component={Events} />
              <ProtectedRoute path="/events/manager" component={EventManager} />
              <ProtectedRoute path="/events/edit/:id" component={EditEvent} />
              <ProtectedRoute path="/events/:id" component={EventDetail} />
              <ProtectedRoute path="/members" component={Members} />
              <ProtectedRoute path="/chat" component={Chat} />
              <ProtectedRoute path="/chat/:id" component={Chat} />
              <ProtectedRoute path="/chat/:id/direct" component={Chat} />
              <ProtectedRoute path="/admin" component={Admin} />
              <ProtectedRoute path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  // Initialisiere die Gruppensynchronisierung beim App-Start
  useEffect(() => {
    // Starte die Gruppen-Synchronisierung für bessere Cross-Device Kommunikation
    initializeGroupSync();
    
    // Log zur Bestätigung
    console.log('Gruppensynchronisierung initialisiert für Cross-Device-Kompatibilität');
  }, []);
  
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserProvider>
            <AdminProvider>
              <ProductProvider>
                <EventProvider>
                  <Router />
                  <Toaster />
                </EventProvider>
              </ProductProvider>
            </AdminProvider>
          </UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;