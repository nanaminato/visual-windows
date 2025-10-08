import {Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild} from '@angular/core';
import {PropagateTitle} from '../multi-explorer/models';
import {NzSplitterModule} from 'ng-zorro-antd/splitter';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzInputDirective, NzInputGroupComponent} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';
import {EntryRoot} from './entry-root/entry-root';
import {FileAction, FileNodeViewModel, FileSelectChangedEvent} from './models';
import {ExplorerService} from './services/explorer.service';
import {LightFile} from './models';
import {FolderListView} from './folder-list-view/folder-list-view';
import {DriverInfo} from './models';
import {NzMessageService} from 'ng-zorro-antd/message';
import {DriverListView} from './driver-list-view/driver-list-view';
import {
    generateTitle,
    getParentPath,
    isAbsolutePath,
    isRootPath,
    normalizePath,
    resolveRelativePath
} from './services/explorer.util';
import {SystemInfoService} from '../../../system-services/info.service';
import {WindowManagerService} from '../../../system-services/windows-manager.service';
import {Store} from '@ngrx/store';
import {WindowActions} from '../../../system-services/state/window/window.actions';
import {fileExplorerProgram, fileMoving} from '../../models/register-app';
import {buildBreadcrumbsForPath} from './models';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {ClipboardState} from '../../../system-services/state/clipboard/clipboard';
import {selectClipboardState} from '../../../system-services/state/clipboard/clipboard.selectors';
import {ClipboardActions} from '../../../system-services/state/clipboard/clipboard.actions';

@Component({
    selector: 'file-explorer',
    imports: [
        NzSplitterModule,
        NzIconDirective,
        NzInputGroupComponent,
        NzInputDirective,
        FormsModule,
        EntryRoot,
        FolderListView,
        DriverListView,
        SplitComponent,
        SplitAreaComponent
    ],
    templateUrl: './file-explorer.html',
    styleUrl: './file-explorer.css'
})
export class FileExplorer{
    explorerService: ExplorerService = inject(ExplorerService);
    messageService = inject(NzMessageService);
    //窗口程序id,用于获弹窗等阻塞主窗口
    @Input() winId!: string;
    // 当前实际所在的位置
    @Input()
    currentPath: string = ''; // 例如 "/home/user"
    // 处理文件打开
    @Output()
    fileOpen = new EventEmitter<LightFile>();
    // 用于处理多标签也文件浏览器
    @Output()
    titleChange = new EventEmitter<PropagateTitle>();
    private systemInfoService = inject(SystemInfoService);
    @Input()
    uuid: string | undefined;

    files: LightFile[] = [];

    drivers: DriverInfo[] = [];
    // 地址栏地址，不代表实际处于的位置
    navigatePath: string = "";
    parts: string[] = [];
    driverView: boolean = false;

    isLinux: boolean = false;

    editing: boolean = false;
    breadcrumbs: { name: string, path: string }[] = [];

    @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;

    async ngOnInit() {
        let input = this.currentPath;
        this.isLinux = await this.systemInfoService.isLinuxAsync();
        if(this.currentPath===''){
            if(this.isLinux){
                this.currentPath = "/";
            }else{
                this.currentPath = "/"
            }
            this.navigatePath = this.currentPath;
        }
        await this.tryNavigateToFolder(this.currentPath);
        this.history = [this.currentPath];
        this.historyIndex = 0;
        this.navigatePath = this.currentPath;
        this.TitleChange();
        this.buildBreadcrumbs();
    }
    // 传递
    TitleChange(){
        const title = generateTitle(this.currentPath, this.isLinux);
        this.titleChange.emit({
            fileExplorerId: this.uuid,
            title
        });

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
            // this.partPath();
            this.TitleChange();
            this.buildBreadcrumbs();

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
    private windowManagerService: WindowManagerService = inject(WindowManagerService);
    async onFileNavigate($event: LightFile) {
        if($event.isDirectory){
            this.navigatePath = $event.path;
            await this.tryNavigateToFolder($event.path);
        }else{
            // 打开文本型文件
            this.windowManagerService.openFile({
                name: $event.name,
                isFolder: false,
                size: $event.size,
            },{
                file: $event,
            })

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
    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (event.ctrlKey && event.key.toLowerCase() === ' ') {
            event.preventDefault();
            this.onCtrlNPressed();
        }
    }
    private store = inject(Store);

    private onCtrlNPressed() {
        console.log('onCtrlNPressed');
        this.store.dispatch(WindowActions.openWindow({
            id: fileExplorerProgram,
            title: '',
            params: {
                startPath: this.currentPath
            }
        }))
    }

    onRefreshRequest() {
        this.refresh();
    }
    showInfo() {

    }

    buildBreadcrumbs() {
        this.breadcrumbs = buildBreadcrumbsForPath(this.currentPath, this.isLinux);
    }

    onBreadcrumbClick(name: string,path: string, event?: MouseEvent) {
        if(name==='>'){
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
        event?.stopPropagation();
        this.editing = true;
        this.navigatePath = this.currentPath;
        // 等待下一宏任务后 focus
        Promise.resolve().then(() => {
            try {
                this.addressInput?.nativeElement?.focus();
                this.addressInput?.nativeElement?.select();
            } catch {}
        });
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
    clipboardState: ClipboardState | undefined;
    canPaste: boolean = false;
    constructor() {
        this.store.select(selectClipboardState).subscribe((state)=>{
            this.clipboardState = state;
            this.canPaste = this.clipboardState.operation != null;
        })
    }
    cutFile(){
        if (!this.selectedFiles.length) {
            return;
        }
        const paths = this.selectedFiles.map(f => f.path);
        this.store.dispatch(ClipboardActions.cutFiles({ files: paths }));
    }
    copyFile(){
        if (!this.selectedFiles.length) return;
        const paths = this.selectedFiles.map(f => f.path);
        this.store.dispatch(ClipboardActions.copyFiles({ files: paths }));
    }
    pasteFile(){
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
    deleteFile(){

    }
    selectedFiles: LightFile[] = [];
    onFileSelectChange($event: FileSelectChangedEvent) {
        this.selectedFiles = $event.files;
    }

    onFileAction($event: FileAction) {
        switch ($event.type){
            case 'copy':
                this.copyFile();
                break;
            case 'paste':
                this.pasteFile();
                break;
            case 'delete':
                this.deleteFile();
                break;
            case 'cut':
                this.cutFile();
                break;
        }
    }
}
