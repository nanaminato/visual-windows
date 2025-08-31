import {Component, HostListener, inject} from '@angular/core';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {WindowsLive} from '../window-live/windows-live';
import {ProgramEvent} from '../../models';
import {WindowState} from '../../models';
import {Subscription, take} from 'rxjs';
import {Actions, ofType} from '@ngrx/effects';
import {systemActions} from '../../system-services/state/system/system.action';
import {ResumeService} from '../../system-services/resume.service';
import {WindowManagerService} from '../../system-services/windows-manager.service';
import {WindowActions} from '../../system-services/state/window/window.actions';
import {Store} from '@ngrx/store';

@Component({
    selector: 'system-desktop-manager',
    imports: [
        MatSnackBarModule,
        WindowsLive,
    ],
    templateUrl: './desktop-manager.html',
    styleUrl: './desktop-manager.css'
})
export class DesktopManager {
    private resumeService = inject(ResumeService);
    private windowManager = inject(WindowManagerService);
    windows: WindowState[] = [];
    draggingWindowId: string | null = null;
    // 拖拽相关状态
    draggingTouchWindowId: string | null = null;
    private dragOffset = { x: 0, y: 0 };
    private readonly subscription: Subscription;
    private actions$ = inject(Actions);
    private store$ = inject(Store);
    constructor() {
        this.windowManager.getWindows().subscribe(ws => {
            this.windows = ws;
        });
        this.subscription = this.actions$.pipe(
            ofType(systemActions.configLoadSuccess),
            take(1)
        ).subscribe(() => {
            this.resumeService.start().then(() => {
                // this.store$.dispatch(
                //     WindowActions.openWindow(
                //         { id: "code-space", title: "code space", params: {startPath: 'D:\\WebstormProjects\\Remote-File-Manager'} }
                //     )
                // );
            });
        });

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
    // 新增触摸拖动开始处理函数
    startDragTouch(event: TouchEvent, windowId: string) {
        event.preventDefault();
        this.draggingTouchWindowId = windowId;

        const win = this.windows.find(w => w.id === windowId);
        if (!win) return;

        // 这里只取第一个触点坐标
        const touch = event.touches[0];
        this.dragOffset.x = touch.clientX - win.position.x;
        this.dragOffset.y = touch.clientY - win.position.y;
    }

    @HostListener('document:mouseup')
    stopDrag() {
        this.draggingWindowId = null;
    }
    @HostListener('document:touchend')
    stopDragTouch() {
        this.draggingTouchWindowId = null;
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
    // 新增触摸拖动监听
    @HostListener('document:touchmove', ['$event'])
    onDragTouch(event: TouchEvent) {
        if (!this.draggingTouchWindowId) return;

        // event.preventDefault();

        const win = this.windows.find(w => w.id === this.draggingTouchWindowId);
        if (!win) return;

        const touch = event.touches[0];
        const newX = touch.clientX - this.dragOffset.x;
        const newY = touch.clientY - this.dragOffset.y;

        win.position.x = Math.max(0, newX);
        win.position.y = Math.max(0, newY);

        this.windowManager.getWindows().subscribe();
    }
    appLiveEvent($event: ProgramEvent) {
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
            case 7:
                this.startDragTouch($event.event as TouchEvent, $event.id);
                break;

        }
    }
    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }



}
