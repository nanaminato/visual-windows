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
import {processClose} from '../../../system-lives/window-live/adapter/adapter';

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
export class FilePicker implements processClose{
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

    pickedFiles: LightFile[] = [];
    selectedFiles: LightFile[] = [];

    drivers: DriverInfo[] = [];
    // 地址栏地址，不代表实际处于的位置
    navigatePath: string = "";
    parts: string[] = [];
    driverView: boolean = false;

    isLinux: boolean = false;
    closeWindow() {
        this.store.dispatch(WindowActions.closeWindow({id: this.id}))
    }
    parentClosed(){
        this.store.dispatch(filePickerCancel({
            requestId: this.config.requestId
        }));
    }
    async ngOnInit() {
        this.isLinux = await this.systemInfoService.isLinuxAsync();

        this.currentPath = this.config.startPath ?? (this.isLinux ? '/' : 'C:\\');
        this.navigatePath = this.currentPath;

        // 保存模式默认文件名
        if (this.config.mode === 'save') {
            this.saveFileName = this.config.filePath ? this.extractFileName(this.config.filePath) : '';
            this.selectedExt = this.config.filterExts?.[0] ?? '';
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
    selectedExt = '';

    onFileSelectClicked(file: LightFile, event: MouseEvent) {
        if (this.config.mode === 'save') {
            // 保存模式旧逻辑不变
            if (!file.isDirectory) {
                this.pickedFiles = [file]
                this.saveFileName = file.name;
            }
        }
        if(this.config.multiSelect){
            this.updateMultiSelect(file, event);
        }else{
            this.selectedFiles = [file]
            this.lastSelectedIndex = this.files.findIndex(f => f.path === file.path);
            if(this.config.selectFolders){
                if(file.isDirectory){
                    this.pickedFiles = [file];

                }
            }else{
                if(!file.isDirectory){
                    this.pickedFiles = [file];
                }
            }

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

            // 合并原来的选中项

            //selects
            const selectRangeFiles =  this.files.slice(start, end + 1);
            const selection = new Set(this.selectedFiles.map(f=>f.path));
            selectRangeFiles.forEach(f=>selection.add(f.path));
            this.selectedFiles = this.files.filter(f => selection.has(f.path));

            const rangeFiles = this.files.slice(start, end + 1).filter(f => this.isSelectable(f));
            const pickSelection = new Set(this.pickedFiles.map(f=>f.path));
            rangeFiles.forEach(f=>pickSelection.add(f.path));
            const picks = this.files.filter(f => pickSelection.has(f.path));

            let count = this.config.maxSelectCount;
            if (count === undefined || count >= picks.length) {
                this.pickedFiles = picks;
            } else {
                this.pickedFiles = picks.slice(picks.length - count);
            }
        } else if (event.ctrlKey || event.metaKey) {

            // Ctrl多选 - 切换当前项选中状态
            const exists = this.pickedFiles.find(f => f.path === file.path);
            if (exists) {
                // ctrl 减选
                if(this.pickedFiles.length > 1){
                    this.pickedFiles = this.pickedFiles.filter(f => f.path !== file.path);
                }
                this.selectedFiles = this.selectedFiles.filter(f => f.path !== file.path);
            } else {
                // ctrl 加选
                if (this.config.maxSelectCount && this.pickedFiles.length >= this.config.maxSelectCount) {
                    this.messageService.warning(`最多选择 ${this.config.maxSelectCount} 个文件`);
                    return;
                }
                this.selectedFiles.push(file)
                if (this.config.selectFolders === file.isDirectory) {
                    this.pickedFiles.push(file);
                }

            }

        } else {
            // 无特殊键 - 单选
            if (this.pickedFiles.length === 1 && this.pickedFiles[0].path === file.path) {

            } else {
                if (this.config.selectFolders === file.isDirectory) {
                    this.pickedFiles = [file];
                }

            }
            this.selectedFiles = [file];
        }
        this.lastSelectedIndex = idx;
        console.log('last selectedIndex', idx);
    }

    // 判断某文件是否可选（根据文件夹选择权重和类型过滤）
    private isSelectable(file: LightFile): boolean {
        // 如果选择文件，但是想选择文件夹
        if (file.isDirectory && !this.config.selectFolders) return false;
        // 如果是文件,并且是选择文件模式
        if ( !file.isDirectory && this.config.filterExts && this.config.filterExts.length > 0){
            const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
            return this.config.filterExts.includes(ext);
        }

        return true;
    }

    saveFileName: string = '';

    confirmSelection() {
        if (this.config.mode === 'save') {
            this.handleSaveMode();
        } else {
            this.handleSelectMode();
        }
    }

    private handleSaveMode() {
        let fileName = this.saveFileName.trim();
        if (!fileName) {
            this.messageService.warning('请输入文件名');
            return;
        }
        if(!fileName.endsWith(this.selectedExt)){
            fileName = fileName+this.selectedExt;
        }
        const fullPath = this.currentPath+"\\"+fileName;

        this.store.dispatch(filePickerConfirm({
            requestId: this.config.requestId,
            selectedPaths: [fullPath]
        }));
        console.log(fullPath);
        this.closeWindow()
    }


    private handleSelectMode() {
        if (this.pickedFiles.length === 0&&!this.config.selectFolders && this.selectedFilesText === '') {
            this.messageService.warning('请选择文件');
            return;
        }

        const selectedPaths = this.parseSelectedPaths(this.selectedFilesText);
        if (!selectedPaths) {
            return; // 错误提示已在 parseSelectedPaths 中处理
        }

        this.store.dispatch(filePickerConfirm({
            requestId: this.config.requestId,
            selectedPaths
        }));
        this.closeWindow();
    }

    private parseSelectedPaths(text: string): string[] | null {
        if (text.startsWith('"')) {
            const paths = text.split(' ');
            for (const path of paths) {
                const trimmedPath = path.substring(1, path.lastIndexOf('"'));
                if (!this.isAValidFile(trimmedPath)) {
                    this.messageService.error('选中的文件必须都在当前路径');
                    return null;
                }
            }
            return paths.map(p => this.currentPath+"\\"+p.substring(1, p.lastIndexOf('"')));
        } else {
            if(text===''){
                return [this.currentPath]
            }
            if (!this.isAValidFile(text)) {
                this.messageService.error('选中的文件必须都在当前路径');
                return null;
            }
            return [this.currentPath+"\\"+text];
        }
    }

    private isAValidFile(name: string): boolean {
        return this.files.some(f => f.name === name);
    }


    cancelSelection() {
        this.pickedFiles = [];
        this.saveFileName = '';

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
                this.pickedFiles = [file];
                this.confirmSelection();
            }
        }
    }
    selectedFilesText = '';       // 绑定输入框字符串
    private userEditing = false;  // 标记是否正在用户编辑输入框

    onSelectedFilesTextChange(value: string) {
        this.selectedFilesText = value;

        if (!this.userEditing) {
            // 标记当前是用户在编辑
            this.userEditing = true;
            // 清空选中状态
            this.pickedFiles = [];
        }
    }

    private updateSelectedFilesText() {
        if (this.pickedFiles.length === 0) {
            this.selectedFilesText = '';
        } else if (this.pickedFiles.length === 1) {
            this.selectedFilesText = this.pickedFiles[0].name;
        } else {
            this.selectedFilesText = this.pickedFiles.map(f => `"${f.name}"`).join(' ');
        }
    }
}
