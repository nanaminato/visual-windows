import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {FileItem} from '../models';
import {PropagateTitle} from '../multi-explorer/models';
import {SystemInfoService} from '../../../system-services/impl/info.service';
import {NzSplitterModule} from 'ng-zorro-antd/splitter';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzInputDirective, NzInputGroupComponent} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'file-explorer',
    imports: [
        NzSplitterModule,
        NzIconDirective,
        NzInputGroupComponent,
        NzInputDirective,
        FormsModule
    ],
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

    navigatePath: string = "";
    parts: string[] = [];

    constructor() {

    }
    async ngOnInit() {
        if(this.currentPath===''){
            if(await this.systemInfoService.isLinuxAsync()){
                this.currentPath = "/";
            }else{
                this.currentPath = "c://"
            }
            this.navigatePath = this.currentPath;
        }
        this.propagatePathChange()
    }
    partPath() {
        if (!this.currentPath){
            this.parts = ['']
        }
        this.parts = this.currentPath.split('/').filter(p => p.length > 0);
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


}
