import {
    Component, ComponentRef,
    EventEmitter,
    inject,
    Input,
    Output, SimpleChanges,
    Type,
    ViewChild,
    ViewContainerRef
} from '@angular/core';
import {CommonModule} from "@angular/common";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {WinIcon} from "../win-icon/win-icon";
import {ProgramConfig, ProgramEvent} from '../../models';
import {WindowState} from '../../models';
import {firstValueFrom, map} from 'rxjs';
import {Store} from '@ngrx/store';
import {selectProgramConfigs} from '../../system-services/state/system/system.selector';
import {LinkService} from '../../system-services/link.service';

type ResizeDirection =
    | 'top-left' | 'top' | 'top-right'
    | 'right' | 'bottom-right' | 'bottom'
    | 'bottom-left' | 'left';
@Component({
    selector: 'window-live',
    imports: [
        NzIconDirective,
        WinIcon,
        CommonModule,
    ],
    templateUrl: './windows-live.html',
    styleUrl: './windows-live.css'
})
export class WindowsLive{
    @Input()
    win: WindowState | undefined;
    linkService: LinkService = inject(LinkService);
    config: ProgramConfig | undefined;
    async ngOnInit() {
        this.config = await this.getAppWindowConfigOfWindow(this.win!.programId);
    }
    @Output()
    appEventEmitter: EventEmitter<ProgramEvent> = new EventEmitter<ProgramEvent>();
    private store = inject(Store);
    programConfigs$ = this.store.select(selectProgramConfigs);
    async getAppWindowConfigOfWindow(programId: string) {
        return await firstValueFrom(
            this.programConfigs$.pipe(
                map(programConfigs => {
                    if(!programConfigs){
                        return undefined;
                    }
                    let configs = programConfigs.filter(app => app.programId === programId);
                    if(configs.length>=1){
                        return configs[0];
                    }
                    return undefined;
                })
            )
        )
    }


    minimizeWindow(id: string) {
        this.appEventEmitter.emit({
            type: 2,
            id: id,
            event: 'minimizeWindow'
        });
    }

    toRecord<T extends object>(param: T): Record<string, unknown> {
        const record: Record<string, unknown> = {};
        if(param){
            for (const key of Object.keys(param)) {
                record[key] = (param as any)[key];
            }
        }
        record["id"] = this.win?.id;
        return record;
    }
    maximizeWindow(id: string) {
        this.appEventEmitter.emit({
            type: 3,
            id: id,
            event: 'maximizeWindow'
        })
        if (this.componentRef && typeof this.componentRef.instance.parentSizeChange=== 'function') {
            setTimeout(()=>{
                this.componentRef!.instance.parentSizeChange();
            },200)
        }
    }

    @ViewChild('dynamicContent', { read: ViewContainerRef, static: false })
    dynamicContent!: ViewContainerRef | undefined;

    private componentRef?: ComponentRef<any>;
    ngAfterViewInit() {
        if (this.win && this.win.component) {
            this.loadComponent(this.win!.component, this.win!.params);
        }
    }
    private hasLoaded = false;
    loadComponent(component: Type<any>, params?: any) {
        if (this.hasLoaded) return; // 只加载一次
        if(this.dynamicContent) {
            this.componentRef = this.dynamicContent.createComponent(component);

            let record: Record<string, unknown> = this.toRecord(params);
            for (let key of Object.keys(record)) {
                this.componentRef!.instance[key] = record[key];
            }
            this.linkService.add(this.win!.id, this.componentRef.instance);
            if(this.win?.customHeader){
                if(this.componentRef.instance.appEventEmitter){
                    this.componentRef.instance.appEventEmitter.subscribe((eventData: ProgramEvent) => {
                        console.log(JSON.stringify(eventData));
                        switch (eventData.type) {
                            case 1:
                                this.focusWindow(eventData.id);
                                break;
                            case 2:
                                this.minimizeWindow(eventData.id);
                                break;
                            case 3:
                                this.maximizeWindow(eventData.id);
                                break;
                            case 4:
                                this.closeWindow(eventData.id);
                                break;
                            case 5:
                                this.startDrag(eventData.event as unknown as MouseEvent, eventData.id);
                                break;
                            case 7:
                                this.touchDrag(eventData.event as TouchEvent, eventData.id);
                                break;
                            case 9:
                            case 10:
                                console.log('组件的hover被listen')
                                this.appEventEmitter.emit({
                                    id: eventData.id,
                                    type: eventData.type,
                                    event: "event",
                                })
                        }
                    });
                }
            }
            this.hasLoaded = true;
        }
    }
    // 用于自定义header的active样式表示
    ngOnChanges(changes: SimpleChanges) {
        if (changes['win']) {
            const win = changes['win'].currentValue;
            if(this.componentRef) {
                this.componentRef.instance.active = win.active;
            }
        }
    }
    async closeWindow(id: string) {
        // 如果子组件实现了 processClose 接口，就调用对应方法
        if (this.componentRef && typeof this.componentRef.instance.parentClosed=== 'function') {
            await this.componentRef.instance.parentClosed();
        }
        this.appEventEmitter.emit({
            type: 4,
            id: id,
            event: 'closeWindow',
        });
    }
    focusWindow(id: string) {
        // console.log(id, 'trigger focus');
        this.appEventEmitter.emit({
            type: 1,
            id: id,
            event: 'focus'
        });
    }
    startDrag(eventData: MouseEvent, id: string) {
        eventData.stopPropagation()
        console.log(id, 'trigger startDrag');
        this.appEventEmitter.emit({
            type: 5,
            id: id,
            event: eventData
        });
    }
    touchDrag(eventData: TouchEvent, id: string) {
        eventData.stopPropagation()
        console.log(id, 'trigger touchDrag');
        this.appEventEmitter.emit({
            type: 7,
            id: id,
            event: eventData
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

    startResize(event: MouseEvent | TouchEvent, id: string, direction: ResizeDirection) {
        event.stopPropagation();
        if (event.cancelable) {
            event.preventDefault();
        }

        this.resizing = true;
        this.resizeDir = direction;
        this.resizeWinId = id;

        let clientX = 0;
        let clientY = 0;
        if ('touches' in event && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;

            window.addEventListener('touchmove', this.onResizeMove, { passive: false });
            window.addEventListener('touchend', this.stopResize);
            window.addEventListener('touchcancel', this.stopResize);

        } else if ('clientX' in event) {
            clientX = event.clientX;
            clientY = event.clientY;

            window.addEventListener('mousemove', this.onResizeMove);
            window.addEventListener('mouseup', this.stopResize);
        }

        if (!this.win || this.win.id !== id) return;

        this.startPos = { x: clientX, y: clientY };
        this.startSize = { width: this.win.size.width, height: this.win.size.height };
        this.startPosWin = { x: this.win.position.x, y: this.win.position.y };
    }

    onResizeMove = (event: MouseEvent | TouchEvent) => {
        if (!this.resizing || !this.win || !this.resizeDir) return;

        event.preventDefault();

        let clientX = 0;
        let clientY = 0;

        if ('touches' in event) {
            if (event.touches.length === 0) return;
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const dx = clientX - this.startPos.x;
        const dy = clientY - this.startPos.y;

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

        this.appEventEmitter.emit({
            type: 6,
            id: this.resizeWinId!,
            event: {
                position: { x: newX, y: newY },
                size: { width: newWidth, height: newHeight }
            }
        });
    };

    stopResize = (event: MouseEvent | TouchEvent) => {
        if (!this.resizing) return;
        this.appEventEmitter.emit({
            type: 8,
            id: this.resizeWinId!,
            event: 8
        });
        this.resizing = false;
        this.resizeDir = null;
        this.resizeWinId = null;

        window.removeEventListener('mousemove', this.onResizeMove);
        window.removeEventListener('mouseup', this.stopResize);

        window.removeEventListener('touchmove', this.onResizeMove);
        window.removeEventListener('touchend', this.stopResize);
        window.removeEventListener('touchcancel', this.stopResize);

        if (this.componentRef && typeof this.componentRef.instance.parentSizeChange === 'function') {
            this.componentRef.instance.parentSizeChange();
        }
    };
}
