import {Component, EventEmitter, inject, Input, Output} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ExplorerService} from '../../../file-explorer/explorer/services/explorer.service';
import {CodeFileNodeViewModel} from '../../models';

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
    @Input()
    fileNode: CodeFileNodeViewModel| undefined;
    expanded: boolean = false;
    children: CodeFileNodeViewModel[] = [];
    loaded: boolean = false;
    noChild: boolean = false;

    @Output() nodeClicked = new EventEmitter<CodeFileNodeViewModel>();
    onNodeClick() {
        if(this.fileNode!.isDirectory) {
            this.expandChildren()
        }else{
            this.nodeClicked.emit(this.fileNode);
        }

    }
    constructor() {

    }
    async ngOnInit() {
        if(this.fileNode?.expandedWhenInit) {
            this.expandChildren();
        }
    }
    async expandChildren(){
        this.expanded = !this.expanded;
        if(this.loaded) return;
        this.children.length = 0;
        let easyFolder = await this.explorerService.getFiles(this.fileNode!.path);
        if(easyFolder.length === 0){
            this.noChild = true;
        }
        easyFolder.forEach(folder => {
            this.children.push({
                name: folder.name,
                path: folder.path,
                isDirectory: folder.isDirectory,
                expandedWhenInit: false,
                deep: this.fileNode!.deep+1,
            })
        })
        this.loaded = true;
    }

    getIconPath() {
        if (this.fileNode) {
            const name = this.fileNode.name;
            const index = name.lastIndexOf('.');
            if (index > -1) {
                const ext = name.substring(index + 1).toLowerCase();

                // Map<图标文件名, 后缀数组>
                const map: Map<string, string[]> = new Map([
                    ['java.svg', ['java']],
                    ['ts.svg', ['ts']],
                    ['js.svg', ['js']],
                    ['py.svg', ['py']],
                    ['text.svg', ['txt']],
                    ['md.svg', ['md']],
                    ['html.svg', ['html', 'htm']],
                    ['css.svg', ['css',"sass","less"]],
                    ['json.svg', ['json']],
                    ['xml.svg', ['xml']],
                    ['image.svg', ['jpg', 'jpeg', 'svg', 'gif','png']],
                    // 继续补充
                ]);

                for (const [icon, exts] of map.entries()) {
                    if (exts.includes(ext)) {
                        return `assets/icons/code-space/languages/${icon}`;
                    }
                }
            }
        }
        return 'assets/icons/code-space/languages/text.svg';
    }


}
