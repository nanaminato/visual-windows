import {Component, HostListener, inject} from '@angular/core';
import {WindowManagerService} from '../../../system-services/impl/windows-manager.service';
import {GroupWindowState, WindowState} from '../../../system-services/window-manager.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NgComponentOutlet} from '@angular/common';
import {WinIcon} from '../win-icon/win-icon';
import {AppManagerService} from '../../../system-services/impl/app-manager.service';

@Component({
  selector: 'system-desktop-manager',
  imports: [
    MatSnackBarModule,
    NzIconDirective,
    NgComponentOutlet,
    WinIcon,
  ],
  templateUrl: './desktop-manager.html',
  styleUrl: './desktop-manager.css'
})
export class DesktopManager {
  private appManager = inject(AppManagerService);
  private windowManager = inject(WindowManagerService);
  windows: WindowState[] = [];
  private appManagerService = inject(AppManagerService);
  apps = this.appManager.listApps();
  // 拖拽相关状态
  private draggingWindowId: string | null = null;
  private dragOffset = { x: 0, y: 0 };

  constructor() {
    this.windowManager.getWindows().subscribe(ws => {
      this.windows = ws.filter(w => !w.minimized);
    });
    this.appManagerService.getAppConfigObservables().subscribe(appConfigs => {
      this.apps = appConfigs;
    })

  }
  getAppWindowConfigOfWindow(window: WindowState) {
    for (let app of this.appManager.listApps()) {
      if(app.appId === window.appId) {
        return app;
      }
    }
    return undefined;
  }
  focusWindow(id: string) {
    this.windowManager.focusWindow(id);
  }

  closeWindow(id: string) {
    this.windowManager.closeWindow(id);
  }
  minimizeWindow(id: string) {
    this.windowManager.minimizeWindow(id);
  }
  maximizeWindow(id: string) {
    this.windowManager.maximizeWindow(id);
  }

  startDrag(event: MouseEvent, windowId: string) {
    event.preventDefault();
    this.draggingWindowId = windowId;

    const win = this.windows.find(w => w.id === windowId);
    if (!win) return;

    this.dragOffset.x = event.clientX - win.position.x;
    this.dragOffset.y = event.clientY - win.position.y;
  }

  @HostListener('document:mouseup')
  stopDrag() {
    this.draggingWindowId = null;
  }

  @HostListener('document:mousemove', ['$event'])
  onDrag(event: MouseEvent) {
    if (!this.draggingWindowId) return;

    const win = this.windows.find(w => w.id === this.draggingWindowId);
    if (!win) return;

    const newX = event.clientX - this.dragOffset.x;
    const newY = event.clientY - this.dragOffset.y;

    // 更新窗口位置（这里直接修改对象引用并触发更新）
    win.position.x = Math.max(0, newX);
    win.position.y = Math.max(0, newY);

    // 通知服务更新状态（实际项目建议深拷贝后更新）
    this.windowManager.getWindows().subscribe(); // 触发更新
  }
}
