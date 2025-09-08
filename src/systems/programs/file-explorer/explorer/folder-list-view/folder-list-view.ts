import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {LightFile} from '../models';
import {DatePipe} from '@angular/common';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../../../system-services/state/window/window.actions';
import {codeSpaceProgram, terminalProgram} from '../../../models/register-app';

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
    mode: 'selector' | 'viewer' = 'viewer';
    @Input()
    files: LightFile[] = [];
    @Input()
    currentPath: string | undefined;
    @Input() multiSelect: boolean = false;
    @Input() selectedFiles: LightFile[] = [];
    @Output() fileSelect: EventEmitter<{file: LightFile, event: MouseEvent}> = new EventEmitter();

    isFileSelected(file: LightFile) {
        return this.selectedFiles.some(f => f.path === file.path);
    }


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

    clickTimeout: any;

    onFileClick(file: LightFile, event: MouseEvent) {
        // 先清除之前的定时器，防止多次点击叠加
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
        }
        // 延迟执行单击的处理，等待双击事件
        this.clickTimeout = setTimeout(() => {
            this.fileSelect.emit({ file, event });
        }, 200); // 200ms 延迟，可以根据需要调整
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
        console.log('parent click');
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
            case 'openCode':
                this.store.dispatch(WindowActions.openWindow({
                    id: codeSpaceProgram,
                    title: 'code space',
                    params: {
                        file: file
                    }
                }))
                break;
            case 'openTerminal':
                this.store.dispatch(WindowActions.openWindow({
                    id: terminalProgram,
                    title: '终端',
                    params: {
                        workDirectory: file===undefined? this.currentPath:file.path
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
