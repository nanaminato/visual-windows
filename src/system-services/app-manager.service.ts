export interface AppInfo {
  id: string;                // 应用唯一ID
  name: string;              // 应用名称
  icon?: string;             // 图标URL或class
  component?: any;            // 关联的Angular组件（独立组件）
  params?: any;              // 启动参数
}

export interface IAppManagerService {
  registerApp(appInfo: AppInfo): void;
  unregisterApp(appId: string): void;
  launchApp(appId: string, params?: any): Promise<string>; // 返回窗口ID
  closeApp(windowId: string): void;
  getActiveAppWindowId(): string | null;
  switchToApp(windowId: string): void;
  listRegisteredApps(): AppInfo[];
  onActiveAppChange(callback: (windowId: string | null) => void): void;
}
