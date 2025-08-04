import {AppWindowConfig, WindowState} from '../window-manager.service';
import {BehaviorSubject, map, Observable} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  // 打开的程序
  private windows$ = new BehaviorSubject<WindowState[]>([]);
  // 注册的程序，用于支持打开程序和激活程序等
  private registeredApps = new BehaviorSubject<AppWindowConfig[]>([]);
  getWindows() {
    return this.windows$.asObservable();
  }
  getWindowByAppId(appId: string): WindowState[] {
    return this.windows$.getValue().filter(window => window.appId === appId);
  }
  getWindowByAppIdObservable(appId: string): Observable<WindowState[]> {
    return this.windows$.pipe(
      map(windows => windows.filter(window => window.appId === appId))
    );
  }
  getRegisteredAppByAppId(appId: string): AppWindowConfig[] {
    return this.registeredApps.getValue().filter(app=>app.appId===appId);
  }
  // 打开一个程序，如果程序是单例的，如果有打开的窗口，就不再打开新的窗口
  openWindow(appId: string, title: string): string {
    let openedWindows = this.getWindowByAppId(appId);
    let registeredApp = this.getRegisteredAppByAppId(appId);
    if(openedWindows) {
      if(registeredApp.length>0&&registeredApp[0].isSingleton){
        let lastWindow;
        for(let window of openedWindows) {
          window.active = true;
          lastWindow = window;
        }
        return lastWindow!.id;
      }
    }
    const id = Math.random().toString(36).substring(2, 11);

    const newWindow: WindowState = {
      id,
      appId,
      title,
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 },
      minimized: false,
      maximized: false,
      active: true,
    };
    const current = this.windows$.value.map(w => ({ ...w, active: false }));
    this.windows$.next([...current, newWindow]);
    return id;
  }
  // 关闭窗口
  closeWindow(id: string) {
    const filtered = this.windows$.value.filter(w => w.id !== id);
    this.windows$.next(filtered);
  }
  // 聚焦窗口
  focusWindow(id: string) {
    const updated = this.windows$.value.map(w => ({
      ...w,
      active: w.id === id,
      minimized: w.id === id ? false : w.minimized,
    }));
    this.windows$.next(updated);
  }
  // 使窗口最小化
  minimizeWindow(id: string) {
    const updated = this.windows$.value.map(w =>
      w.id === id ? { ...w, minimized: true, active: false } : w
    );
    this.windows$.next(updated);
  }
}
