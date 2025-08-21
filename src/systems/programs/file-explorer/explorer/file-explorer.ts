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

    navigatePath: string = "";
    parts: string[] = [];
    driverView: boolean = false;

    constructor() {

    }
    async ngOnInit() {
        if(this.currentPath===''){
            if(await this.systemInfoService.isLinuxAsync()){
                this.currentPath = "/";
            }else{
                this.currentPath = "/"
            }
            this.navigatePath = this.currentPath;
        }
        this.propagatePathChange()
    }
    partPath() {
        if (!this.currentPath){
            this.parts = ['']
        }
        this.parts = this.currentPath.split('\\').filter(p => p.length > 0);
    }

    propagatePathChange(){
        this.pathChange.emit(this.currentPath);
        let left = this.currentPath.lastIndexOf('/');
        if(left===-1){
            let right = this.currentPath.lastIndexOf('\\');
            this.titleChange.emit({
                fileExplorerId: this.uuid,
                title: this.currentPath.substring(right)
            });
        }else{
            this.titleChange.emit(
                {
                    fileExplorerId: this.uuid,
                    title: this.currentPath.substring(left)
                });
        }
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
    async tryNavigateToFolder(path: string) {
        try {
            if(path==='/'&&!(await this.systemInfoService.isLinuxAsync())){
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
}
