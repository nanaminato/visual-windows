import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FileExplorer} from "../file-explorer/explorer/file-explorer";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ProgramEvent} from '../../models';
import {WinIcon} from '../../system-lives/win-icon/win-icon';

@Component({
  selector: 'app-code-space',
    imports: [
        NzIconDirective,
        WinIcon
    ],
  templateUrl: './code-space.html',
  styleUrl: './code-space.css'
})
export class CodeSpace {
    @Input()
    id: string | undefined;
    @Input()
    active: boolean | undefined;
    @Input()
    startPath: string = "";

    @Input()
    startFile: string = "";
    async ngOnInit() {

    }

    @Output()
    appEventEmitter: EventEmitter<ProgramEvent> = new EventEmitter<ProgramEvent>();
    minimizeWindow() {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 2,
            id: this.id,
            event: 'minimizeWindow'
        });
    }

    maximizeWindow() {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 3,
            id: this.id,
            event: 'maximizeWindow'
        })
    }

    closeWindow() {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 4,
            id: this.id,
            event: 'closeWindow'
        });
    }

    startDrag($event: MouseEvent) {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 5,
            id: this.id,
            event: $event
        });
    }

    getIcon() {
        return undefined;
    }
}
