import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {LightFile} from '../models';
import {DatePipe} from '@angular/common';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../../../system-services/state/window/window.actions';

@Component({
  selector: 'app-folder-list-view',
    imports: [
        DatePipe
    ],
  templateUrl: './folder-list-view.html',
  styleUrl: './folder-list-view.css'
})
export class FolderListView {
    @Input()
    files: LightFile[] = [];
    // 计算文件类型显示文本
    getFileType(file: LightFile): string {
        if (file.isDirectory) {
            return '文件夹';
        }
        // 简单根据扩展名判断类型，也可以更复杂
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        switch (ext) {
            case 'txt': return '文本文档';
            case 'jpg':
            case 'jpeg':
            case 'png': return '图片';
            case 'exe': return '应用程序';
            case 'pdf': return 'PDF 文件';
            default: return ext ? ext.toUpperCase() + ' 文件' : '文件';
        }
    }

    // 格式化大小，单位自动转换
    formatSize(size?: number): string {
        if (size === undefined) return '';
        if (size < 1024) return size + ' B';
        if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
        if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
        return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    @Output()
    fileProcess: EventEmitter<LightFile> = new EventEmitter<LightFile>();
    fileDbl(file: LightFile) {
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
    contextMenuFile: LightFile | null = null;

    // 右键菜单事件处理
    onRightClick(event: MouseEvent, file: LightFile) {
        event.preventDefault();
        this.contextMenuVisible = true;
        this.contextMenuPosition = { x: event.clientX, y: event.clientY };
        this.contextMenuFile = file;
    }
    private store = inject(Store);
    onContextMenuAction(action: string, file: LightFile | null) {
        this.contextMenuVisible = false;
        switch (action) {
            case 'openCode':
                this.store.dispatch(WindowActions.openWindow({
                    id: 'code-space',
                    title: 'code space',
                    params: {
                        params: file
                    }
                }))
                break;
            case 'properties':

                break;
            case 'copyPath':

                return;
        }
    }

}
