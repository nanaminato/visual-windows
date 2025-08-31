import {
    Component,
    EventEmitter, HostListener,
    inject,
    Input,
    Output,
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
import {selectProgramConfigs} from '../../system-services/state/system/system.selector';
import {LightFile} from '../file-explorer/explorer/models';

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
    startFolder: string = "";
    @Input()
    params: LightFile | undefined;

    @Input()
    startFile: string = "";
    async ngOnInit() {
        if(this.params){
            if(this.params.isDirectory){
                this.startFolder = this.params.path;
            }else{
                this.startFile = this.params.path;
            }
        }

        this.programConfigs$.subscribe(ws => {
            this.programConfigs = ws;
        })
    }
    async ngAfterViewInit() {
        if(this.startFolder!==''){
            this.leftPanelVisible = true;
        }else if(this.startFile!==''){
            await this.onFileOpen({
                name: 'any',
                path: this.startFile,
                deep: 0,
                expandedWhenInit: false,
                isDirectory: false,
            })
        }
        this.editorVisible = true;
    }
    leftPanelVisible: boolean = false;

    editorVisible: boolean = false;
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
        },0)
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
    touchDrag($event: TouchEvent) {
        if(!this.id){
            return;
        }
        this.appEventEmitter.emit({
            type: 7,
            id: this.id,
            event: $event
        });
    }
    private store = inject(Store);
    programConfigs$ = this.store.select(selectProgramConfigs);
    programConfigs : ProgramConfig[] | undefined;
    getIcon() {
        return this.programConfigs?.find(p=>p.programId==='code-space');
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
            try{
                let openFile = await this.codeService.getCode($event.path);
                this.activeOpenFile = openFile;
                this.openFiles.push(openFile);
                if(this.openFiles.length === 1){
                    this.monacoEditorViewUpdate()
                }
                this.activeFile(this.activeOpenFile);
            }catch(err){
                console.log(err);
            }
        }
    }

    protected readonly getIconPath = getIconPath;
    editorOptions = {theme: 'vs-light', language: 'javascript'};
    content: string = '';

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
    contextMenuVisible: boolean = false;
    contextMenuPosition = {x: 0, y: 0};
    contextMenuFile: OpenFile | undefined =undefined;

    onContextMenu(event: MouseEvent, openFile: OpenFile) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuFile = openFile;
        this.contextMenuPosition = {x: event.clientX, y: event.clientY};
        this.contextMenuVisible = true;
    }

    // 关闭当前文件
    closeFile(openFile: OpenFile | undefined, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuVisible = false;

        this.openFiles = this.openFiles.filter(file => file.path !== openFile!.path);

        if(this.openFiles.length > 0){
            if(this.activeOpenFile?.path === openFile!.path){
                this.activeFile(this.openFiles[0]);
            }
        }else{
            this.activeOpenFile = undefined;
            this.content = '';
        }
    }

    // 关闭其他标签页
    closeOtherFiles(openFile: OpenFile | undefined, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuVisible = false;

        this.openFiles = this.openFiles.filter(file => file.path === openFile!.path);
        this.activeFile(openFile!);
    }

    // 关闭所有标签页
    closeAllFiles(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuVisible = false;

        this.openFiles = [];
        this.activeOpenFile = undefined;
        this.content = '';
    }

    // 点击空白处关闭菜单
    constructor() {
        document.addEventListener('click', () => {
            if(this.contextMenuVisible){
                this.contextMenuVisible = false;
            }
        });
    }
}
