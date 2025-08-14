import {AppInfo} from '../../models';

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
