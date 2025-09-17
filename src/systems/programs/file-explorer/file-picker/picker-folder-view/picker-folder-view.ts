import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {DatePipe} from '@angular/common';
import {Store} from '@ngrx/store';
import {LightFile} from '../../explorer/models';
import {getFileType, formatSize} from '../../models';

@Component({
  selector: 'app-picker-folder-view',
    imports: [
        DatePipe
    ],
  templateUrl: './picker-folder-view.html',
  styleUrl: './picker-folder-view.css'
})
export class PickerFolderView {
    @Input()
    mode: 'selector' | 'viewer' = 'viewer';
    @Input()
    files: LightFile[] = [];
    @Input()
    currentPath: string | undefined;
    @Input()
    multiSelect: boolean = false;
    @Input()
    selectedFiles: LightFile[] = [];
    @Output()
    fileSelect: EventEmitter<{file: LightFile, event: MouseEvent}> = new EventEmitter();

    isFileSelected(file: LightFile) {
        return this.selectedFiles.some(f => f.path === file.path);
    }

    // 计算文件类型显示文本
    getFileType(file: LightFile): string {
        return getFileType(file);
    }

    // 格式化大小，单位自动转换
    formatSize(size?: number): string {
        return formatSize(size);
    }
    @Output()
    fileProcess: EventEmitter<LightFile> = new EventEmitter<LightFile>();

    clickTimeout: any;

    onFileClick(file: LightFile, event: MouseEvent) {
        // 先清除之前的定时器，防止多次点击叠加
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
        }
        // 延迟执行单击的处理，等待双击事件
        this.clickTimeout = setTimeout(() => {
            this.fileSelect.emit({ file, event });
        }, 10);
    }

    fileDbl(file: LightFile) {
        // 双击时清除单击定时器，防止单击事件触发
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        this.fileProcess.emit(file);
    }
    constructor() {
        document.addEventListener('click', () => {
            if (this.contextMenuVisible) {
                this.contextMenuVisible = false;
            }
        });
    }
    contextMenuVisible = false;
    contextMenuPosition = { x: 0, y: 0 };
    contextMenuFile: LightFile | undefined = undefined;

    // 右键菜单事件处理
    onRightClick(event: MouseEvent, file: LightFile) {
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuVisible = true;
        this.contextMenuPosition = { x: event.clientX, y: event.clientY };
        this.contextMenuFile = file;
    }
    onWrapperRightClick(event: MouseEvent) {
        event.preventDefault();
        const target = event.target as HTMLElement;
        if (target.closest('tr.folder-list-row')) {
            return; // 文件行右键事件另有处理
        }
        this.contextMenuVisible = true;
        this.contextMenuPosition = { x: event.clientX, y: event.clientY };
        this.contextMenuFile = undefined;
    }

    @Output() refreshRequest = new EventEmitter<void>();
    private store = inject(Store);
    onContextMenuAction(action: string, file: LightFile | undefined) {
        this.contextMenuVisible = false;
        switch (action) {
            case 'refresh':
                this.refreshRequest.emit();
                break;
            case 'properties':

                break;
            case 'copyPath':

                return;
        }
    }

}
