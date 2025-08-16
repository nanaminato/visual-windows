import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FileItem} from '../models';

@Component({
  selector: 'file-explorer',
  imports: [],
  templateUrl: './file-explorer.html',
  styleUrl: './file-explorer.css'
})
export class FileExplorer {
    @Input() currentPath = ''; // 例如 "/home/user"
    @Input() files: FileItem[] = [];

    @Output() pathChange = new EventEmitter<string>();
    @Output() fileOpen = new EventEmitter<FileItem>();
    ngOnInit() {
        if(this.currentPath) {

        }
    }
    i = 1;
    get pathParts(): string[] {
        if (!this.currentPath) return [''];
        return this.currentPath.split('/').filter(p => p.length > 0);
    }

    navigateTo(index: number) {
        const parts = this.pathParts.slice(0, index + 1);
        this.currentPath = '/' + parts.join('/');
        this.pathChange.emit(this.currentPath);
    }

    goUp() {
        const parts = this.pathParts;
        if (parts.length > 0) {
            parts.pop();
            this.currentPath = '/' + parts.join('/');
            this.pathChange.emit(this.currentPath);
        }
    }

    onItemClick(file: FileItem) {
        if (file.isDirectory) {
            this.currentPath = this.currentPath.endsWith('/') ? this.currentPath + file.name : this.currentPath + '/' + file.name;
            this.pathChange.emit(this.currentPath);
        } else {
            this.fileOpen.emit(file);
        }
    }
}
