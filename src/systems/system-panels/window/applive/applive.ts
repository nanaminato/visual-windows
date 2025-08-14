import {
    Component, ComponentRef,
    ElementRef,
    EventEmitter,
    inject,
    Input,
    Output,
    TemplateRef, Type,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {CommonModule, NgComponentOutlet} from "@angular/common";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {WinIcon} from "../win-icon/win-icon";
import {WindowState} from '../../../system-services/refers/window-manager.service';
import {AppEvent} from '../../../models/app-info';
import {AppManagerService} from '../../../system-services/impl/app-manager.service';
type ResizeDirection =
    | 'top-left' | 'top' | 'top-right'
    | 'right' | 'bottom-right' | 'bottom'
    | 'bottom-left' | 'left';
@Component({
    selector: 'app-applive',
    imports: [
        // NgComponentOutlet,
        NzIconDirective,
        WinIcon,
        CommonModule,
    ],
    templateUrl: './applive.html',
    styleUrl: './applive.css'
})
export class Applive {
    @Input()
    win: WindowState | undefined;
    private appManagerService: AppManagerService = inject(AppManagerService);
    @Output()
    appEventEmitter: EventEmitter<AppEvent> = new EventEmitter<AppEvent>();

    getAppWindowConfigOfWindow(win: WindowState) {
        return this.appManagerService.getAppWindowConfigOfWindow(win);
    }

    focusWindow(id: string) {
        this.appEventEmitter.emit({
            type: 1,
            id: id,
            event: 'focus'
        });
    }

    minimizeWindow(id: string) {
        this.appEventEmitter.emit({
            type: 2,
            id: id,
            event: 'minimizeWindow'
        });
    }
    toRecord<T extends object>(param: T): Record<string, unknown> | undefined {
        if(param===undefined) return undefined;
        const record: Record<string, unknown> = {};
        for (const key of Object.keys(param)) {
            record[key] = (param as any)[key];
        }
        return record;
    }
    maximizeWindow(id: string) {
        this.appEventEmitter.emit({
            type: 3,
            id: id,
            event: 'maximizeWindow'
        })
    }


    @ViewChild('dynamicContent', { read: ViewContainerRef, static: false })
    dynamicContent!: ViewContainerRef | undefined;

    private componentRef?: ComponentRef<any>;
    ngAfterViewInit() {
        if (this.win && this.win.component) {
            // setTimeout(()=>{
            //     this.loadComponent(this.win!.component, this.win!.params);
            // },20)
            this.loadComponent(this.win!.component, this.win!.params);
        }
    }

    loadComponent(component: Type<any>, params?: any) {
        this.dynamicContent?.clear();
        // console.log(this.dynamicContent);
        if(this.dynamicContent) {
            // console.log("try to load component " + component.name);
            this.componentRef = this.dynamicContent.createComponent(component);

            if (params) {
                Object.keys(params).forEach(key => {
                    this.componentRef!.instance[key] = params[key];
                });
            }
        }
    }

    async closeWindow(id: string) {
        if (this.componentRef && typeof this.componentRef.instance.parentClosed=== 'function') {
            await this.componentRef.instance.parentClosed();
        }
        this.appEventEmitter.emit({
            type: 4,
            id: id,
            event: 'closeWindow'
        });
    }




    startDrag($event: MouseEvent, id: string) {
        this.appEventEmitter.emit({
            type: 5,
            id: id,
            event: $event
        });
    }
    private resizing = false;
    private resizeDir: ResizeDirection | null = null;
    private resizeWinId: string | null = null;
    private startPos = { x: 0, y: 0 };
    private startSize = { width: 0, height: 0 };
    private startPosWin = { x: 0, y: 0 };

    // 最小尺寸限制
    private minWidth = 200;
    private minHeight = 100;

    constructor() {}

    startResize(event: MouseEvent, id: string, direction: ResizeDirection) {
        event.stopPropagation();
        event.preventDefault();

        this.resizing = true;
        this.resizeDir = direction;
        this.resizeWinId = id;

        this.startPos = { x: event.clientX, y: event.clientY };
        if (!this.win || this.win.id !== id) return;

        this.startSize = { width: this.win.size.width, height: this.win.size.height };
        this.startPosWin = { x: this.win.position.x, y: this.win.position.y };

        // 监听全局鼠标事件
        window.addEventListener('mousemove', this.onResizeMove);
        window.addEventListener('mouseup', this.stopResize);
    }

    onResizeMove = (event: MouseEvent) => {
        if (!this.resizing || !this.win || !this.resizeDir) return;

        const dx = event.clientX - this.startPos.x;
        const dy = event.clientY - this.startPos.y;

        let newWidth = this.startSize.width;
        let newHeight = this.startSize.height;
        let newX = this.startPosWin.x;
        let newY = this.startPosWin.y;

        switch (this.resizeDir) {
            case 'top-left':
                newWidth = this.startSize.width - dx;
                newHeight = this.startSize.height - dy;
                newX = this.startPosWin.x + dx;
                newY = this.startPosWin.y + dy;
                break;
            case 'top':
                newHeight = this.startSize.height - dy;
                newY = this.startPosWin.y + dy;
                break;
            case 'top-right':
                newWidth = this.startSize.width + dx;
                newHeight = this.startSize.height - dy;
                newY = this.startPosWin.y + dy;
                break;
            case 'right':
                newWidth = this.startSize.width + dx;
                break;
            case 'bottom-right':
                newWidth = this.startSize.width + dx;
                newHeight = this.startSize.height + dy;
                break;
            case 'bottom':
                newHeight = this.startSize.height + dy;
                break;
            case 'bottom-left':
                newWidth = this.startSize.width - dx;
                newHeight = this.startSize.height + dy;
                newX = this.startPosWin.x + dx;
                break;
            case 'left':
                newWidth = this.startSize.width - dx;
                newX = this.startPosWin.x + dx;
                break;
        }

        // 限制最小尺寸
        if (newWidth < this.minWidth) {
            newWidth = this.minWidth;
            if (['top-left', 'bottom-left', 'left'].includes(this.resizeDir)) {
                newX = this.startPosWin.x + (this.startSize.width - this.minWidth);
            }
        }
        if (newHeight < this.minHeight) {
            newHeight = this.minHeight;
            if (['top-left', 'top', 'top-right'].includes(this.resizeDir)) {
                newY = this.startPosWin.y + (this.startSize.height - this.minHeight);
            }
        }

        // // TODO: 这里可以加入桌面边界限制
        // console.log("resizing");
        // if(this.win&&this.win.component){
        //     if(typeof this.win.component.prototype.sizeChanged === 'function'){
        //         this.win.component.sizeChanged();
        //     }
        // }
        // 触发更新窗口大小位置事件
        this.appEventEmitter.emit({
            type: 6, // 自定义类型，比如 resize
            id: this.resizeWinId!,
            event: {
                position: { x: newX, y: newY },
                size: { width: newWidth, height: newHeight }
            }
        });
    };

    stopResize = (event: MouseEvent) => {
        if (!this.resizing) return;

        this.resizing = false;
        this.resizeDir = null;
        this.resizeWinId = null;

        window.removeEventListener('mousemove', this.onResizeMove);
        window.removeEventListener('mouseup', this.stopResize);


    };

}
