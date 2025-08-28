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
import {selectProgramConfigs} from '../../system-services/state/program-config.selector';
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
export class WindowsLive {
    @Input()
    win: WindowState | undefined;
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
            if(this.win?.customHeader){
                if(this.componentRef.instance.appEventEmitter){
                    this.componentRef.instance.appEventEmitter.subscribe((eventData: ProgramEvent) => {
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
                        }
                    });
                }
            }
            this.hasLoaded = true;
        }
    }
    ngOnChanges(changes: SimpleChanges) {
        if (changes['win']) {
            const win = changes['win'].currentValue;
            if(this.componentRef) {
                this.componentRef.instance.active = win.active;
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
    startDrag(eventData: MouseEvent, id: string) {
        this.appEventEmitter.emit({
            type: 5,
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

        if (this.componentRef && typeof this.componentRef.instance.parentSizeChange=== 'function') {
            this.componentRef.instance.parentSizeChange();
        }
    };

}
