import {AppWindowConfig, WindowState} from '../refers/window-manager.service';
import {BehaviorSubject} from 'rxjs';
import {Injectable} from '@angular/core';
import {AppManagerService} from './app-manager.service';
import {v4 as uuidv4} from 'uuid';
import {componentMap} from '../../apps';

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
    // 打开的程序
    private windows$ = new BehaviorSubject<WindowState[]>([]);
    // 注册的程序，用于支持打开程序和激活程序等
    appWindowConfigs: AppWindowConfig[] = [];

    constructor(private appManagerService: AppManagerService) {
        this.appWindowConfigs = this.appManagerService.getAppWindowConfigs();
        this.appManagerService.getAppConfigObservables().subscribe(ws => {
            this.appWindowConfigs = ws;
        })
        window.addEventListener('resize', this.onWindowResize);
    }
    getWindows() {
        return this.windows$.asObservable();
    }
    getWindowByAppId(appId: string): WindowState[] {
        return this.windows$.getValue().filter(window => window.appId === appId);
    }
    getRegisteredAppByAppId(appId: string): AppWindowConfig[] {
        return this.appWindowConfigs.filter(app=>app.appId===appId);
    }
    // 打开一个程序，如果程序是单例的，如果有打开的窗口，就不再打开新的窗口
    async openWindow(appId: string, title: string,params?: any) {
        let openedWindows = this.getWindowByAppId(appId);
        let registeredApps = this.getRegisteredAppByAppId(appId);
        if(openedWindows) {
            if(openedWindows.length>0&&registeredApps[0].isSingleton){
                this.focusWindow(openedWindows[0].id)
                return openedWindows[0]!.id;
            }
        }
        const id = uuidv4();
        let registeredApp = registeredApps[0];
        const newWindow: WindowState = {
            id,
            appId,
            title,
            position: { x: 100, y: 100 },
            size: {
                width: registeredApp.preferredSize.width?registeredApp.preferredSize.width:800,
                height: registeredApp.preferredSize.height?registeredApp.preferredSize.height:600
            },
            minimized: false,
            maximized: false,
            active: true,
            params: params
        };
        const componentLoader= componentMap.get(appId);
        if(componentLoader) {
            newWindow.component = await componentLoader();
        }
        const current = this.windows$.value.map(w => ({ ...w, active: false }));
        this.windows$.next([...current, newWindow]);
        return id;
    }
    // 关闭窗口
    closeWindow(id: string) {
        const filtered = this.windows$.value.filter(w => w.id !== id);
        console.log(filtered);
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
    getTaskbarHeight(): number {
        const taskbar = document.querySelector('.bottom-navbar');
        if (taskbar) {
            return taskbar.clientHeight;
        }
        return 40; // 默认值
    }
    maximizeWindow(id: string) {
        const body = document.body;
        const taskbarHeight = this.getTaskbarHeight();
        const desktopWidth = body.offsetWidth;
        const desktopHeight = body.offsetHeight - taskbarHeight;
        console.log(taskbarHeight)

        const updated = this.windows$.value.map(w => {
            if (w.id === id) {
                if (!w.maximized) {
                    // 还没最大化，保存当前状态，最大化
                    return {
                        ...w,
                        prevPosition: { ...w.position },
                        prevSize: { ...w.size },
                        position: { x: 0, y: 0 },
                        size: { width: desktopWidth, height: desktopHeight },
                        minimized: false,
                        active: true,
                        maximized: true
                    };
                } else {
                    // 已经最大化，恢复之前状态
                    return {
                        ...w,
                        position: w.prevPosition || w.position,
                        size: w.prevSize || w.size,
                        minimized: false,
                        active: true,
                        maximized: false,
                        prevPosition: undefined,
                        prevSize: undefined
                    };
                }
            }
            return w;
        });
        this.windows$.next(updated);
    }
    private onWindowResize = () => {
        const body = document.body;
        const taskbarHeight = this.getTaskbarHeight();
        const desktopWidth = body.offsetWidth;
        const desktopHeight = body.offsetHeight - taskbarHeight;

        let updated = false;
        const newWindows = this.windows$.value.map(w => {
            if (w.maximized) {
                updated = true;
                return {
                    ...w,
                    position: { x: 0, y: 0 },
                    size: { width: desktopWidth, height: desktopHeight }
                };
            }
            return w;
        });

        if (updated) {
            this.windows$.next(newWindows);
        }
    }
    ngOnDestroy() {
        window.removeEventListener('resize', this.onWindowResize);
    }
}
