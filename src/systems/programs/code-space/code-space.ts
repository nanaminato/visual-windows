import {
    Component,
    EventEmitter,
    inject,
    Input,
    Output,
    Renderer2,
} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ProgramEvent} from '../../models';
import {WinIcon} from '../../system-lives/win-icon/win-icon';
import {ProgramManagerService} from '../../system-services/impl/program-manager.service';
import {SplitPanel} from './split-panel/split-panel';
import {FolderRoot} from './folder-root/folder-root';
import {CodeFileNodeViewModel} from './models';
import {OpenFile} from './models/open-file';
import {CodeService, getIconPath} from './services';
import {EditorComponent} from 'ngx-monaco-editor-v2';
import {FormsModule} from '@angular/forms';
import {getFileLanguage} from './services';

@Component({
    selector: 'app-code-space',
    imports: [
        NzIconDirective,
        WinIcon,
        SplitPanel,
        FolderRoot,
        EditorComponent,
        FormsModule,
    ],
    providers: [

    ],
    standalone: true,
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
        if(this.startPath!==''){
            this.leftPanelVisible = true;
        }
    }
    leftPanelVisible: boolean = false;

    constructor(private renderer: Renderer2) {}

    editorVisible: boolean = true;
    parentSizeChange(){
        // alert('parentSizeChange');
        this.editorVisible = false;
        setTimeout(()=>{
            this.editorVisible = true;
        },20)
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
    codeService: CodeService = inject(CodeService);
    openFiles: OpenFile[] = [];

    activeOpenFile: OpenFile | undefined = undefined;

    async onFileOpen($event: CodeFileNodeViewModel) {
        let index = this.openFiles.findIndex(file => file.path === $event.path);
        if(index > -1){
            this.activeOpenFile = this.openFiles[index];
        }else{
            let openFile = await this.codeService.getCode($event.path);
            this.activeOpenFile = openFile;
            this.openFiles.push(openFile);
        }
        this.activeFile(this.activeOpenFile);
    }

    protected readonly getIconPath = getIconPath;
    editorOptions = {theme: 'vs-dark', language: 'javascript'};

    closeFile(openFile: OpenFile, $event: MouseEvent) {
        $event.preventDefault();
        $event.stopPropagation();
        this.openFiles = this.openFiles.filter(file => file.path !== openFile.path);
        if(this.openFiles.length > 0){
            this.activeFile(this.openFiles[0])
        }else{
            this.content = ''
        }
    }
    content: string = '';

    activeFile(openFile?: OpenFile) {
        if(openFile){
            this.activeOpenFile = openFile;
            this.editorOptions.language = getFileLanguage(openFile.name);
            this.content = openFile.content;

        }
    }
}
