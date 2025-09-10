import {Component, EventEmitter, Input, Output} from '@angular/core';
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
    private _baseFolder: string = '';

    @Input()
    set baseFolder(value: string) {
        this._baseFolder = value;
        this.updateFolderNode();
    }
    get baseFolder(): string {
        return this._baseFolder;
    }

    folderNode: CodeFileNodeViewModel | undefined;

    @Output()
    fileSelected = new EventEmitter<CodeFileNodeViewModel>();

    updateFolderNode() {
        this.folderNode = {
            name: this.getName(this._baseFolder),
            path: this._baseFolder,
            expandedWhenInit: true,
            deep: 0,
            isDirectory: true,
        };
    }

    onFileSelected(node: CodeFileNodeViewModel) {
        this.fileSelected.emit(node);
    }

    getName(path: string): string {
        let index = path.lastIndexOf('/');
        if (index > -1) {
            return path.substring(index + 1);
        } else {
            index = path.lastIndexOf('\\');
            if (index > -1) {
                return path.substring(index + 1);
            }
        }
        return '工作区';
    }
}
