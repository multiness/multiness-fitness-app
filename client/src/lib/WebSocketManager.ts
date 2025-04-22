// Optimierter WebSocket Manager für stabile Verbindungen
export class WebSocketManager {
  private socket: WebSocket | null = null;
  private url: string;
  private reconnectInterval = 2000;
  private maxReconnectInterval = 30000; // 30 Sekunden maximales Intervall
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastMessageTime = 0;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isPermanentlyClosed = false;
  
  private callbacks: {
    onOpen?: () => void;
    onMessage?: (data: any) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
    onReconnect?: (attempt: number) => void;
    onMaxAttemptsExceeded?: () => void;
  } = {};

  constructor(url: string) {
    this.url = url;
  }

  connect(callbacks: {
    onOpen?: () => void;
    onMessage?: (data: any) => void;
    onError?: (error: Event) => void;
    onClose?: () => void;
    onReconnect?: (attempt: number) => void;
    onMaxAttemptsExceeded?: () => void;
  }) {
    // Zurücksetzen des permanent geschlossenen Status, wenn eine neue Verbindung angefordert wird
    this.isPermanentlyClosed = false;
    this.reconnectAttempts = 0;
    this.callbacks = callbacks;
    this.createConnection();
  }

  private createConnection() {
    if (this.isPermanentlyClosed) {
      console.log('WebSocket ist permanent geschlossen, keine neue Verbindung wird hergestellt');
      return;
    }

    // Bereits bestehende Verbindung schließen
    this.cleanupExistingConnection();

    // Verbindungstimeout - falls die Verbindung nicht innerhalb von 10 Sekunden hergestellt wird
    this.connectionTimeout = setTimeout(() => {
      console.warn('WebSocket-Verbindungstimeout erreicht, Verbindungsversuch abgebrochen');
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
      this.scheduleReconnect();
    }, 10000);

    try {
      // Neue Verbindung herstellen
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        // Timeout löschen, wenn die Verbindung erfolgreich hergestellt wurde
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        console.log('WebSocket verbunden:', this.url);
        
        // Zurücksetzen der Reconnect-Parameter
        this.reconnectAttempts = 0;
        this.reconnectInterval = 2000;
        this.lastMessageTime = Date.now();
        
        // Heartbeat starten
        this.startHeartbeat();
        
        if (this.callbacks.onOpen) {
          try {
            this.callbacks.onOpen();
          } catch (error) {
            console.error('Fehler im onOpen-Callback:', error);
          }
        }
      };

      this.socket.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (this.callbacks.onMessage) {
            this.callbacks.onMessage(data);
          }
        } catch (e) {
          console.error('Fehler beim Parsen/Verarbeiten der WebSocket-Nachricht:', e);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket-Fehler:', error);
        
        if (this.callbacks.onError) {
          try {
            this.callbacks.onError(error);
          } catch (callbackError) {
            console.error('Fehler im onError-Callback:', callbackError);
          }
        }
      };

      this.socket.onclose = (event) => {
        // Cleanup connection timeout if it's still running
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        console.log(`WebSocket-Verbindung geschlossen (Code: ${event.code}), bereite Wiederverbindung vor...`);
        
        // Cleanup heartbeat
        this.stopHeartbeat();
        
        if (this.callbacks.onClose) {
          try {
            this.callbacks.onClose();
          } catch (error) {
            console.error('Fehler im onClose-Callback:', error);
          }
        }

        // Nur neu verbinden, wenn es nicht permanent geschlossen wurde
        if (!this.isPermanentlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Fehler beim Erstellen der WebSocket-Verbindung:', error);
      
      // Cleanup connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Schedule reconnect
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    // Wenn bereits ein Reconnect geplant ist, nichts tun
    if (this.reconnectTimer) return;
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.warn(`Maximale Anzahl an Wiederverbindungsversuchen (${this.maxReconnectAttempts}) überschritten. Keine weiteren Versuche.`);
      
      if (this.callbacks.onMaxAttemptsExceeded) {
        try {
          this.callbacks.onMaxAttemptsExceeded();
        } catch (error) {
          console.error('Fehler im onMaxAttemptsExceeded-Callback:', error);
        }
      }
      
      // Permanent schließen, bis explizit neue Verbindung angefordert wird
      this.isPermanentlyClosed = true;
      return;
    }
    
    // Exponentielles Backoff mit Jitter (Zufallskomponente, um Verbindungsstürme zu vermeiden)
    const jitter = Math.random() * 1000;
    const delay = Math.min(this.maxReconnectInterval, this.reconnectInterval * (1 + (0.5 * Math.random()))) + jitter;
    
    console.log(`Versuche WebSocket-Wiederverbindung nach ${Math.round(delay / 1000)} Sekunden... (Versuch ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    if (this.callbacks.onReconnect) {
      try {
        this.callbacks.onReconnect(this.reconnectAttempts);
      } catch (error) {
        console.error('Fehler im onReconnect-Callback:', error);
      }
    }
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.createConnection();
    }, delay);
    
    // Erhöhe das Reconnect-Intervall für das nächste Mal
    this.reconnectInterval = Math.min(this.maxReconnectInterval, this.reconnectInterval * 1.5);
  }

  private startHeartbeat() {
    // Stoppe einen bestehenden Heartbeat
    this.stopHeartbeat();
    
    // Starte einen neuen Heartbeat
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      // Wenn in den letzten 30 Sekunden keine Nachricht empfangen wurde, sende einen Ping
      if (now - this.lastMessageTime > 30000) {
        this.sendPing();
      }
      
      // Wenn in den letzten 90 Sekunden keine Nachricht empfangen wurde,
      // ist die Verbindung wahrscheinlich tot, also neu verbinden
      if (now - this.lastMessageTime > 90000) {
        console.warn('Keine WebSocket-Aktivität in den letzten 90 Sekunden, Verbindung wird neu hergestellt');
        this.reconnect();
      }
    }, 15000); // Überprüfe alle 15 Sekunden
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendPing() {
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('Sende WebSocket Ping...');
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    } catch (error) {
      console.error('Fehler beim Senden des Pings:', error);
    }
  }

  private cleanupExistingConnection() {
    // Stoppe den Heartbeat
    this.stopHeartbeat();
    
    // Lösche den Reconnect-Timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Schließe die bestehende Verbindung
    if (this.socket) {
      try {
        // Entferne alle Event-Listener, um Memory Leaks zu vermeiden
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        
        // Schließe die Verbindung
        this.socket.close();
      } catch (error) {
        console.error('Fehler beim Schließen der bestehenden WebSocket-Verbindung:', error);
      }
      this.socket = null;
    }
  }

  send(data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Fehler beim Senden der WebSocket-Nachricht:', error);
        return false;
      }
    } else {
      console.warn('WebSocket nicht verbunden, Nachricht konnte nicht gesendet werden');
      return false;
    }
  }

  reconnect() {
    console.log('WebSocket-Wiederverbindung wird erzwungen...');
    this.cleanupExistingConnection();
    this.createConnection();
  }

  close() {
    console.log('WebSocket wird permanent geschlossen');
    this.isPermanentlyClosed = true;
    this.cleanupExistingConnection();
  }

  getState(): string {
    if (!this.socket) return 'DISCONNECTED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }

  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}