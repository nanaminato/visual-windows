import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {DriverInfo, FileNodeViewModel, LightFile} from '../explorer/models';
import {DriverListView} from '../explorer/driver-list-view/driver-list-view';
import {EntryRoot} from '../explorer/entry-root/entry-root';
import {FolderListView} from '../explorer/folder-list-view/folder-list-view';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzInputDirective, NzInputGroupComponent} from 'ng-zorro-antd/input';
import {NzSplitterComponent, NzSplitterPanelComponent} from 'ng-zorro-antd/splitter';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ExplorerService} from '../explorer/services/explorer.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {SystemInfoService} from '../../../system-services/info.service';
import {
    getParentPath,
    isAbsolutePath,
    isRootPath,
    normalizePath, resolveRelativePath
} from '../explorer/services/explorer.util';
import {Store} from '@ngrx/store';
import {FilePickerConfig} from './models/file-picker-config';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {filePickerCancel, filePickerConfirm} from '../../../system-services/state/system/file/file-picker.actions';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {ProgramEvent} from '../../../models';
import {WindowActions} from '../../../system-services/state/window/window.actions';

@Component({
  selector: 'app-file-picker',
    imports: [
        DriverListView,
        EntryRoot,
        FolderListView,
        NzIconDirective,
        NzInputDirective,
        NzInputGroupComponent,
        NzSplitterComponent,
        NzSplitterPanelComponent,
        ReactiveFormsModule,
        FormsModule,
        NzButtonComponent,
        NzSelectComponent,
        NzOptionComponent
    ],
  templateUrl: './file-picker.html',
  styleUrl: './file-picker.css'
})
export class FilePicker {
    explorerService: ExplorerService = inject(ExplorerService);
    messageService = inject(NzMessageService);
    //窗口程序id,用于获弹窗等阻塞主窗口
    @Input() id!: string;

    @Input() parentId?: string;

    // 当前实际所在的位置
    currentPath: string = ''; // 例如 "/home/user"
    private systemInfoService = inject(SystemInfoService);

    files: LightFile[] = [];

    @Input() config!: FilePickerConfig;
    selectedFiles: LightFile[] = [];

    drivers: DriverInfo[] = [];
    // 地址栏地址，不代表实际处于的位置
    navigatePath: string = "";
    parts: string[] = [];
    driverView: boolean = false;

    isLinux: boolean = false;
    closeWindow() {
        this.store.dispatch(WindowActions.closeWindow({id: this.id, parentId: this.parentId}))
    }
    async ngOnInit() {
        this.isLinux = await this.systemInfoService.isLinuxAsync();

        this.currentPath = this.config.startPath ?? (this.isLinux ? '/' : 'C:\\');
        this.navigatePath = this.currentPath;

        // 保存模式默认文件名
        if (this.config.mode === 'save') {
            this.saveFileName = this.config.filePath ? this.extractFileName(this.config.filePath) : '';
            this.selectedExt = this.getFileExtension(this.saveFileName) || (this.config.filterExts?.[0] ?? '');
        }

        await this.tryNavigateToFolder(this.currentPath);

        this.history = [this.currentPath];
        this.historyIndex = 0;
        this.partPath();
    }
    private extractFileName(path: string): string {
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
    }

    partPath() {
        if (!this.currentPath){
            this.parts = ['']
        }
        this.parts = this.currentPath.split('\\').filter(p => p.length > 0);
    }
    getSearchPlaceHolder() {
        if(this.parts.length === 0){
            return `在 此电脑 中搜索`;
        }
        return `在 ${this.parts[this.parts.length-1]} 中搜索`;
    }


    async onFolderSelected($event: FileNodeViewModel) {
        this.navigatePath = $event.path;
        await this.tryNavigateToFolder($event.path);
    }
    async tryNavigateToFolder(path: string,addToHistory: boolean = true) {
        try {
            if(path==='/'&&!this.isLinux){
                const driverInfos = await this.explorerService.getDriverInfos();
                this.files.length = 0;
                this.driverView = true;
                this.drivers = driverInfos;
                this.currentPath = path;
            }else{
                const files = await this.explorerService.getFiles(path);
                this.drivers.length = 0;
                this.driverView = false;
                this.files = files;
                this.currentPath = path;
            }
            this.navigatePath = this.currentPath;
            this.partPath();

            if(addToHistory){
                // 如果当前不是历史末尾，截断后面的历史
                if(this.historyIndex < this.history.length - 1){
                    this.history = this.history.slice(0, this.historyIndex + 1);
                }
                this.history.push(path);
                this.historyIndex = this.history.length - 1;
            }

        } catch (error: any) {
            this.navigatePath = this.currentPath;
            this.messageService.error(error.message);
        }
    }

    async onDriverNavigate($event: DriverInfo) {
        this.navigatePath = $event.name;
        await this.tryNavigateToFolder($event.name);
    }
    private history: string[] = [];
    private historyIndex: number = -1;
    async back() {
        if(this.historyIndex > 0){
            this.historyIndex--;
            const path = this.history[this.historyIndex];
            await this.tryNavigateToFolder(path, false);
        }
    }

    async forward() {
        if(this.historyIndex < this.history.length - 1){
            this.historyIndex++;
            const path = this.history[this.historyIndex];
            await this.tryNavigateToFolder(path, false);
        }
    }

    async stepBack() {
        const parentPath = getParentPath(this.currentPath, this.isLinux);
        if (parentPath === this.currentPath || !parentPath) {
            return; // 根目录，不再往上
        }
        await this.tryNavigateToFolder(parentPath);
    }

    refresh() {
        this.tryNavigateToFolder(this.currentPath);
    }
    canBack(): boolean {
        return this.historyIndex > 0;
    }

    canForward(): boolean {
        return this.historyIndex < this.history.length - 1;
    }
    canStepBack(): boolean {
        return !isRootPath(this.currentPath, this.isLinux);
    }

    clearPath() {
        this.navigatePath = "";
    }

    navigateFromAddress() {
        let inputPath = this.navigatePath.trim();
        if (!inputPath) {
            this.navigatePath = this.currentPath;
            return;
        }
        let targetPath = '';
        if (isAbsolutePath(inputPath, this.isLinux)) {
            targetPath = normalizePath(inputPath, this.isLinux);
        } else {
            targetPath = resolveRelativePath(this.currentPath, inputPath, this.isLinux);
        }

        this.tryNavigateToFolder(targetPath);
    }

    private store = inject(Store);


    onRefreshRequest() {
        this.refresh();
    }
    selectedExt = '';private getFileExtension(fileName: string): string {
        const idx = fileName.lastIndexOf('.');
        if (idx === -1) return '';
        return fileName.substring(idx + 1).toLowerCase();
    }

    onFileSelectClicked(file: LightFile, event: MouseEvent) {
        if (this.config.mode === 'save') {
            // 保存模式旧逻辑不变
            if (!file.isDirectory) {
                this.saveFileName = file.name;
                this.selectedExt = this.getFileExtension(file.name) || this.selectedExt;
            }
            return;
        }

        if (!this.config.multiSelect) {
            this.selectedFiles = [file];
            this.lastSelectedIndex = this.files.findIndex(f => f.path === file.path);
        } else {
            this.updateMultiSelect(file, event);
        }

        // 选中文件后，更新输入框文本，覆盖用户输入
        this.userEditing = false; // 标记结束编辑状态，防止覆盖冲突
        this.updateSelectedFilesText();
    }

    private lastSelectedIndex: number = -1; // 记录上一次点选的index，用于shift多选

    // 更新多选数组，支持ctrl/shift选择
    private updateMultiSelect(file: LightFile, event: MouseEvent) {
        // 找到点击文件索引
        const idx = this.files.findIndex(f => f.path === file.path);
        if (idx === -1) return;

        if (event.shiftKey && this.lastSelectedIndex !== -1) {
            // Shift多选 - 选中区间
            let [start, end] = [this.lastSelectedIndex, idx].sort((a,b)=>a-b);
            const rangeFiles = this.files.slice(start, end + 1).filter(f => this.isSelectable(f));
            // 合并原来的选中项
            const newSelection = new Set(this.selectedFiles.map(f=>f.path));
            rangeFiles.forEach(f=>newSelection.add(f.path));
            this.selectedFiles = this.files.filter(f => newSelection.has(f.path));
        } else if (event.ctrlKey || event.metaKey) {
            // Ctrl多选 - 切换当前项选中状态
            const exists = this.selectedFiles.find(f => f.path === file.path);
            if (exists) {
                this.selectedFiles = this.selectedFiles.filter(f => f.path !== file.path);
            } else {
                // 如果maxSelectCount限制，提前判断
                if (this.config.maxSelectCount && this.selectedFiles.length >= this.config.maxSelectCount) {
                    this.messageService.warning(`最多选择 ${this.config.maxSelectCount} 个文件`);
                    return;
                }
                this.selectedFiles.push(file);
            }
            this.lastSelectedIndex = idx;
        } else {
            // 无特殊键 - 单选
            if (this.selectedFiles.length === 1 && this.selectedFiles[0].path === file.path) {
                // 已经选中，取消选择
                this.selectedFiles = [];
                this.lastSelectedIndex = -1;
            } else {
                this.selectedFiles = [file];
                this.lastSelectedIndex = idx;
            }
        }
    }

    // 判断某文件是否可选（根据文件夹选择权重和类型过滤）
    private isSelectable(file: LightFile): boolean {
        if (file.isDirectory && !this.config.selectFolders) return false;
        if (!file.isDirectory && this.config.filterExts && this.config.filterExts.length > 0){
            const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
            return this.config.filterExts.includes(ext);
        }
        return true;
    }

    saveFileName: string = '';

    confirmSelection() {
        if (this.config.mode === 'save') {
            const fileName = this.saveFileName.trim();
            if (!fileName) {
                this.messageService.warning('请输入文件名');
                return;
            }

            let ext = this.getFileExtension(fileName);
            if (this.config.filterExts && this.config.filterExts.length > 0) {
                if (!this.config.filterExts.includes(ext)) {
                    ext = this.selectedExt || this.config.filterExts[0];
                    if (ext) {
                        // 去除旧扩展名后加新扩展名
                        const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
                        this.saveFileName = `${baseName}.${ext}`;
                    }
                }
            }

            const fullPath = this.currentPath.endsWith('/') || this.currentPath.endsWith('\\')
                ? this.currentPath + this.saveFileName
                : this.currentPath + (this.isLinux ? '/' : '\\') + this.saveFileName;

            this.store.dispatch(filePickerConfirm({
                requestId: this.config.requestId,
                selectedPaths: [fullPath]
            }));
            return;
        }

        // 选择模式
        if (this.selectedFiles.length === 0) {
            this.messageService.warning('请选择文件或文件夹');
            return;
        }

        // 校验所有选中文件是否都在当前路径
        const invalidFiles = this.selectedFiles.filter(f => !this.isPathInCurrentDir(f.path));
        if (invalidFiles.length > 0) {
            this.messageService.error('选中的文件必须都在当前路径');
            return;
        }

        // 组装路径字符串
        let selectedPaths: string[];
        if (!this.config.multiSelect) {
            selectedPaths = [this.selectedFiles[0].path];
        } else {
            selectedPaths = this.selectedFiles.map(f => f.path);
        }

        this.store.dispatch(filePickerConfirm({
            requestId: this.config.requestId,
            selectedPaths
        }));
        this.closeWindow()

    }
    private isPathInCurrentDir(path: string): boolean {
        // 简单判断路径是否以当前路径开头（注意大小写和分隔符）
        const normalizedCurrent = this.currentPath.replace(/\\/g, '/').toLowerCase();
        const normalizedPath = path.replace(/\\/g, '/').toLowerCase();
        return normalizedPath.startsWith(normalizedCurrent);
    }

    cancelSelection() {
        this.selectedFiles = [];
        this.saveFileName = '';
        this.store.dispatch(filePickerCancel({
            requestId: this.config.requestId
        }));
        this.closeWindow();
    }

    // 文件双击：按需打开文件夹或者确认选择单个文件
    async onFileDblClick(file: LightFile) {
        console.log(file)
        if (file.isDirectory) {
            this.navigatePath = file.path;
            await this.tryNavigateToFolder(file.path);
        } else {
            // 文件双击直接确认选择
            if(!this.config.selectFolders){
                this.selectedFiles = [file];
                this.confirmSelection();
            }
        }
    }
    selectedFilesText = '';       // 绑定输入框字符串
    private userEditing = false;  // 标记是否正在用户编辑输入框
    // 在模板绑定 [(ngModel)]="selectedFilesText" 并添加 (ngModelChange)="onSelectedFilesTextChange($event)"

    onSelectedFilesTextChange(value: string) {
        this.selectedFilesText = value;

        if (!this.userEditing) {
            // 标记当前是用户在编辑
            this.userEditing = true;
            // 清空选中状态
            this.selectedFiles = [];
        }
    }

    private updateSelectedFilesText() {
        if (this.selectedFiles.length === 0) {
            this.selectedFilesText = '';
        } else if (this.selectedFiles.length === 1) {
            this.selectedFilesText = this.selectedFiles[0].name;
        } else {
            this.selectedFilesText = this.selectedFiles.map(f => `"${f.name}"`).join(' ');
        }
    }
}
