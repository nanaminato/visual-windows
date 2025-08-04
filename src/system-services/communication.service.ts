export interface ICommunicationService {
  httpGet<T>(url: string, options?: any): Promise<T>;
  httpPost<T>(url: string, body: any, options?: any): Promise<T>;
  connectWebSocket(url: string): WebSocket;
  sendWebSocketMessage(socket: WebSocket, message: any): void;
  onWebSocketMessage(socket: WebSocket, callback: (message: any) => void): void;
  closeWebSocket(socket: WebSocket): void;
}
