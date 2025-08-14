import {Component, HostListener, inject} from '@angular/core';
import {AppManagerService} from '../../../system-services/impl/app-manager.service';
import {WindowManagerService} from '../../../system-services/impl/windows-manager.service';
import {GroupWindowState, WindowState} from '../../../system-services/refers/window-manager.service';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WinIcon} from '../win-icon/win-icon';

@Component({
  selector: 'system-nav-bar',
  imports: [
    NzIconDirective,
    WinIcon
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  private appManager = inject(AppManagerService);
  private windowManager = inject(WindowManagerService);
  private appManagerService = inject(AppManagerService);
  apps = this.appManager.listApps();
  windows: WindowState[] = [];
  groupWindows: GroupWindowState[] = [];
  getAppWindowConfigOfWindowGroup(group: GroupWindowState) {
    for (let app of this.appManager.listApps()) {
      if(app.appId === group.appId) {
        return app;
      }
    }
    return undefined;
  }
  showAppList = false;

  constructor() {
    this.windowManager.getWindows().subscribe(ws => {
      this.windows = ws;
      this.divideIntoGroups();
        // ws.filter(w => !w.minimized);
    });
    this.appManagerService.getAppConfigObservables().subscribe(appConfigs => {
      this.apps = appConfigs;
    })

  }
  divideIntoGroups() {
    const groupsMap = new Map<string, WindowState[]>();

    // 遍历所有窗口，根据 appId 分组
    for (const window of this.windows) {
      if (!groupsMap.has(window.appId)) {
        groupsMap.set(window.appId, []);
      }
      groupsMap.get(window.appId)!.push(window);
    }

    // 将 Map 转换为数组，赋值给 groupWindows
    this.groupWindows = Array.from(groupsMap.entries()).map(([appId, windowStates]) => ({
      appId,
      windowStates
    }));
  }
  toggleAppList() {
    this.showAppList = !this.showAppList;
  }

  async openApp(appId: string, title: string) {
    await this.windowManager.openWindow(appId, title);
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

  getWindowsByApp(appId: string): WindowState[] {
    return this.windows.filter(w => w.appId === appId);
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
