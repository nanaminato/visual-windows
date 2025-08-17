import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {FileItem} from '../models';
import {PropagateTitle} from '../multi-explorer/models';
import {SystemInfoService} from '../../../system-services/impl/info.service';

@Component({
  selector: 'file-explorer',
  imports: [],
  templateUrl: './file-explorer.html',
  styleUrl: './file-explorer.css'
})
export class FileExplorer {
    @Input()
    currentPath: string = ''; // 例如 "/home/user"
    @Input()
    files: FileItem[] = [];
    // 用于处理文件选择
    @Output()
    pathChange = new EventEmitter<string>();
    // 处理文件打开
    @Output()
    fileOpen = new EventEmitter<FileItem>();
    // 用于处理多标签也文件浏览器
    @Output()
    titleChange = new EventEmitter<PropagateTitle>();
    private systemInfoService = inject(SystemInfoService);
    @Input()
    uuid: string | undefined;
    constructor() {

    }
    async ngOnInit() {
        if(this.currentPath===''){
            if(await this.systemInfoService.isLinuxAsync()){
                this.currentPath = "/";
            }else{
                this.currentPath = "c://"
            }
        }
        this.propagatePathChange()
    }
    get pathParts(): string[] {
        if (!this.currentPath) return [''];
        return this.currentPath.split('/').filter(p => p.length > 0);
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


}
