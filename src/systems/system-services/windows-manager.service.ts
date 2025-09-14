import {firstValueFrom, Observable, take} from 'rxjs';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import {WindowState} from '../models';
import {selectWindowById, selectWindows} from './state/window/window.selectors';
import {WindowActions} from './state/window/window.actions';
import {FileEntry} from '../programs/code-space/models';
import {FileAssociationService} from '../programs/file-explorer/services/file-association.service';
import {getFileExtension} from '../programs/code-space/models/open-file';
import {NzMessageService} from 'ng-zorro-antd/message';

@Injectable({ providedIn: 'root' })
export class WindowManagerService implements OnDestroy {
    private store = inject(Store);

    windows$ = this.store.select(selectWindows);
    fileAssociationService = inject(FileAssociationService);
    private messageService = inject(NzMessageService);
    constructor() {
        window.addEventListener('resize', this.onWindowResize);
    }
    openWindow(appId: string, title: string, params?: any,x?:number,y?:number, parentId?: string, modal?: boolean, closeWithParent?: boolean) {
        this.store.dispatch(WindowActions.openWindow({ id: appId, title, params,x,y, parentId,modal, closeWithParent }));
    }
    openFile(openFile: FileEntry, params: any) {
        let ext = getFileExtension(openFile);
        let associate = this.fileAssociationService.getAssociationByExtension(ext);
        if(associate) {
            this.openWindow(associate.programId,associate.programName,params)
        }else{
            this.messageService.error('cannot find a program to open this file')
        }
    }

    getWindows(): Observable<WindowState[]> {
        return this.windows$;
    }

    closeWindow(id: string) {
        this.store.dispatch(WindowActions.closeWindow({ id }));
    }

    focusWindow(id: string) {
        // console.log('focus id '+id)
        this.store.dispatch(WindowActions.focusWindow({ id }));
    }

    minimizeWindow(id: string) {
        // console.log('minimize id '+id)
        this.store.dispatch(WindowActions.minimizeWindow({ id }));
    }
    toggleWindow(id: string) {
        this.store.select(selectWindowById(id)).pipe(
            take(1)  // 只取当前值一次，避免持续订阅
        ).subscribe(window => {
            if (!window) return; // 如果没找到窗口，直接返回

            if (window.minimized) {
                this.focusWindow(id);
            } else {
                this.minimizeWindow(id);
            }
        });
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
