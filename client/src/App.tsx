import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "./contexts/UserContext";
import { AdminProvider } from "./contexts/AdminContext";
import { ProductProvider } from "./contexts/ProductContext";
import { EventProvider } from "./contexts/EventContext";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import Layout from "./components/Layout";
import { Loader2 } from "lucide-react";
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
  // Vereinfachtes Routing ohne verschachtelte Switch-Komponenten
  const MainContent = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    const [, navigate] = useLocation();
    
    useEffect(() => {
      // Prüfe, ob der Benutzer angemeldet ist
      if (!isLoading && !user) {
        navigate('/auth');
      }
    }, [user, isLoading, navigate]);
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }
    
    if (!user) {
      return null; // Umleitung wird im useEffect ausgeführt
    }
    
    return <Layout>{children}</Layout>;
  };

  const AdminContent = ({ children }: { children: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    const [, navigate] = useLocation();
    
    useEffect(() => {
      // Prüfe, ob der Benutzer ein Admin ist
      if (!isLoading && (!user || !user.isAdmin)) {
        navigate('/');
      }
    }, [user, isLoading, navigate]);
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }
    
    if (!user || !user.isAdmin) {
      return null; // Umleitung wird im useEffect ausgeführt
    }
    
    return <Layout>{children}</Layout>;
  };

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Geschützte Routen in Layout eingebettet */}
      <Route path="/">
        {() => <MainContent><Home /></MainContent>}
      </Route>
      <Route path="/profile/:id">
        {({ id }) => <MainContent><Profile id={id} /></MainContent>}
      </Route>
      <Route path="/challenges">
        {() => <MainContent><Challenges /></MainContent>}
      </Route>
      <Route path="/challenges/:id">
        {({ id }) => <MainContent><ChallengeDetail id={id} /></MainContent>}
      </Route>
      <Route path="/create/challenge">
        {() => <MainContent><CreateChallenge /></MainContent>}
      </Route>
      <Route path="/create/post">
        {() => <MainContent><CreatePost /></MainContent>}
      </Route>
      <Route path="/create/group">
        {() => <MainContent><CreateGroup /></MainContent>}
      </Route>
      <Route path="/create/event">
        {() => <MainContent><CreateEvent /></MainContent>}
      </Route>
      <Route path="/create/notification">
        {() => <MainContent><CreateNotification /></MainContent>}
      </Route>
      <Route path="/create/product">
        {() => <MainContent><CreateProduct /></MainContent>}
      </Route>
      <Route path="/products">
        {() => <MainContent><Products /></MainContent>}
      </Route>
      <Route path="/products/:id">
        {({ id }) => <MainContent><ProductDetail id={id} /></MainContent>}
      </Route>
      <Route path="/groups">
        {() => <MainContent><Groups /></MainContent>}
      </Route>
      <Route path="/groups/:id">
        {({ id }) => <MainContent><GroupPage id={id} /></MainContent>}
      </Route>
      <Route path="/events">
        {() => <MainContent><Events /></MainContent>}
      </Route>
      <Route path="/events/manager">
        {() => <MainContent><EventManager /></MainContent>}
      </Route>
      <Route path="/events/edit/:id">
        {({ id }) => <MainContent><EditEvent id={id} /></MainContent>}
      </Route>
      <Route path="/events/:id">
        {({ id }) => <MainContent><EventDetail id={id} /></MainContent>}
      </Route>
      <Route path="/members">
        {() => <MainContent><Members /></MainContent>}
      </Route>
      <Route path="/chat">
        {() => <MainContent><Chat /></MainContent>}
      </Route>
      <Route path="/chat/:id">
        {({ id }) => <MainContent><Chat id={id} /></MainContent>}
      </Route>
      <Route path="/chat/:id/direct">
        {({ id }) => <MainContent><Chat id={id} direct={true} /></MainContent>}
      </Route>
      <Route path="/admin">
        {() => <AdminContent><Admin /></AdminContent>}
      </Route>
      <Route path="/settings">
        {() => <MainContent><Settings /></MainContent>}
      </Route>
      <Route>
        {() => <MainContent><NotFound /></MainContent>}
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