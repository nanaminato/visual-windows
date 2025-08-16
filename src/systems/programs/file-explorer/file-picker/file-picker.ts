import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FileItem} from '../models';
import {FileExplorer} from "../explorer/file-explorer"

@Component({
  selector: 'app-file-picker',
    imports: [
        FileExplorer
    ],
  templateUrl: './file-picker.html',
  styleUrl: './file-picker.css'
})
export class FilePicker {
    @Input() selectFolder = false;
    @Input() currentPath = '';
    @Input() files: FileItem[] = [];

    @Output() cancel = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<FileItem>();

    selectedItem?: FileItem;

    onPathChange(newPath: string) {
        this.currentPath = newPath;
        this.selectedItem = undefined;
    }

    onFileOpen(file: FileItem) {
        if (this.selectFolder && file.isDirectory) {
            this.selectedItem = file;
        } else if (!this.selectFolder && !file.isDirectory) {
            this.selectedItem = file;
        }
    }

    onCancel() {
        this.cancel.emit();
    }

    onConfirm() {
        if (this.selectedItem) {
            this.confirm.emit(this.selectedItem);
        }
    }
}
