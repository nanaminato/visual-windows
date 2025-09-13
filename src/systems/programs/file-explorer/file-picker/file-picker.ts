import {Component, ElementRef, inject, Input, ViewChild} from '@angular/core';
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
import {WindowActions} from '../../../system-services/state/window/window.actions';
import {processClose} from '../../../system-lives/window-live/adapter';
import {ModalWindow} from '../../../system-lives/window-live/adapter/adapter';
import {selectWindows} from '../../../system-services/state/window/window.selectors';
import {take} from 'rxjs';

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
export class FilePicker extends ModalWindow implements processClose{
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
    private inherit: boolean = false;

    drivers: DriverInfo[] = [];
    // 地址栏地址，不代表实际处于的位置
    navigatePath: string = "";
    parts: string[] = [];
    driverView: boolean = false;

    isLinux: boolean = false;
    editing: boolean = false;
    breadcrumbs: { name: string, path: string }[] = [];
    @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;

    private store = inject(Store); // 注入 ngrx store

    override modalInit() {
        let title: string;
        if (this.config.mode === 'save') {
            title = '保存为';
        } else if (this.config.selectFolders) {
            title = '选择文件夹';
        } else {
            title = '选择文件';
        }

        // 从 store 读取 windows，一次性取值并更新当前窗口的 title 和 icon（icon 来自 parent）
        this.store.select(selectWindows).pipe(take(1)).subscribe(windows => {
            if (!windows) return;

            // 找到父窗口和当前窗口
            // const parentWindow = this.parentId ? windows.find(w => w.id === this.parentId) : undefined;
            // const currentWindow = windows.find(w => w.id === this.id);
            // 构造更新后的 windows 列表
            const updatedWindows = windows.map(w => {
                if (w.id === this.id) {
                    return {
                        ...w,
                        title,
                    };
                }
                return w;
            });

            // 派发更新 action
            this.store.dispatch(WindowActions.updateWindows({ windows: updatedWindows }));
        });
    }

    closeWindow() {
        this.store.dispatch(WindowActions.closeWindow({id: this.id}))
    }
    parentClosed(){
        this.store.dispatch(filePickerCancel({
            requestId: this.config.requestId
        }));
    }
    async ngOnInit() {
        this.modalInit();
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
        this.buildBreadcrumbs();
    }
    private extractFileName(path: string): string {
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
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
            this.buildBreadcrumbs();

            if(addToHistory){
                // 如果当前不是历史末尾，截断后面的历史
                if(this.historyIndex < this.history.length - 1){
                    this.history = this.history.slice(0, this.historyIndex + 1);
                }
                this.history.push(path);
                this.historyIndex = this.history.length - 1;
            }
            this.inherit = true;

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
        this.inherit = false;
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
        // console.log('last selectedIndex', idx);
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
        // console.log(fullPath);
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
            }else if(this.inherit && this.currentPath.endsWith(text)){
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
        // console.log(file)
        if (file.isDirectory) {
            if(this.config.selectFolders) {
                this.selectedFiles = this.selectedFiles.filter(f => f.path === file.path);
                this.selectedFilesText = file.name;
            }
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
    buildBreadcrumbs() {
        const raw = this.currentPath || '';
        this.breadcrumbs = [];

        // LINUX 情况
        if (this.isLinux) {
            if (!raw || raw === '/') {
                // 根目录显示为 "/"
                this.breadcrumbs = [{ name: '/', path: '/' }];
                return;
            }
            const segs = raw.split('/').filter(s => s.length > 0);
            // 根先放一个 "/"
            this.breadcrumbs.push({ name: '/', path: '/' });
            let acc = '';
            for (let i = 0; i < segs.length; i++) {
                acc = acc === '' ? ('/' + segs[i]) : (acc + '/' + segs[i]);
                // name 不包含斜杠，仅显示段名
                this.breadcrumbs.push({ name: segs[i], path: acc });
            }
            this.insertSeparator()
            return;
        }

        // Windows / 非 Linux 情况
        // 把所有 '/' 统一转成 '\' 方便处理
        if (!raw || raw === '/') {
            // 把 "/" 当成此电脑/驱动器视图
            this.breadcrumbs = [{ name: '此电脑', path: '/' }];
            return;
        }
        const cleaned = raw.replace(/\//g, '\\');
        const segs = cleaned.split('\\').filter(s => s.length > 0);
        if (segs.length === 0) {
            this.breadcrumbs = [{ name: '此电脑', path: '/' }];
            return;
        }

        // 如果第一个段看起来是驱动器（例如 "C:"），先加入驱动器面包屑，name 为 "C:"（无 '\')
        if (segs[0].includes(':')) {
            let acc = segs[0] + '\\'; // C:\
            this.breadcrumbs.push({ name: segs[0], path: acc }); // name 不带反斜杠
            for (let i = 1; i < segs.length; i++) {
                // 对于后续段，累积 path 为 "C:\Users" / "C:\Users\Me"
                acc = acc.endsWith('\\') ? (acc + segs[i]) : (acc + '\\' + segs[i]);
                this.breadcrumbs.push({ name: segs[i], path: acc });
            }
        } else {
            // 非驱动器的普通路径（如网络路径或其它），每段 name 直接为段名，不包含 '\'
            let acc = '';
            for (let i = 0; i < segs.length; i++) {
                acc = acc === '' ? segs[i] : (acc + '\\' + segs[i]);
                this.breadcrumbs.push({ name: segs[i], path: acc });
            }
        }
        this.insertSeparator();
    }
    insertSeparator() {
        const crumbs = this.breadcrumbs;
        if (!Array.isArray(crumbs) || crumbs.length <= 1) return;
        const sep = { name: '>', path: '' };
        this.breadcrumbs = crumbs.flatMap(
            (item, i)=>
                i < crumbs.length - 1 ? [item, sep] : [item]);
    }

    onBreadcrumbClick(path: string, event?: MouseEvent) {
        if(path===''){
            return;
        }
        if (event) {
            event.stopPropagation();
        }
        // 点击面包屑时直接导航到该路径
        this.navigatePath = path;
        this.tryNavigateToFolder(path);
    }

    enterEditMode(event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.editing = true;
        // 将 navigatePath 置为当前路径，之后在下一次运行周期聚焦并选中
        this.navigatePath = this.currentPath;
        // 使用 setTimeout 让 Angular 完成 DOM 更新再 focus
        setTimeout(() => {
            try {
                this.addressInput?.nativeElement?.focus();
                this.addressInput?.nativeElement?.select();
            } catch (e) { }
        }, 0);
    }
    onEnterFromInput() {
        // 用户在编辑模式下按回车
        this.navigateFromAddress(); // 已在类中定义并处理了 normalize/relative 等
        // 退出编辑模式（navigateFromAddress 在成功后会设置 navigatePath/currentPath/buildBreadcrumbs）
        this.editing = false;
    }

    onInputBlur() {
        this.editing = false;
        this.navigatePath = this.currentPath;
    }
}
