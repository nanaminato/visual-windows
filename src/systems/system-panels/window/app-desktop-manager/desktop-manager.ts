import {Component, HostListener, inject} from '@angular/core';
import {WindowManagerService} from '../../../system-services/impl/windows-manager.service';
import {GroupWindowState, WindowState} from '../../../system-services/refers/window-manager.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NgComponentOutlet} from '@angular/common';
import {WinIcon} from '../win-icon/win-icon';
import {AppManagerService} from '../../../system-services/impl/app-manager.service';
import {Applive} from '../applive/applive';
import {AppEvent} from '../../../models/app-info';
import {ResumeService} from '../../../system-services/impl/resume.service';

@Component({
    selector: 'system-desktop-manager',
    imports: [
        MatSnackBarModule,
        Applive,
    ],
    templateUrl: './desktop-manager.html',
    styleUrl: './desktop-manager.css'
})
export class DesktopManager {
    private resumeService = inject(ResumeService);
    private windowManager = inject(WindowManagerService);
    windows: WindowState[] = [];
    // 拖拽相关状态
    private draggingWindowId: string | null = null;
    private dragOffset = { x: 0, y: 0 };

    constructor() {
        this.windowManager.getWindows().subscribe(ws => {
            // this.windows = ws.filter(w => !w.minimized);
            this.windows = ws;
        });
        this.resumeService.start();
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

    appLiveEvent($event: AppEvent) {
        console.log($event);
        switch ($event.type) {
            case 1:
                this.focusWindow($event.id);
                break;
            case 2:
                this.minimizeWindow($event.id);
                break;
            case 3:
                this.maximizeWindow($event.id);
                break;
            case 4:
                this.closeWindow($event.id);
                console.log("close window "+$event.id);
                break;
            case 5:
                this.startDrag($event.event as unknown as MouseEvent, $event.id);
                break;
            case 6:
                const win = this.windows.find(w => w.id === $event.id);
                if (win && $event.event) {
                    win.position = $event.event.position;
                    win.size = $event.event.size;
                    // 触发变更检测或刷新视图
                }
                break;

        }
    }
}
