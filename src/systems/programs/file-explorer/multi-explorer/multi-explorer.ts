import {Component, inject, Input} from '@angular/core';
import {FileExplorer} from '../explorer/file-explorer';
import {NzTabsModule} from 'ng-zorro-antd/tabs';
import {FileExplorerInit, PropagateTitle} from './models';
import {v4 as uuid} from 'uuid';
import {SystemInfoService} from '../../../system-services/impl/info.service';
import {SystemInfo} from '../../../models';
@Component({
  selector: 'app-multi-explorer',
    imports: [
        FileExplorer,
        NzTabsModule
    ],
  templateUrl: './multi-explorer.html',
  styleUrl: './multi-explorer.css'
})
export class MultiExplorer {
    @Input()
    startPath: string = "";
    fileExplorers: FileExplorerInit[] = [];
    selectedIndex: number = 0;
    constructor() {

    }
    private systemInfoService = inject(SystemInfoService);
    systemInfo: SystemInfo | undefined = undefined;
    // 初始化，打开一个文件浏览器tab页
    async ngOnInit() {
        this.openFileExplorer(this.startPath);
        this.systemInfo = await this.systemInfoService.getInfo();
    }
    openFileExplorer(path: string) {
        this.fileExplorers.push({
            fileExplorerId: uuid(),
            initPath: path,
            title: ""
        });
    }
    openNewFileExplorer() {
        this.openFileExplorer('');
        this.selectedIndex = this.fileExplorers.length - 1;
    }

    closeTab({index}: { index: number }) {
        this.fileExplorers.splice(index, 1);
    }

    handleTitleChange($event: PropagateTitle) {
        let ele = this.fileExplorers.find(f=>f.fileExplorerId===$event.fileExplorerId);
        if (ele) {
            ele.title = $event.title;
        }
        console.log(ele?.title);
    }

    getTitle(fileExplorer: FileExplorerInit) {
        if(fileExplorer.title==="/"){
            return this.systemInfo?.platform+"";
        }
        return fileExplorer.title;
    }
}
