import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// 1. Leemos la URL desde las variables de entorno de Vite.
const wsUrl = import.meta.env.VITE_WEBSOCKET_URL as string;
// Es una buena práctica verificar que la variable exista.
if (!wsUrl) {
  throw new Error("La URL del WebSocket (VITE_WEBSOCKET_URL) no está definida en el archivo .env");
}

class WebSocketService {
  private stompClient: Client;
  private isConnected = false;

  constructor() {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      debug: (str) => console.log(new Date(), str),
      reconnectDelay: 5000,
    });
  }

  /**
   * Activa la conexión. Devuelve una promesa que se resuelve al conectar
   * o se rechaza si hay un error.
   */
  public connect(): Promise<void> {
    // CORRECCIÓN 3: Aseguramos que siempre se retorna una Promise.
    return new Promise((resolve, reject) => {
      this.stompClient.onConnect = (frame) => {
        this.isConnected = true;
        console.log('WebSocket Conectado:', frame);
        resolve(); // La promesa se cumple aquí.
      };

      this.stompClient.onStompError = (frame) => {
        console.error('Error de Broker:', frame.headers['message']);
        console.error('Detalles:', frame.body);
        // Rechazamos la promesa para que el componente pueda manejar el error.
        reject(new Error(`Error de STOMP: ${frame.headers['message']}`));
      };

      this.stompClient.activate();
    });
  }

  /**
   * Se suscribe a un tópico para recibir mensajes.
   */
  public subscribe<T>(topic: string, callback: (payload: T) => void) {
    if (!this.isConnected) {
      console.error("No se puede suscribir, el cliente WebSocket no está conectado.");
      return;
    }

    // CORRECCIÓN 1 Y 2: Usamos los parámetros 'topic' y 'callback' aquí.
    this.stompClient.subscribe(topic, (message) => {
      const payload: T = JSON.parse(message.body);
      callback(payload);
    });
  }

  /**
   * Desactiva la conexión WebSocket.
   */
  public disconnect() {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.isConnected = false;
      console.log("WebSocket Desconectado.");
    }
  }
}

// Exportamos una única instancia del servicio (patrón Singleton)
export const webSocketService = new WebSocketService();
