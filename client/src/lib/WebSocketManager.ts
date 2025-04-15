/**
 * Robuste WebSocket-Verbindungsverwaltung mit automatischer Wiederverbindung
 * Verbessert Zuverlässigkeit für Desktop- und Mobilgeräte
 */

export interface WebSocketManagerCallbacks {
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
}

export class WebSocketManager {
  private url: string;
  private socket: WebSocket | null = null;
  private callbacks: WebSocketManagerCallbacks;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectInterval: number = 1000; // Anfangsverzögerung 1 Sekunde (schneller)
  private maxReconnectInterval: number = 10000; // Maximale Verzögerung 10 Sekunden (schneller)
  private isAlive: boolean = false;
  private pingInterval: ReturnType<typeof setTimeout> | null = null;
  private connectAttempts = 0;
  private maxConnectAttempts = 10; // Nach 10 Versuchen die Seite neu laden
  private subscriptions: { topic: string, data?: Record<string, any> }[] = [];
  private pendigMessages: any[] = [];
  
  constructor(url: string, callbacks: WebSocketManagerCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
    
    // Seite-Sichtbarkeits-Event hinzufügen
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    // Offline/Online Events
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
    
    this.connect();
  }
  
  /**
   * Verbindung herstellen und Event-Handler einrichten
   */
  private connect(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED && this.socket.readyState !== WebSocket.CLOSING) {
      // Wenn die Verbindung bereits besteht oder gerade hergestellt wird, nicht neu verbinden
      return;
    }
    
    try {
      // Vorherige Verbindung aufräumen
      if (this.socket) {
        try {
          this.socket.close();
        } catch (err) {
          // Fehler ignorieren, socket war vielleicht schon geschlossen
        }
      }
      
      // Neue Verbindung erstellen
      this.connectAttempts++;
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket verbunden:', this.url);
        this.isAlive = true;
        this.connectAttempts = 0; // Zurücksetzen bei erfolgreicher Verbindung
        
        // Zurücksetzen des Reconnect-Intervalls bei erfolgreicher Verbindung
        this.reconnectInterval = 1000;
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Ping initialisieren, um Verbindung aktiv zu halten
        this.startPingInterval();
        
        // Ausstehende Abonnements wiederherstellen
        this.resubscribeAll();
        
        // Ausstehende Nachrichten senden
        this.sendPendingMessages();
        
        if (this.callbacks.onOpen) {
          this.callbacks.onOpen();
        }
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Auf Ping-Antwort (Pong) reagieren
          if (data.type === 'pong') {
            this.isAlive = true;
            return;
          }
          
          if (this.callbacks.onMessage) {
            this.callbacks.onMessage(data);
          }
        } catch (e) {
          console.error('Fehler beim Parsen der WebSocket-Nachricht:', e);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket-Fehler:', error);
        
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
        
        // Bei Fehlern sofort die Verbindung schließen und neu verbinden
        if (this.socket) {
          try {
            this.socket.close();
          } catch (err) {
            // Fehler ignorieren
          }
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket-Verbindung geschlossen, bereite Wiederverbindung vor...');
        this.isAlive = false;
        
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
        if (this.callbacks.onClose) {
          this.callbacks.onClose();
        }
        
        // Direkt eine Wiederverbindung planen
        this.scheduleReconnect();
      };
      
    } catch (err) {
      console.error('Fehler beim Erstellen der WebSocket-Verbindung:', err);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handler für Sichtbarkeitsänderungen der Seite
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // Wenn die Seite wieder sichtbar wird, WebSocket-Verbindung überprüfen und ggf. neu verbinden
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.log('Seite wieder sichtbar, prüfe WebSocket-Verbindung...');
        this.reconnect();
      }
    }
  };
  
  /**
   * Handler für Offline-Status
   */
  private handleOffline = (): void => {
    console.log('Gerät offline, WebSocket-Verbindung wird unterbrochen.');
    // Keine sofortige Wiederverbindung, da das Gerät offline ist
  };
  
  /**
   * Handler für Online-Status
   */
  private handleOnline = (): void => {
    console.log('Gerät wieder online, stelle WebSocket-Verbindung wieder her.');
    this.reconnect();
  };
  
  /**
   * Wiederverbindung mit exponentiellem Backoff planen
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Seite neuladen, wenn zu viele Verbindungsversuche fehlgeschlagen sind
    if (this.connectAttempts > this.maxConnectAttempts) {
      console.log('Zu viele fehlgeschlagene Verbindungsversuche. Lade Seite neu...');
      window.location.reload();
      return;
    }
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Versuche WebSocket-Wiederverbindung nach ${this.reconnectInterval/1000} Sekunden...`);
      this.connect();
      
      // Erhöhe das Intervall für den nächsten Versuch (exponentielles Backoff)
      this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, this.maxReconnectInterval);
    }, this.reconnectInterval);
  }
  
  /**
   * Starte Ping-Intervall, um die Verbindung aktiv zu halten und tote Verbindungen zu erkennen
   */
  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (!this.isAlive) {
        console.log('WebSocket nicht mehr erreichbar, stelle Verbindung wieder her...');
        
        if (this.socket) {
          try {
            this.socket.close();
          } catch (err) {
            // Fehler ignorieren
          }
        }
        
        // Sofort neu verbinden
        this.connect();
        return;
      }
      
      this.isAlive = false;
      this.send({ type: 'ping' });
    }, 15000); // Ping alle 15 Sekunden statt 30 (schneller)
  }
  
  /**
   * Nachricht über WebSocket senden
   */
  public send(data: any): boolean {
    const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(serializedData);
        return true;
      } catch (err) {
        console.error('Fehler beim Senden einer WebSocket-Nachricht:', err);
        
        // Nachricht für späteres Senden speichern
        this.pendigMessages.push(data);
        
        // Verbindung neu herstellen
        this.reconnect();
        return false;
      }
    } else {
      // Nachricht für späteres Senden speichern
      this.pendigMessages.push(data);
      
      // Verbindung herstellen falls noch nicht vorhanden
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connect();
      }
      
      return false;
    }
  }
  
  /**
   * Gespeicherte ausstehende Nachrichten senden
   */
  private sendPendingMessages(): void {
    if (this.pendigMessages.length === 0) return;
    
    console.log(`Sende ${this.pendigMessages.length} ausstehende Nachrichten...`);
    
    // Kopie der Nachrichten erstellen, da wir die Liste möglicherweise verändern
    const messagesToSend = [...this.pendigMessages];
    this.pendigMessages = [];
    
    // Alle Nachrichten senden
    for (const message of messagesToSend) {
      this.send(message);
    }
  }
  
  /**
   * Alle Abonnements erneut senden
   */
  private resubscribeAll(): void {
    for (const sub of this.subscriptions) {
      this.send({
        type: 'subscribe',
        topic: sub.topic,
        ...(sub.data || {})
      });
    }
  }
  
  /**
   * Explizite Wiederverbindung anfordern
   */
  public reconnect(): void {
    // Nur ausführen, wenn keine Verbindung besteht oder die Verbindung geschlossen ist
    if (!this.socket || this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) {
      this.connect();
    } else if (this.socket.readyState === WebSocket.OPEN) {
      // Wenn die Verbindung bereits offen ist, sende ein Ping, um zu prüfen, ob sie noch lebt
      this.isAlive = false;
      this.send({ type: 'ping' });
      
      // Setze einen Timer, der die Verbindung neu aufbaut, wenn keine Antwort kommt
      setTimeout(() => {
        if (!this.isAlive) {
          console.log('Ping-Timeout, stelle Verbindung neu her');
          this.reconnect();
        }
      }, 1000);
    }
  }
  
  /**
   * Verbindung schließen und aufräumen
   */
  public disconnect(): void {
    // Event-Listener entfernen
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      try {
        this.socket.close();
      } catch (err) {
        // Fehler ignorieren
      }
      this.socket = null;
    }
    
    // Alle ausstehenden Nachrichten und Abonnements löschen
    this.pendigMessages = [];
    this.subscriptions = [];
  }
  
  /**
   * Abonniere ein Thema beim Server
   */
  public subscribe(topic: string, additionalData: Record<string, any> = {}): void {
    // Abonnement speichern für Wiederverbindung
    this.subscriptions.push({ topic, data: additionalData });
    
    // Abonnement senden
    this.send({
      type: 'subscribe',
      topic,
      ...additionalData
    });
  }
  
  /**
   * Prüft, ob die Verbindung aktiv ist
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Gibt den aktuellen Verbindungsstatus zurück
   */
  public getStatus(): string {
    if (!this.socket) return 'DISCONNECTED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}