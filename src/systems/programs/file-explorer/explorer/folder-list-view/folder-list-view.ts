import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {LightFile} from '../models';
import {DatePipe} from '@angular/common';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../../../system-services/state/window/window.actions';
import {codeSpaceProgram, fileMoving, terminalProgram} from '../../../models/register-app';
import {getFileType, formatSize} from '../../models';
import {ClipboardActions} from '../../../../system-services/state/clipboard/clipboard.actions';
import {selectClipboardState} from '../../../../system-services/state/clipboard/clipboard.selectors';
import {ClipboardState} from '../../../../system-services/state/clipboard/clipboard';
import {ClipboardModule, ClipboardService} from 'ngx-clipboard';

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

        this.fileSelect.emit({file, event});
    }

    fileDbl(file: LightFile) {
        // 双击时清除单击定时器，防止单击事件触发
        if (this.clickTimeout) {
            clearTimeout(this.clickTimeout);
            this.clickTimeout = null;
        }
        this.fileProcess.emit(file);
    }
    clipboardState: ClipboardState | undefined;
    clipboardService: ClipboardService = inject(ClipboardService);
    constructor() {
        document.addEventListener('click', () => {
            if (this.contextMenuVisible) {
                this.contextMenuVisible = false;
            }
        });
        this.store.select(selectClipboardState).subscribe((state)=>{
            this.clipboardState = state;
        })
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
        // console.log('parent click');
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
                this.clipboardService.copy(file?.path!)
                return;
        }
    }


    pasteFile() {
        this.contextMenuVisible = false;
        if(!this.clipboardState) return;
        if (!this.clipboardState.operation || this.clipboardState.files.length === 0) return;
        let windowParam = {
            id: fileMoving,
            title: '文件操作',
            params: {
                operation: {
                    localOperationId: '',
                    sourcePaths: this.clipboardState.files,
                    destinationPath: this.currentPath || '',
                    operationType: this.clipboardState.operation,
                    status: 'pending',
                    progress: 0,
                    currentFile: ''
                }
            }
        }
        // console.log(windowParam);
        this.store.dispatch(WindowActions.openWindow(windowParam));

        if (this.clipboardState.operation === 'cut') {
            this.store.dispatch(ClipboardActions.clearClipboard());
        }
    }

    copyFile() {
        this.contextMenuVisible = false;
        if (!this.selectedFiles.length) return;
        const paths = this.selectedFiles.map(f => f.path);
        this.store.dispatch(ClipboardActions.copyFiles({ files: paths }));
    }
    cutFile() {
        this.contextMenuVisible = false;
        if (!this.selectedFiles.length) {
            return;
        }
        const paths = this.selectedFiles.map(f => f.path);
        this.store.dispatch(ClipboardActions.cutFiles({ files: paths }));
    }

    cabPaste() {
        return this.clipboardState?.operation!==null;
    }
}
