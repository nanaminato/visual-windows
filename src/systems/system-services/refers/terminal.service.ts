export interface TerminalSession {
  id: string;
  title: string;
  createdAt: Date;
}

export interface ITerminalService {
  createSession(options?: { cwd?: string; env?: Record<string, string> }): Promise<TerminalSession>;
  closeSession(sessionId: string): Promise<void>;
  sendInput(sessionId: string, data: string): void;
  onOutput(sessionId: string, callback: (data: string) => void): void;
  resizeSession(sessionId: string, cols: number, rows: number): void;
  listSessions(): TerminalSession[];
}
