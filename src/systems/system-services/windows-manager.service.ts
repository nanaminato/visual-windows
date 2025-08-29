import { firstValueFrom, map, Observable } from 'rxjs';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { Store } from '@ngrx/store';
import {ProgramConfig, WindowState} from '../models';
import {selectProgramConfigs} from './state/program-config/program-config.selector';
import {selectWindows} from './state/window/window.selectors';
import {componentMap, programWithCustomHeaders} from '../programs/models';
import {WindowActions} from './state/window/window.actions';

@Injectable({ providedIn: 'root' })
export class WindowManagerService implements OnDestroy {
    private store = inject(Store);

    programConfigs$ = this.store.select(selectProgramConfigs);
    windows$ = this.store.select(selectWindows);

    constructor() {
        window.addEventListener('resize', this.onWindowResize);
    }

    getWindows(): Observable<WindowState[]> {
        return this.windows$;
    }

    getRegisteredProgramByProgramId(programId: string): Observable<ProgramConfig[]> {
        return this.programConfigs$.pipe(
            map(programConfigs => {
                if (!programConfigs) {
                    return [];
                }
                return programConfigs.filter(app => app.programId === programId);
            })
        );
    }

    async openWindow(appId: string, title: string, params?: any): Promise<string> {
        try {
            const openedWindows = await firstValueFrom(this.windows$.pipe(
                map(windows => windows.filter((window: WindowState) => window.programId === appId))
            ));
            const registeredApps = await firstValueFrom(this.getRegisteredProgramByProgramId(appId));
            if (openedWindows.length > 0 && registeredApps[0]?.isSingleton) {
                this.focusWindow(openedWindows[0].id);
                return openedWindows[0].id;
            }

            const id = uuid();
            const registeredApp = registeredApps[0];
            const newWindow: WindowState = {
                id,
                programId: appId,
                title,
                position: { x: 100, y: 100 },
                size: {
                    width: registeredApp?.preferredSize?.width ?? 800,
                    height: registeredApp?.preferredSize?.height ?? 600
                },
                minimized: false,
                maximized: false,
                active: true,
                params,
                customHeader: programWithCustomHeaders.includes(appId),
            };

            const componentLoader = componentMap.get(appId);
            if (componentLoader) {
                newWindow.component = await componentLoader();
            }
            console.log(WindowActions.openWindow({ window: newWindow }))
            this.store.dispatch(WindowActions.openWindow({ window: newWindow }));
            return id;
        } catch (error) {
            console.error('openWindow error:', error);
            throw error;
        }
    }


    closeWindow(id: string) {
        this.store.dispatch(WindowActions.closeWindow({ id }));
    }

    focusWindow(id: string) {
        this.store.dispatch(WindowActions.focusWindow({ id }));
    }

    minimizeWindow(id: string) {
        this.store.dispatch(WindowActions.minimizeWindow({ id }));
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
        const desktopHeight = body.offsetHeight;

        this.store.dispatch(WindowActions.maximizeWindow({
            id,
            desktopWidth,
            desktopHeight,
            taskbarHeight
        }));
    }

    private onWindowResize = async () => {
        const body = document.body;
        const taskbarHeight = this.getTaskbarHeight();
        const desktopWidth = body.offsetWidth;
        const desktopHeight = body.offsetHeight - taskbarHeight;

        const windows = await firstValueFrom(this.windows$);

        let updated = false;
        const newWindows = windows.map((w: WindowState) => {
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
            this.store.dispatch(WindowActions.updateWindows({ windows: newWindows }));
        }
    }


    ngOnDestroy() {
        window.removeEventListener('resize', this.onWindowResize);
    }
}
