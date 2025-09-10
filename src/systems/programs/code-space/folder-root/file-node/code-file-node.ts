import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ExplorerService} from '../../../file-explorer/explorer/services/explorer.service';
import {CodeFileNodeViewModel} from '../../models';
import {getIconPath} from '../../services';

@Component({
  selector: 'app-code-file-node',
    imports: [
        NzIconDirective
    ],
  templateUrl: './code-file-node.html',
  styleUrl: './code-file-node.css'
})
export class CodeFileNode {
    explorerService: ExplorerService = inject(ExplorerService);

    private _fileNode: CodeFileNodeViewModel | undefined;

    @Input()
    set fileNode(value: CodeFileNodeViewModel | undefined) {
        this._fileNode = value;
        this.resetAndLoad();
    }
    get fileNode() {
        return this._fileNode;
    }

    expanded: boolean = false;
    children: CodeFileNodeViewModel[] = [];
    loaded: boolean = false;
    noChild: boolean = false;

    @Output()
    nodeClicked = new EventEmitter<CodeFileNodeViewModel>();

    private resetAndLoad() {
        this.expanded = false;
        this.children = [];
        this.loaded = false;
        this.noChild = false;

        if (this.fileNode?.expandedWhenInit) {
            this.expandChildren();
            console.log('expanded');
        }
    }

    async expandChildren() {
        this.expanded = !this.expanded;
        if (this.loaded) return;

        this.children.length = 0;
        let easyFolder = await this.explorerService.getFiles(this.fileNode!.path);
        if (easyFolder.length === 0) {
            this.noChild = true;
        }
        easyFolder.forEach(folder => {
            console.log(folder);
            this.children.push({
                name: folder.name,
                path: folder.path,
                isDirectory: folder.isDirectory,
                expandedWhenInit: false,
                deep: this.fileNode!.deep + 1,
            });
        });
        this.loaded = true;
    }

    onNodeClick() {
        if (this.fileNode!.isDirectory) {
            this.expandChildren();
        } else {
            this.nodeClicked.emit(this.fileNode);
        }
    }

    getIconPath() {
        if (this.fileNode) {
            return getIconPath(this.fileNode.name);
        }
        return 'assets/icons/code-space/languages/text.svg';
    }
}
