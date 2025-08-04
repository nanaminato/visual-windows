export interface WindowState {
  id: string;                // 唯一窗口ID
  title: string;             // 窗口标题
  appId: string;             // 所属应用ID
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  maximized: boolean;
  active: boolean;
}

export interface IWindowManagerService {
  openWindow(appId: string, options?: Partial<WindowState>): Promise<string>; // 返回窗口ID
  closeWindow(windowId: string): void;
  minimizeWindow(windowId: string): void;
  maximizeWindow(windowId: string): void;
  restoreWindow(windowId: string): void;
  focusWindow(windowId: string): void;
  getWindowState(windowId: string): WindowState | undefined;
  getAllWindows(): WindowState[];
  onWindowStateChange(callback: (windows: WindowState[]) => void): void; // 订阅窗口状态变化
}
