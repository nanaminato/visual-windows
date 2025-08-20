import {Component, inject, Input} from '@angular/core';
import {FileNodeViewModel} from '../../models/file-node-vm';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {ExplorerService} from '../../services/explorer.service';

@Component({
  selector: 'app-file-node',
    imports: [
        NzIconDirective
    ],
  templateUrl: './file-node.html',
  styleUrl: './file-node.css'
})
export class FileNode {
    explorerService: ExplorerService = inject(ExplorerService);
    @Input()
    fileNode: FileNodeViewModel | undefined;
    expanded: boolean = false;
    children: FileNodeViewModel[] = [];
    loaded: boolean = false;
    noChild: boolean = false;

    constructor() {

    }
    ngOnInit() {
        if(this.fileNode?.expandedWhenInit) {
            this.expandChildren();
        }
    }
    async expandChildren(){
        this.expanded = !this.expanded;
        if(this.loaded) return;
        this.children.length = 0;
        if(this.fileNode?.path==='/'){
            let easyFolder = await this.explorerService.getDisks();
            if(easyFolder.length === 0){
                this.noChild = true;
            }
            easyFolder.forEach(folder => {
                this.children.push({
                    name: this.getNameFromDisk(folder),
                    path: folder,
                    isDriverDisk: true,
                    expandedWhenInit: false,
                    deep: this.fileNode!.deep+1
                });
            })
        }else{
            let easyFolder = await this.explorerService.getChildrenFolder(this.fileNode!.path);
            if(easyFolder.length === 0){
                this.noChild = true;
            }
            easyFolder.forEach(folder => {
                this.children.push({
                    name: folder.name,
                    path: folder.path,
                    isDriverDisk: false,
                    expandedWhenInit: false,
                    deep: this.fileNode!.deep+1
                })
            })
        }
        this.loaded = true;
    }
    getNameFromDisk(path: string) {
        let index = path.lastIndexOf(':');
        if(index > -1) {
            return path.substring(0,index);
        }
        return path;
    }
}
