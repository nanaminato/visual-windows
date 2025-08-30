import {Component, HostListener, inject} from '@angular/core';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WinIcon} from '../win-icon/win-icon';
import {GroupWindowState, ProgramConfig, WindowState} from '../../models';
import {Store} from '@ngrx/store';
import {WindowManagerService} from '../../system-services/windows-manager.service';
import {WindowActions} from '../../system-services/state/window/window.actions';
import {selectProgramConfigs} from '../../system-services/state/program-config/system.selector';

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
        const newGroupsMap = new Map<string, WindowState[]>();
        for (const window of this.windows) {
            if (!newGroupsMap.has(window.programId)) {
                newGroupsMap.set(window.programId, []);
            }
            newGroupsMap.get(window.programId)!.push(window);
        }

        // 2. 更新已有分组，过滤掉没有窗口的分组
        const updatedGroups: GroupWindowState[] = [];
        for (const group of this.groupWindows) {
            const newWindowStates = newGroupsMap.get(group.programId) || [];
            if (newWindowStates.length > 0) {
                updatedGroups.push({
                    programId: group.programId,
                    windowStates: newWindowStates
                });
                // 从 newGroupsMap 中删除，表示已处理
                newGroupsMap.delete(group.programId);
            }
            // 如果没有对应窗口，分组就不加入，等于删除
        }

        // 3. 剩余的新分组追加到后面
        for (const [programId, windowStates] of newGroupsMap.entries()) {
            updatedGroups.push({
                programId,
                windowStates
            });
        }

        // 4. 赋值回 groupWindows
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
