import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {PropagateTitle} from '../multi-explorer/models';
import {SystemInfoService} from '../../../system-services/impl/info.service';
import {NzSplitterModule} from 'ng-zorro-antd/splitter';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzInputDirective, NzInputGroupComponent} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';
import {EntryRoot} from './entry-root/entry-root';
import {FileNodeViewModel} from './models';
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
        DriverListView
    ],
    templateUrl: './file-explorer.html',
    styleUrl: './file-explorer.css'
})
export class FileExplorer {
    explorerService: ExplorerService = inject(ExplorerService);
    messageService = inject(NzMessageService);
    // 当前实际所在的位置
    @Input()
    currentPath: string = ''; // 例如 "/home/user"
    @Output()
    pathChange = new EventEmitter<string>();
    // 处理文件打开
    @Output()
    fileOpen = new EventEmitter<LightFile>();
    // 用于处理多标签也文件浏览器
    @Output()
    titleChange = new EventEmitter<PropagateTitle>();
    private systemInfoService = inject(SystemInfoService);
    @Input()
    uuid: string | undefined;

    @Input()
    files: LightFile[] = [];

    drivers: DriverInfo[] = [];
    // 地址栏地址，不代表实际处于的位置
    navigatePath: string = "";
    parts: string[] = [];
    driverView: boolean = false;

    isLinux: boolean = false;
    async ngOnInit() {
        this.isLinux = await this.systemInfoService.isLinuxAsync();
        if(this.currentPath===''){
            if(this.isLinux){
                this.currentPath = "/";
            }else{
                this.currentPath = "/"
            }
            this.navigatePath = this.currentPath;
        }
        this.history = [this.currentPath];
        this.historyIndex = 0;
        this.navigatePath = this.currentPath;
        this.partPath();
        this.TitleChange()
    }
    partPath() {
        if (!this.currentPath){
            this.parts = ['']
        }
        this.parts = this.currentPath.split('\\').filter(p => p.length > 0);
    }
    // 传递
    TitleChange(){
        this.pathChange.emit(this.currentPath);
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
            this.partPath();
            this.TitleChange();

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

    async onFileNavigate($event: LightFile) {
        if($event.isDirectory){
            this.navigatePath = $event.path;
            await this.tryNavigateToFolder($event.path);
        }else{
            //todo 调用文件关联程序打开
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


}
