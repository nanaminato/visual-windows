import {
    Component,
    EventEmitter, HostListener,
    inject,
    Input,
    Output,
    Renderer2,
} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ProgramConfig, ProgramEvent} from '../../models';
import {WinIcon} from '../../system-lives/win-icon/win-icon';
import {FolderRoot} from './folder-root/folder-root';
import {CodeFileNodeViewModel} from './models';
import {OpenFile} from './models';
import {CodeService, getIconPath} from './services';
import {EditorComponent} from 'ngx-monaco-editor-v2';
import {FormsModule} from '@angular/forms';
import {getFileLanguage} from './services';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {CommonModule} from '@angular/common';
import {Store} from '@ngrx/store';
import {selectProgramConfigs} from '../../system-services/state/program-config/program-config.selector';

@Component({
    selector: 'app-code-space',
    imports: [
        NzIconDirective,
        WinIcon,
        FolderRoot,
        EditorComponent,
        FormsModule,
        SplitAreaComponent,
        SplitComponent,
        CommonModule
    ],
    providers: [

    ],
    standalone: true,
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
        if(this.startPath!==''){
            this.leftPanelVisible = true;
        }
        this.programConfigs$.subscribe(ws => {
            this.programConfigs = ws;
        })
    }
    leftPanelVisible: boolean = false;

    constructor(private renderer: Renderer2) {}

    editorVisible: boolean = true;
    @HostListener('window:resize', ['$event'])
    sizeChanged($event: any): void {
        this.monacoEditorViewUpdate()
    }
    parentSizeChange(): void {
        this.monacoEditorViewUpdate()
    }
    monacoEditorViewUpdate(){
        this.editorVisible = false;
        setTimeout(()=>{
            this.editorVisible = true;
        },1)
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
    private store = inject(Store);
    programConfigs$ = this.store.select(selectProgramConfigs);
    programConfigs : ProgramConfig[] | undefined;
    getIcon() {
        return this.programConfigs?.find(p=>p.programId==='code space');
    }

    changePanelVisibleStatus() {
        this.leftPanelVisible = !this.leftPanelVisible;
        this.monacoEditorViewUpdate()
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
            if(this.openFiles.length === 1){
                this.monacoEditorViewUpdate()
            }
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
    // leftPanelPercent: number = 26;
    // rightPanelPercent: number = 74;

    activeFile(openFile?: OpenFile) {
        if(openFile){
            this.activeOpenFile = openFile;
            let oldLanguage = this.editorOptions.language;
            this.editorOptions.language = getFileLanguage(openFile.name);
            this.content = openFile.content;
            if(this.editorOptions.language !== oldLanguage){
                this.monacoEditorViewUpdate();
            }

        }
    }
}
