import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {FileAction, LightFile} from '../models';
import {DatePipe} from '@angular/common';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../../../system-services/state/window/window.actions';
import {codeSpaceProgram, fileMoving, terminalProgram} from '../../../models/register-app';
import {getFileType, formatSize} from '../../models';
import {ClipboardModule, ClipboardService} from 'ngx-clipboard';
import {FileSelectChangedEvent} from '../models';

@Component({
  selector: 'app-folder-list-view',
    imports: [
        DatePipe,
        ClipboardModule,
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

    selectedFiles: LightFile[] = [];
    // 选择的文件发生了变化，向父组件发送通知
    @Output()
    fileSelectChange: EventEmitter<FileSelectChangedEvent> = new EventEmitter();

    @Output()
    fileAction: EventEmitter<FileAction> = new EventEmitter();

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
    lastSelectedIndex: number | null = null;

    onFileClick(file: LightFile, event: MouseEvent) {
        const index = this.files.findIndex(f => f.path === file.path);
        if (index === -1) {
            return;
        }

        if (event.shiftKey && this.lastSelectedIndex !== null) {
            // Shift 多选
            const start = Math.min(this.lastSelectedIndex, index);
            const end = Math.max(this.lastSelectedIndex, index);
            const filesToSelect = this.files.slice(start, end + 1);

            // 这次选择替代上次全部选择
            this.selectedFiles = [...filesToSelect];
        } else if (event.ctrlKey || event.metaKey) {
            // Ctrl 或 Cmd 多选（切换选中状态）
            const selectedIndexInSelected = this.selectedFiles.findIndex(f => f.path === file.path);
            if (selectedIndexInSelected > -1) {
                // 已选中，取消选中
                this.selectedFiles.splice(selectedIndexInSelected, 1);
            } else {
                this.selectedFiles.push(file);
            }
            // 更新 lastSelectedIndex 为当前
            this.lastSelectedIndex = index;
        } else {
            // 普通点击，清空选择，只选当前
            this.selectedFiles = [file];
            this.lastSelectedIndex = index;
        }

        this.fileSelectChange.emit({
            files: this.selectedFiles,
        });
    }

    fileDbl(file: LightFile) {
        // 双击时清除单击定时器，防止单击事件触发
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        this.fileProcess.emit(file);
    }

    clipboardService: ClipboardService = inject(ClipboardService);
    constructor() {
        document.addEventListener('click', () => {
            if (this.contextMenuVisible) {
                this.contextMenuVisible = false;
            }
        });

    }
    contextMenuVisible = false;
    contextMenuPosition = { x: 0, y: 0 };

    // 右键菜单事件处理
    onRightClick(event: MouseEvent, file: LightFile) {
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuVisible = true;
        this.contextMenuPosition = { x: event.clientX, y: event.clientY };
        let isSelected = this.selectedFiles.find(f => f.path === file.path);
        if(!isSelected){
            this.selectedFiles.length = 0;
            this.selectedFiles.push(file);
        }
    }
    onWrapperRightClick(event: MouseEvent) {
        event.preventDefault();
        const target = event.target as HTMLElement;
        if (target.closest('tr.folder-list-row')) {
            return; // 文件行右键事件另有处理
        }
        this.contextMenuVisible = true;
        this.contextMenuPosition = { x: event.clientX, y: event.clientY };
        this.selectedFiles.length = 0;
    }

    @Output() refreshRequest = new EventEmitter<void>();
    private store = inject(Store);
    onContextMenuAction(action: string) {
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
                        fileList : this.selectedFiles
                    }
                }))

                break;
            case 'openTerminal':
                let folder = this.selectedFiles[0];
                this.store.dispatch(WindowActions.openWindow({
                    id: terminalProgram,
                    title: '终端',
                    params: {
                        workDirectory: folder===undefined? this.currentPath:folder.path
                    }
                }))
                break;
            case 'properties':

                break;
            case 'copyPath':
                this.clipboardService.copy(this.selectedFiles[0].path!)
                return;
        }
    }


    pasteFile() {
        this.contextMenuVisible = false;
        this.fileAction.emit({type: 'paste'});
    }

    copyFile() {
        this.contextMenuVisible = false;
        this.fileAction.emit({type: 'copy'});
    }
    cutFile() {
        this.contextMenuVisible = false;
        this.fileAction.emit({type: 'cut'});
    }
    @Input()
    canPaste: boolean = false;
}
