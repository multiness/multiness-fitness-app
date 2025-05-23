import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

// Interfaces angepasst für AWS Cognito-Kompatibilität
interface LoginFormData {
  username: string;
  password: string;
}

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  nickname?: string;
}

/**
 * AuthComponent - Wiederverwendbare Authentifizierungskomponente
 * Designt für Kompatibilität mit AWS Cognito
 */
export const AuthComponent = ({
  onLoginSuccess,
  onRegisterSuccess,
}: {
  onLoginSuccess?: (userData: any) => void;
  onRegisterSuccess?: (userData: any) => void;
}) => {
  const [activeTab, setActiveTab] = useState("login");
  const [formError, setFormError] = useState<string | null>(null);
  const [loginData, setLoginData] = useState<LoginFormData>({
    username: "",
    password: "",
  });
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    nickname: "",
  });
  const { toast } = useToast();
  const { loginMutation, registerMutation } = useAuth();
  
  // Login success handler  
  useEffect(() => {
    if (loginMutation.isSuccess && loginMutation.data) {
      setFormError(null);
      if (onLoginSuccess) {
        onLoginSuccess(loginMutation.data);
      }
    }
  }, [loginMutation.isSuccess, loginMutation.data, onLoginSuccess]);
  
  // Register success handler
  useEffect(() => {
    if (registerMutation.isSuccess && registerMutation.data) {
      setFormError(null);
      if (onRegisterSuccess) {
        onRegisterSuccess(registerMutation.data);
      }
    }
  }, [registerMutation.isSuccess, registerMutation.data, onRegisterSuccess]);
  
  // Error handling for login
  useEffect(() => {
    if (loginMutation.isError && loginMutation.error) {
      setFormError(loginMutation.error.message);
    }
  }, [loginMutation.isError, loginMutation.error]);
  
  // Error handling for registration
  useEffect(() => {
    if (registerMutation.isError && registerMutation.error) {
      setFormError(registerMutation.error.message);
    }
  }, [registerMutation.isError, registerMutation.error]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    loginMutation.mutate(loginData);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setFormError("Passwörter stimmen nicht überein");
      return;
    }

    // Passwort muss mindestens 8 Zeichen lang sein (für Cognito)
    if (registerData.password.length < 8) {
      setFormError("Das Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    // Basic validation
    if (!registerData.username || !registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
      setFormError("Bitte fülle alle Pflichtfelder aus");
      return;
    }
    
    // Validierung des Benutzernamens (nur alphanumerisch)
    if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
      setFormError("Der Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten");
      return;
    }

    const { confirmPassword, ...registerPayload } = registerData;
    registerMutation.mutate(registerPayload);
  };

  const handlePasswordReset = () => {
    // We'll implement this later with Cognito's forgotPassword API
    toast({
      title: "Passwort zurücksetzen",
      description: "Diese Funktion wird bald verfügbar sein.",
    });
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Anmelden</TabsTrigger>
          <TabsTrigger value="register">Registrieren</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Anmelden</CardTitle>
              <CardDescription>
                Gib deine Anmeldedaten ein, um auf dein Konto zuzugreifen.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleLoginSubmit}>
              <CardContent className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername</Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Benutzername" 
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Passwort</Label>
                    <Button 
                      variant="link" 
                      className="p-0 text-xs"
                      onClick={handlePasswordReset}
                      type="button"
                    >
                      Passwort vergessen?
                    </Button>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="********" 
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Anmeldung..." : "Anmelden"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Konto erstellen</CardTitle>
              <CardDescription>
                Gib deine Daten ein, um ein neues Konto zu erstellen.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegisterSubmit}>
              <CardContent className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input 
                      id="firstName" 
                      type="text" 
                      placeholder="Vorname" 
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input 
                      id="lastName" 
                      type="text" 
                      placeholder="Nachname" 
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername <span className="text-red-500">*</span></Label>
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="Wähle einen Benutzernamen (für die Anmeldung)" 
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname (optional)</Label>
                  <Input 
                    id="nickname" 
                    type="text" 
                    placeholder="Dein Nickname" 
                    value={registerData.nickname}
                    onChange={(e) => setRegisterData({...registerData, nickname: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="deine@email.de" 
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Passwort (mind. 8 Zeichen)</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="********" 
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="********" 
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    minLength={8}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Registrierung..." : "Registrieren"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * AuthPage - Haupt-Auth-Seite, die die AuthComponent verwendet
 */
export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  // Wenn Benutzer bereits angemeldet ist, zu Startseite umleiten
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  const handleAuthSuccess = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <div className="grid w-full max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FitnessApp</h1>
            <p className="text-muted-foreground mt-2">
              Deine Fitness-Community - Registriere dich, um mit Gleichgesinnten zu trainieren und dich zu motivieren.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Verfolge deine Fortschritte</h3>
                <p className="text-sm text-muted-foreground">
                  Setze Ziele und beobachte deinen Fortschritt Tag für Tag.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Tritt Gruppen bei</h3>
                <p className="text-sm text-muted-foreground">
                  Vernetze dich mit anderen und trainiert gemeinsam.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z"/>
                  <line x1="16" y1="8" x2="2" y2="22"/>
                  <line x1="17.5" y1="15" x2="9" y2="15"/>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Nimm an Challenges teil</h3>
                <p className="text-sm text-muted-foreground">
                  Fordere dich selbst mit regelmäßigen Fitness-Challenges heraus.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <AuthComponent 
            onLoginSuccess={handleAuthSuccess}
            onRegisterSuccess={handleAuthSuccess}
          />
        </div>
      </div>
    </div>
  );
}