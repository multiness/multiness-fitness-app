import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Typen für Benutzer und Authentifizierungsdaten
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  isVerified: boolean;
  isAdmin: boolean;
  isTeamMember: boolean;
  teamRole?: string;
  bio?: string;
  createdAt: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname?: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Auth-Context erstellen
export const AuthContext = createContext<AuthContextType | null>(null);

// Auth-Provider-Komponente
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/user", { 
        signal,
        credentials: "include" 
      });
      if (res.status === 401) {
        return null; // Null statt undefined zurückgeben
      }
      if (!res.ok) {
        throw new Error("Fehler beim Abrufen des Benutzers");
      }
      return res.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Login-Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Cache leeren vor dem Login
      queryClient.clear();
      
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Anmeldung fehlgeschlagen");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      // Alle vorherigen Abfragen ungültig machen und neu laden
      queryClient.invalidateQueries();
      
      // Danach explizit die Benutzerdaten setzen
      queryClient.setQueryData(["/api/user"], userData);
      
      // Erfolgsmeldung
      toast({
        title: "Erfolgreich angemeldet",
        description: "Willkommen zurück!",
      });
      
      console.log("Login erfolgreich durchgeführt für Benutzer:", userData.username);
    },
    onError: (error: Error) => {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Registrierungs-Mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      // Cache leeren vor der Registrierung
      queryClient.clear();
      
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Registrierung fehlgeschlagen");
      }
      return await res.json();
    },
    onSuccess: (userData: User) => {
      // Alle vorherigen Abfragen ungültig machen und neu laden
      queryClient.invalidateQueries();
      
      // Danach explizit die Benutzerdaten setzen
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Registrierung erfolgreich",
        description: "Dein Konto wurde erstellt! Bitte bestätige deine E-Mail-Adresse.",
      });
      
      console.log("Registrierung erfolgreich durchgeführt für Benutzer:", userData.username);
    },
    onError: (error: Error) => {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout-Mutation - optimiert ohne Verzögerung
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Direkte Verwendung von fetch mit bestimmten Optionen statt apiRequest
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Wenn nicht 2xx, dann werfen wir einen Fehler
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Logout Fehler:", errorText);
        throw new Error("Abmeldung fehlgeschlagen: " + errorText);
      }
      
      return;
    },
    onMutate: () => {
      // Sofortige UI-Aktualisierung vor dem Abschluss des Netzwerkanfrage
      // Dies beschleunigt den Abmeldeprozess aus Nutzersicht erheblich
      queryClient.setQueryData(["/api/user"], null);
      
      // Auch im lokalen Speicher die Benutzerdaten entfernen
      localStorage.removeItem('fitness-app-user');
      
      // Cache-Header invalidieren
      document.cookie = 'fitness_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    },
    onSuccess: () => {
      // Cache leeren
      queryClient.clear();
      
      // Erfolgsmeldung
      toast({
        title: "Abgemeldet",
        description: "Du wurdest erfolgreich abgemeldet.",
      });
      
      // Umleitung zur Login-Seite
      setTimeout(() => {
        window.location.href = '/auth';
      }, 500);
    },
    onError: (error: Error) => {
      // Cache-Aktualisierung rückgängig machen, falls ein Fehler auftritt
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      console.error("Logout fehlgeschlagen:", error);
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook für einfachen Zugriff auf den Auth-Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth muss innerhalb eines AuthProviders verwendet werden");
  }
  return context;
}