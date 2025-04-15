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
  private reconnectInterval: number = 2000; // Anfangsverzögerung 2 Sekunden
  private maxReconnectInterval: number = 30000; // Maximale Verzögerung 30 Sekunden
  private isAlive: boolean = false;
  private pingInterval: ReturnType<typeof setTimeout> | null = null;
  
  constructor(url: string, callbacks: WebSocketManagerCallbacks = {}) {
    this.url = url;
    this.callbacks = callbacks;
    this.connect();
  }
  
  /**
   * Verbindung herstellen und Event-Handler einrichten
   */
  private connect(): void {
    if (this.socket) {
      this.socket.close();
    }
    
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket verbunden:', this.url);
        this.isAlive = true;
        
        // Zurücksetzen des Reconnect-Intervalls bei erfolgreicher Verbindung
        this.reconnectInterval = 2000;
        
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Ping initialisieren, um Verbindung aktiv zu halten
        this.startPingInterval();
        
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
        
        this.scheduleReconnect();
      };
      
    } catch (err) {
      console.error('Fehler beim Erstellen der WebSocket-Verbindung:', err);
      this.scheduleReconnect();
    }
  }
  
  /**
   * Wiederverbindung mit exponentiellem Backoff planen
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
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
          this.socket.close();
        }
        
        return;
      }
      
      this.isAlive = false;
      this.send({ type: 'ping' });
    }, 30000); // Ping alle 30 Sekunden
  }
  
  /**
   * Nachricht über WebSocket senden
   */
  public send(data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
        return true;
      } catch (err) {
        console.error('Fehler beim Senden einer WebSocket-Nachricht:', err);
      }
    }
    return false;
  }
  
  /**
   * Explizite Wiederverbindung anfordern
   */
  public reconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
    
    this.connect();
  }
  
  /**
   * Verbindung schließen und aufräumen
   */
  public disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
  
  /**
   * Abonniere ein Thema beim Server
   */
  public subscribe(topic: string, additionalData: Record<string, any> = {}): void {
    this.send({
      type: 'subscribe',
      topic,
      ...additionalData
    });
  }
}