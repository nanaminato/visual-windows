import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FileExplorer} from "../explorer/file-explorer"
import {LightFile} from '../explorer/models';

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
    @Input() files: LightFile[] = [];

    @Output() cancel = new EventEmitter<void>();
    @Output() confirm = new EventEmitter<LightFile>();

    selectedItem?: LightFile;

    onPathChange(newPath: string) {
        this.currentPath = newPath;
        this.selectedItem = undefined;
    }

    onFileOpen(file: LightFile) {
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
