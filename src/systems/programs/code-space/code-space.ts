import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    inject,
    Input,
    Output,
    Renderer2, ViewChild,
    ViewChildren
} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ProgramEvent} from '../../models';
import {WinIcon} from '../../system-lives/win-icon/win-icon';
import {ProgramManagerService} from '../../system-services/impl/program-manager.service';
import {SplitPanel} from './split-panel/split-panel';

@Component({
  selector: 'app-code-space',
    imports: [
        NzIconDirective,
        WinIcon,
        SplitPanel
    ],
  templateUrl: './code-space.html',
  styleUrl: './code-space.css'
})
export class CodeSpace {
    programManagerService: ProgramManagerService = inject(ProgramManagerService);
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
    leftPanelVisible: boolean = true;

    constructor(private renderer: Renderer2) {}
    parentSizeChange(){

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
        return this.programManagerService.getProgramConfig('code-space');
    }

    changePanelVisibleStatus() {
        this.leftPanelVisible = !this.leftPanelVisible;
    }

}
