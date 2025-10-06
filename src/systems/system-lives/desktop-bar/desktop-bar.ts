import {Component, HostListener, inject} from '@angular/core';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WinIcon} from '../win-icon/win-icon';
import {GroupWindowState, ProgramConfig, WindowState} from '../../models';
import {Store} from '@ngrx/store';
import {WindowManagerService} from '../../system-services/windows-manager.service';
import {WindowActions} from '../../system-services/state/window/window.actions';
import {selectProgramConfigs} from '../../system-services/state/system/system.selector';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {logoutAction} from '../../system-services/state/system/system.action';
import {WindowScreenshot} from './window-screenshot/window-screenshot';
import {Actions, ofType} from '@ngrx/effects';
import {selectWindows} from '../../system-services/state/window/window.selectors';
import {take} from 'rxjs';
import {LinkService} from '../../system-services/link.service';

@Component({
    selector: 'system-desktop-bar',
    imports: [
        NzIconDirective,
        WinIcon,
        NzButtonComponent,
        WindowScreenshot
    ],
    templateUrl: './desktop-bar.html',
    styleUrl: './desktop-bar.css'
})
export class DesktopBar {
    private windowManager = inject(WindowManagerService);
    windows: WindowState[] = [];
    groupWindows: GroupWindowState[] = [];
    private store = inject(Store);
    programConfigs$ = this.store.select(selectProgramConfigs);
    programConfigs : ProgramConfig[] | undefined;
    getWindowConfigOfProgramId(programId: string) {
        if(!this.programConfigs){
            return undefined;
        }
        let configs = this.programConfigs.filter(p => p.programId === programId);
        if(configs.length>=1){
            return configs[0];
        }
        return undefined;
    }
    showAppList = false;
    private actions$ = inject(Actions);
    constructor() {
        this.actions$.pipe(
            ofType(WindowActions.openWindowSuccess, WindowActions.closeWindowSuccess, WindowActions.windowLoaded),
        ).subscribe(action => {
            if (action.type === '[Window] open window success') {
                // 新增窗口
                this.windows = [...this.windows, action.window];
            } else if (action.type === '[Window] close window success') {
                // 替换整个窗口数组
                this.windows = action.windows;
            }else if(action.type === '[Window] window loaded' && this.windows.length<=0) {
                this.store.select(selectWindows).pipe(take(1)).subscribe(windows => {
                    this.windows = windows || [];
                    this.divideIntoGroups();
                });
                return;
            }
            this.divideIntoGroups();

        });
        this.programConfigs$.subscribe(ws => {
            this.programConfigs = ws;
        })
    }
    divideIntoGroups() {
        const newGroupsMap = new Map<string, WindowState[]>();

        for (const window of this.windows.filter(w => w.modal !== true)) {
            if (!newGroupsMap.has(window.programId)) {
                newGroupsMap.set(window.programId, []);
            }
            newGroupsMap.get(window.programId)!.push(window);
        }

        const updatedGroups: GroupWindowState[] = [];

        for (const group of this.groupWindows) {
            const newWindowStates = newGroupsMap.get(group.programId) || [];

            if (newWindowStates.length > 0) {
                const oldOrderIds = group.windowStates.map(w => w.id);

                const sortedWindowStates = [...newWindowStates].sort((a, b) => {
                    const indexA = oldOrderIds.indexOf(a.id);
                    const indexB = oldOrderIds.indexOf(b.id);

                    if (indexA === -1 && indexB === -1) {
                        return 0;
                    }
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                });

                updatedGroups.push({
                    programId: group.programId,
                    windowStates: sortedWindowStates,
                });
                newGroupsMap.delete(group.programId);
            }
        }

        // 追加新增的分组
        for (const [programId, windowStates] of newGroupsMap.entries()) {
            updatedGroups.push({ programId, windowStates });
        }

        this.groupWindows = updatedGroups;
    }
    toggleProgramList() {
        this.showAppList = !this.showAppList;
    }
    private store$ = inject(Store);
    async openProgram(programId: string, title: string) {
        this.store$.dispatch(
            WindowActions.openWindow(
                { id: programId, title: title }
            ))
        this.showAppList = false;
    }

    toggleWindow(winGroup: GroupWindowState) {
        if(winGroup.windowStates.length === 1) {
            let win = winGroup.windowStates[0];
            this.windowManager.toggleWindow(win.id);
        }

    }
    openGroupAppId: string | null = null;

// 点击具体窗口，激活该窗口
    activateWindow(window: WindowState) {
        this.openGroupAppId = null; // 关闭弹窗
        // 这里写切换窗口的逻辑，比如调用已有的 toggleWindow 或其他方法
        this.windowManager.focusWindow(window.id)
        this.onGroupMouseLeave()
    }

// 点击空白处关闭弹窗
    @HostListener('document:click')
    onDocumentClick() {
        this.openGroupAppId = null;
    }

    minimizeAllWindow() {
        for(let window of this.windows){
            this.windowManager.minimizeWindow(window.id);
        }
    }

    Logout() {
        this.store.dispatch(logoutAction())
    }
    hoveredGroupAppId: string | null = null;

    onGroupMouseEnter(appId: string) {
        this.hoveredGroupAppId = appId;
    }

    onGroupMouseLeave() {
        this.hoveredGroupAppId = null;
    }
    linkService = inject(LinkService);
    hoverIn(window: WindowState) {
        let component = this.linkService.get(window.id);
        if (typeof component.hoverIn === 'function') {
            // console.log('hoverIn',window.id);
            component.hoverIn();
        }
    }

    hoverOut(window: WindowState) {
        let component = this.linkService.get(window.id);
        if (typeof component.hoverOut === 'function') {
            // console.log('hoverOut',window.id);
            component.hoverOut()
        }
    }
}
