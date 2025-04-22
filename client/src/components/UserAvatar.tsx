import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePostStore } from "../lib/postStore";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useUsers, getUsersFromStorage, loadAPIUsers } from "../contexts/UserContext";
import { VerifiedBadge } from "./VerifiedBadge";
import { useState, useEffect } from "react";
import ImageModal from "./ImageModal";
import { Users } from "lucide-react";

export interface UserAvatarProps {
  userId: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showActiveGoal?: boolean;
  isGroup?: boolean;
  clickable?: boolean;
  hideVerifiedBadge?: boolean;
  enableImageModal?: boolean;
  disableLink?: boolean;
  // Hier sollten wir den Avatar prop entfernen, da er intern aus dem Benutzer abgerufen wird
}

export function UserAvatar({
  userId,
  size = "md",
  className,
  showActiveGoal = true,
  isGroup = false,
  clickable = true,
  hideVerifiedBadge = false,
  enableImageModal = false,
  disableLink = false
}: UserAvatarProps) {
  const postStore = usePostStore();
  const { users: contextUsers } = useUsers();
  
  // Implementiere eine robuste User-Suche-Logik
  const [user, setUser] = useState<any>(null);

  // Lade Benutzer von API und lokalen Quellen
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Versuche zuerst den Benutzer aus dem Context zu holen
        const contextUser = contextUsers.find(u => u.id === userId);
        if (contextUser) {
          setUser(contextUser);
          return;
        }
        
        // Andernfalls versuche direkt aus dem localStorage zu laden
        const storageUsers = getUsersFromStorage();
        const storageUser = storageUsers.find(u => u.id === userId);
        if (storageUser) {
          setUser(storageUser);
          return;
        }
        
        // Als letzte Option: Versuche den Benutzer direkt von der API zu laden
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const apiUser = await response.json();
            if (apiUser && typeof apiUser === 'object') {
              console.log(`Benutzer mit ID ${userId} von API geladen:`, apiUser);
              setUser(apiUser);
              // Aktualisiere die Benutzer-Liste im Context und Storage
              loadAPIUsers();
              return;
            }
          }
        } catch (apiError) {
          console.warn(`Fehler beim Laden des Benutzers mit ID ${userId} von API:`, apiError);
        }
        
        // Wenn immer noch nicht gefunden, aktualisiere die Benutzer-Liste und versuche erneut
        loadAPIUsers();
        
        // Standard-Fallback
        // Stille Fehlermeldung, nur für Entwicklungszwecke
        console.debug(`Benutzer mit ID ${userId} konnte nicht geladen werden`);
      } catch (error) {
        console.error(`Fehler beim Laden des Benutzers mit ID ${userId}:`, error);
      }
    };
    
    loadUser();
  }, [contextUsers, userId]);

  // Aktualisiere den Benutzer, wenn sich der Context ändert
  useEffect(() => {
    const updatedUser = contextUsers.find(u => u.id === userId);
    if (updatedUser) {
      setUser(updatedUser);
    }
  }, [contextUsers, userId]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fallback-Benutzer, wenn kein Benutzer gefunden wurde
  if (!user) {
    // Stille Fehlermeldung, da dieser Fall häufig vorkommt wenn Daten noch laden
    console.debug(`Benutzer mit ID ${userId} noch nicht geladen`);
    return null;
  }

  const hasActiveGoal = showActiveGoal && postStore.getDailyGoal(userId);

  // Optimierte Größen für bessere Darstellung im Desktop-Layout
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16" // Kleinere große Avatare für bessere Einpassung in Karten
  };

  const containerClasses = cn(
    "rounded-full p-[2px]",
    isGroup
      ? "bg-gradient-to-r from-green-500 to-green-300 ring-2 ring-green-100" // Gruppen-Chats haben einen deutlichen grünen Rahmen
      : hasActiveGoal
        ? "bg-gradient-to-r from-blue-400 to-blue-300" // Benutzer mit aktivem Ziel haben einen blauen Rahmen
        : "p-0", // Normale Benutzer ohne Rahmen
    sizeClasses[size],
    enableImageModal && "cursor-zoom-in hover:opacity-90 transition-opacity",
    !enableImageModal && clickable && "cursor-pointer hover:opacity-90 transition-opacity"
  );

  const avatarClasses = cn(
    "h-full w-full",
    "ring-0",
    className
  );

  const handleClick = (e: React.MouseEvent) => {
    if (enableImageModal) {
      e.preventDefault();
      e.stopPropagation();
      setIsModalOpen(true);
    }
  };

  const AvatarComponent = (
    <div className="relative inline-block">
      <div className={containerClasses} onClick={handleClick}>
        <Avatar className={avatarClasses}>
          {isGroup ? (
            <>
              {/* Verbesserte Behandlung für Gruppenavatar mit zuverlässigerem Fallback */}
              <AvatarImage 
                src={user.avatar || undefined} 
                alt={user.username} 
                className="object-cover rounded-full" 
                onError={(e) => {
                  console.log(`Gruppenbild konnte nicht geladen werden für: ${user.id} - ${user.username}`);
                  e.currentTarget.style.display = "none"; // Verstecke das fehlerhafte Bild
                }}
              />
              <AvatarFallback className="rounded-full bg-gradient-to-br from-green-500 to-green-600">
                <Users className="h-1/2 w-1/2 text-white" />
              </AvatarFallback>
            </>
          ) : (
            <>
              {/* Verbesserter Benutzeravatar mit besserer Fehlerbehandlung */}
              <AvatarImage 
                src={user.avatar || undefined} 
                alt={user.username} 
                className="object-cover rounded-full"
                onError={(e) => {
                  console.log(`Benutzerbild konnte nicht geladen werden für: ${user.id} - ${user.username}`);
                  e.currentTarget.style.display = "none"; // Verstecke das fehlerhafte Bild
                }} 
              />
              <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </>
          )}
        </Avatar>
      </div>
      
      {/* Verbesserte Gruppenkennzeichnung für bessere visuelle Unterscheidung */}
      {isGroup && (
        <div className={`absolute ${size === "sm" ? "-top-1 -right-1 px-1 py-0.5 text-[6px]" : "-top-2 -right-1 px-1.5 py-0.5 text-[8px]"} bg-green-500 text-white font-semibold rounded-full shadow-sm z-10`}>
          {size === "sm" ? "G" : "GRUPPE"}
        </div>
      )}
      
      {/* Team-Position anzeigen, wenn verfügbar - optimiert für Desktop */}
      {user.isTeamMember && user.teamRole && size === "lg" && (
        <div className="absolute -bottom-5 left-0 right-0 text-center">
          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full whitespace-nowrap">
            {user.teamRole.replace('_', ' ')}
          </span>
        </div>
      )}
      
      {!hideVerifiedBadge && user.isVerified && (
        <div className="absolute -bottom-1 -right-1">
          <VerifiedBadge size={size === "lg" ? "default" : "sm" as "sm" | "default"} />
        </div>
      )}
      
      {enableImageModal && (
        <ImageModal
          src={user.avatar || "/placeholder-avatar.png"}
          alt={user.username}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );

  // Verwende Link nur wenn explizit erlaubt und clickable
  if (clickable && !isGroup && !enableImageModal && !disableLink) {
    return (
      <Link href={`/profile/${userId}`}>
        {AvatarComponent}
      </Link>
    );
  }

  return AvatarComponent;
}

export default UserAvatar;