import {Component, EventEmitter, inject, Output} from '@angular/core';
import {ExplorerService} from '../services/explorer.service';
import {FileNodeViewModel} from '../models/file-node-vm';
import {FileNode} from './file-node/file-node';
import {SystemInfoService} from '../../../../system-services/impl/info.service';

@Component({
  selector: 'app-entry-root',
    imports: [
        FileNode
    ],
  templateUrl: './entry-root.html',
  styleUrl: './entry-root.css'
})
export class EntryRoot {
    explorerService = inject(ExplorerService);
    specialFolder: Map<string, string|undefined> = new Map<string, string|undefined>();
    computer: FileNodeViewModel | undefined;
    desktop: FileNodeViewModel | undefined;
    documents: FileNodeViewModel | undefined;
    downloads: FileNodeViewModel | undefined;
    music: FileNodeViewModel | undefined;
    pictures: FileNodeViewModel | undefined;
    videos: FileNodeViewModel | undefined;
    systemInfoService: SystemInfoService = inject(SystemInfoService);
    constructor() {

    }
    async ngOnInit() {
        this.computer = {
            name: '',
            path: '/',
            expandedWhenInit: !await this.systemInfoService.isLinuxAsync(),
            deep: 0,
            isDriverDisk: true,
        }
        this.explorerService.getSpecialFolder().then((specialFolder) => {
            this.specialFolder = specialFolder;
            const folderNames = ["Desktop", "Documents", "Downloads", "Music", "Pictures", "Videos"];
            folderNames.forEach(name => {
                let path = this.specialFolder.get(name);
                if (path !== undefined) {
                    // @ts-ignore
                    this[name.toLowerCase()] = {
                        name: name,
                        path: path,
                        isDriverDisk: false,
                        deep: 0,
                        expandedWhenInit: false,
                    }
                }
            });

        })
    }
    @Output()
    folderSelected = new EventEmitter<FileNodeViewModel>();
    onFolderSelected(node: FileNodeViewModel) {
        this.folderSelected.emit(node);
    }
}
