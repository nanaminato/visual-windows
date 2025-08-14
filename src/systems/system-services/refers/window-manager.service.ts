import {AppIcon} from '../../models/app-info';

export interface WindowState {
  id: string;                // 唯一窗口ID
  title: string;             // 窗口标题
  appId: string;             // 所属应用ID
  position: { x: number; y: number };
  size: { width: number; height: number };
  minimized: boolean;
  maximized: boolean;
  active: boolean;
  component?: any;            // 关联的Angular组件（独立组件）
  params?: any;              // 启动参数
}
export interface GroupWindowState {
  appId: string;
  windowStates: WindowState[];
}
export interface AppWindowConfig{
  appId: string;
  appName: string;
  isSingleton: boolean;
  stateful: boolean;
  preferredSize: { width: number; height: number };
  icon: AppIcon,
  appType:number;
}
/**
 public enum AppType
 {
  SystemApp = 1,// 系统程序
  NormalApp = 2,// 集成到本项目的程序
  WebApp = 3,// 其他项目的程序，通过frame访问
 }
 * */
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
