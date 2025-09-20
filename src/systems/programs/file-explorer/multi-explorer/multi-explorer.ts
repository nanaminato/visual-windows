import {Component, Input, QueryList, ViewChildren} from '@angular/core';
import {FileExplorer} from '../explorer/file-explorer';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import {FileExplorerInit, PropagateTitle} from './models';
import {v4 as uuid} from 'uuid';
import {SystemInfo} from '../../../models';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {Program} from '../../../system-lives/window-live/adapter';
@Component({
  selector: 'app-multi-explorer',
    imports: [
        FileExplorer,
        NzTabsModule,
        NzIconDirective
    ],
  templateUrl: './multi-explorer.html',
  styleUrl: './multi-explorer.css'
})
export class MultiExplorer extends Program{
    @ViewChildren('fileExplorerComp')
    fileExplorerComponents!: QueryList<FileExplorer>;
    // 窗口id, 用于实现自定义程序header
    @Input()
    active: boolean | undefined;
    @Input()
    startPath: string = "";
    fileExplorers: FileExplorerInit[] = [];
    selectedIndex: number = 0;
    systemInfo: SystemInfo | undefined = undefined;
    async ngOnInit() {
        this.openFileExplorer(this.startPath);
        this.loaded()
    }
    openFileExplorer(path: string) {
        this.fileExplorers.push({
            fileExplorerId: uuid(),
            initPath: path,
            title: "",
        });
        this.selectedIndex = this.fileExplorers.length - 1;
    }
    openNewFileExplorer() {
        this.openFileExplorer('');
    }

    closeTab(index: number, event: MouseEvent) {
        event.stopPropagation(); // 阻止触发selectTab
        this.fileExplorers.splice(index, 1);

        // 调整选中索引
        if (this.selectedIndex >= this.fileExplorers.length) {
            this.selectedIndex = this.fileExplorers.length - 1;
        }
        if (this.selectedIndex < 0) {
            this.selectedIndex = 0;
        }
        if(this.fileExplorers.length <= 0) {
            this.closeWindow()
        }
    }

    selectTab(index: number) {
        this.selectedIndex = index;
    }

    handleTitleChange($event: PropagateTitle) {
        const ele = this.fileExplorers.find(f => f.fileExplorerId === $event.fileExplorerId);
        if (ele) {
            ele.title = $event.title;
        }
    }

    getTitle(fileExplorer: FileExplorerInit) {
        if (fileExplorer.title === "/") {
            return "此电脑";
        }
        return fileExplorer.title || '无标题';
    }
    minimizeWindow() {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 2,
            id: this.id,
            event: 'minimizeWindow'
        });
    }

    maximizeWindow() {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 3,
            id: this.id,
            event: 'maximizeWindow'
        })
    }

    closeWindow() {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 4,
            id: this.id,
            event: 'closeWindow'
        });
    }

    startDrag($event: MouseEvent) {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 5,
            id: this.id,
            event: $event
        });
    }
    touchDrag($event: TouchEvent) {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 7,
            id: this.id,
            event: $event
        });
    }
}
