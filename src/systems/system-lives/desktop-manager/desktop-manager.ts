import {Component, HostListener, inject} from '@angular/core';
import {WindowsLive} from '../window-live/windows-live';
import {ProgramEvent} from '../../models';
import {WindowState} from '../../models';
import {WindowManagerService} from '../../system-services/windows-manager.service';
import {Store} from '@ngrx/store';
import {selectOrders} from '../../system-services/state/window/window.selectors';
import {AsyncPipe} from '@angular/common';
import {Actions} from '@ngrx/effects';
@Component({
    selector: 'system-desktop-manager',
    imports: [
        WindowsLive,
        AsyncPipe,
    ],
    templateUrl: './desktop-manager.html',
    styleUrl: './desktop-manager.css'
})
export class DesktopManager {
    private windowManager = inject(WindowManagerService);
    windows: WindowState[] = [];
    draggingWindowId: string | null = null;
    // 拖拽相关状态
    draggingTouchWindowId: string | null = null;
    resizeWinId: string | null = null;
    private dragOffset = { x: 0, y: 0 };
    private actions$ = inject(Actions);
    constructor() {
        this.windowManager.getWindows().subscribe(ws => {
            this.windows = ws;
        });
        // this.actions$.subscribe(action => {
        //     console.log('Action dispatched:',action.type, action);
        // });
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

        this.dragOffset.x = event.clientX - win.position.left;
        this.dragOffset.y = event.clientY - win.position.top;
    }
    // 新增触摸拖动开始处理函数
    startDragTouch(event: TouchEvent, windowId: string) {
        event.preventDefault();
        this.draggingTouchWindowId = windowId;

        const win = this.windows.find(w => w.id === windowId);
        if (!win) return;

        // 这里只取第一个触点坐标
        const touch = event.touches[0];
        this.dragOffset.x = touch.clientX - win.position.left;
        this.dragOffset.y = touch.clientY - win.position.top;
    }

    @HostListener('document:mouseup')
    stopDrag() {
        if(this.draggingWindowId){
            this.focusWindow(this.draggingWindowId);
        }
        this.draggingWindowId = null;
    }
    @HostListener('document:touchend')
    stopDragTouch() {
        if(this.draggingTouchWindowId){
            this.focusWindow(this.draggingTouchWindowId);
        }
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
        win.position.left = Math.max(0, newX);
        win.position.top = Math.max(0, newY);

    }
    // 新增触摸拖动监听
    @HostListener('document:touchmove', ['$event'])
    onDragTouch(event: TouchEvent) {
        if (!this.draggingTouchWindowId) return;
        const win = this.windows.find(w => w.id === this.draggingTouchWindowId);
        if (!win) return;

        const touch = event.touches[0];
        const newX = touch.clientX - this.dragOffset.x;
        const newY = touch.clientY - this.dragOffset.y;

        win.position.left = Math.max(0, newX);
        win.position.top = Math.max(0, newY);
    }
    hoverId: string | null = null;
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
                //resize move
                const win = this.windows.find(w => w.id === $event.id);
                if (win && $event.event) {
                    win.position = $event.event.position;
                    win.size = $event.event.size;
                }
                this.resizeWinId = $event.id;
                break;
            case 7:
                this.startDragTouch($event.event as TouchEvent, $event.id);
                break;
            case 8:
                this.focusWindow($event.id);
                this.resizeWinId = null;
                break;
            case 9:
                this.hoverId = $event.id;
                console.log("tackle hover id "+$event.id);
                break;
            case 10:
                this.hoverId = null;
                break;
        }
    }
    store = inject(Store)
    activeOrder$ = this.store.select(selectOrders)
    getZIndex(win: WindowState, activeOrder: string[] | null): number {
        if (win.minimized) return 0;
        if (!activeOrder) return 1;

        const pos = activeOrder.indexOf(win.id);
        if (pos === -1) {
            return 1;
        }
        // 正在拖动或者拽动， 提高其z-index以增强辨识度
        if(win.id===this.draggingTouchWindowId
            || win.id===this.draggingWindowId
            || win.id === this.resizeWinId
            || win.id === this.hoverId
        ){
            // 相当大的z-index,理应不会出现问题
            return 10000;
        }
        return pos + 10;
    }

}
