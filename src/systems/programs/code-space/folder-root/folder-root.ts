import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {ExplorerService} from '../../file-explorer/explorer/services/explorer.service';
import {FileNodeViewModel} from '../../file-explorer/explorer/models';
import {SystemInfoService} from '../../../system-services/impl/info.service';
import {CodeFileNode} from './file-node/code-file-node';
import {CodeFileNodeViewModel} from '../models';

@Component({
  selector: 'app-folder-root',
    imports: [
        CodeFileNode
    ],
  templateUrl: './folder-root.html',
  styleUrl: './folder-root.css'
})
export class FolderRoot {
    @Input()
    baseFolder: string = '';
    folderNode: CodeFileNodeViewModel | undefined;
    constructor() {

    }
    async ngOnInit() {
        this.folderNode = {
            name: this.getName(this.baseFolder),
            path: this.baseFolder,
            expandedWhenInit: true,
            deep: 0,
            isDirectory: true,
        }
    }
    @Output()
    fileSelected = new EventEmitter<CodeFileNodeViewModel>();

    onFileSelected(node: CodeFileNodeViewModel) {
        this.fileSelected.emit(node);
    }
    getName(path: string): string {
        let index = path.lastIndexOf('/');
        if (index > -1) {
            return path.substring(index+1);
        }else{
            index = path.lastIndexOf('\\');
            if(index > -1){
                return path.substring(index+1);
            }
        }
        return '工作区';
    }
}
