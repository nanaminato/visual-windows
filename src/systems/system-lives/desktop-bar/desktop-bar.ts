import {Component, HostListener, inject} from '@angular/core';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WinIcon} from '../win-icon/win-icon';
import {GroupWindowState, ProgramConfig, WindowState} from '../../models';
import {Store} from '@ngrx/store';
import {selectProgramConfigs} from '../../system-services/state/program-config/program-config.selector';
import {WindowManagerService} from '../../system-services/windows-manager.service';
import {WindowActions} from '../../system-services/state/window/window.actions';

@Component({
    selector: 'system-desktop-bar',
    imports: [
        NzIconDirective,
        WinIcon
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

    constructor() {
        this.windowManager.getWindows().subscribe(ws => {
            this.windows = ws;
            this.divideIntoGroups();
        });
        this.programConfigs$.subscribe(ws => {
            this.programConfigs = ws;
        })
    }
    divideIntoGroups() {
        const groupsMap = new Map<string, WindowState[]>();
        // 遍历所有窗口，根据 appId 分组
        for (const window of this.windows) {
            if (!groupsMap.has(window.programId)) {
                groupsMap.set(window.programId, []);
            }
            groupsMap.get(window.programId)!.push(window);
        }
        this.groupWindows = Array.from(groupsMap.entries()).map(([appId, windowStates]) => ({
            programId: appId,
            windowStates
        }));
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
        let win = winGroup.windowStates[0];
        if(win.minimized){
            this.windowManager.focusWindow(winGroup.windowStates[0].id);
        }else{
            this.windowManager.minimizeWindow(winGroup.windowStates[0].id);
        }

    }
    openGroupAppId: string | null = null;

// 点击多窗口组，展开/收起窗口列表
    toggleGroupMenu(appId: string, event: MouseEvent) {
        event.stopPropagation(); // 阻止事件冒泡，避免触发 document 点击关闭
        if (this.openGroupAppId === appId) {
            this.openGroupAppId = null;
        } else {
            this.openGroupAppId = appId;
        }
    }

// 点击具体窗口，激活该窗口
    activateWindow(window: WindowState) {
        this.openGroupAppId = null; // 关闭弹窗
        // 这里写切换窗口的逻辑，比如调用已有的 toggleWindow 或其他方法
        this.windowManager.focusWindow(window.id)
    }

// 点击空白处关闭弹窗
    @HostListener('document:click')
    onDocumentClick() {
        this.openGroupAppId = null;
    }
}
