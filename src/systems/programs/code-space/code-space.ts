import {Component, EventEmitter, HostListener, inject, Input, Output,} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ProgramConfig, ProgramEvent} from '../../models';
import {WinIcon} from '../../system-lives/win-icon/win-icon';
import {FolderRoot} from './folder-root/folder-root';
import {CodeFileNodeViewModel, OpenFile} from './models';
import {CodeService, getFileLanguage, getIconPath} from './services';
import {EditorComponent} from 'ngx-monaco-editor-v2';
import {FormsModule} from '@angular/forms';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {CommonModule} from '@angular/common';
import {Store} from '@ngrx/store';
import {selectProgramConfigs} from '../../system-services/state/system/system.selector';
import {LightFile} from '../file-explorer/explorer/models';
import {codeSpaceProgram} from '../models/register-app';
import {v4 as uuid} from 'uuid';
import {WindowActions} from '../../system-services/state/window/window.actions';
import {filter, Subscription, take} from 'rxjs';
import {Actions, ofType} from '@ngrx/effects';
import {filePickerCancel, filePickerConfirm} from '../../system-services/state/system/file/file-picker.actions';
import {NzMessageService} from 'ng-zorro-antd/message';
import {processSizeChange} from '../../system-lives/window-live/adapter';

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
export class CodeSpace implements processSizeChange {
    @Input()
    id: string | undefined;
    @Input()
    active: boolean | undefined;
    @Input()
    startFolder: string = "";
    @Input()
    file: LightFile | undefined;

    @Input()
    startFile: string = "";
    async ngOnInit() {
        if(this.file){
            if(this.file.isDirectory){
                this.startFolder = this.file.path;
            }else{
                this.startFile = this.file.path;
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
        return this.programConfigs?.find(p=>p.programId===codeSpaceProgram);
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
            this.content = openFile.decodeText??'';
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
    store$ = inject(Store);
    private actions$ = inject(Actions);
    private filePickerSub?: Subscription;
    private messageService = inject(NzMessageService);
    selectFileAndOpen(selectFolder: boolean = false){
        if (this.filePickerSub) {
            this.filePickerSub.unsubscribe();
        }
        const requestId = uuid();
        this.store$.dispatch(

            WindowActions.openWindow(
                {
                    id: "file-picker",
                    title: "文件选择器",
                    parentId: this.id,
                    modal: true,
                    params: {
                        config: {
                            startPath: 'D:\\WebstormProjects\\Remote-File-Manager',
                            selectFolders: selectFolder,
                            multiSelect: true,
                            // multiSelect: false,
                            // multiSelect: !selectFolder,
                            // maxSelectCount: 1,
                            requestId:requestId,
                            mode: 'selector',
                            // mode: 'save',
                            fileExtensions: [
                                // '.txt','.json'
                            ]
                        }
                    }
                }
            )
        );
        this.filePickerSub = this.actions$.pipe(
            ofType(filePickerConfirm, filePickerCancel),
            filter(action => action.requestId === requestId), // 只监听当前请求ID
            take(1) // 只监听一次
        ).subscribe(action => {
            if (action.type === filePickerConfirm.type) {
                if(selectFolder){
                    let files = action.selectedPaths;
                    if(files && files.length > 0){
                        if(this.startFolder===''){
                            this.leftPanelVisible = true;
                        }
                        this.startFolder = files[0];
                        console.log(this.startFolder);
                    }else{
                        this.messageService.error(`发生了错误`)
                    }
                }else{
                    let files = action.selectedPaths;
                    files.forEach(file => {
                        this.openFileFromPath(file);
                    })
                }
            } else {
                this.messageService.info(`用户取消了选择文件`);
                // 这里处理取消逻辑
            }
            // 监听完成后自动取消订阅（take(1) 会自动完成）
            this.filePickerSub = undefined;
        });

    }
    async openFileFromPath(path: string) {
        let index = this.openFiles.findIndex(file => file.path === path);
        if (index > -1) {
            this.activeOpenFile = this.openFiles[index];
        } else {
            try {
                let openFile = await this.codeService.getCode(path);
                this.activeOpenFile = openFile;
                this.openFiles.push(openFile);
                if (this.openFiles.length === 1) {
                    this.monacoEditorViewUpdate();
                }
                this.activeFile(this.activeOpenFile);
            } catch (err) {
                console.log(err);
            }
        }
    }
    // 点击空白处关闭菜单
    constructor() {
        document.addEventListener('click', () => {
            if(this.contextMenuVisible){
                this.contextMenuVisible = false;
            }
        });
    }
    fileMenuVisible = false;

    toggleFileMenu() {
        this.fileMenuVisible = !this.fileMenuVisible;
    }

    openFile() {
        this.selectFileAndOpen()
    }

    openFolder() {
        this.selectFileAndOpen(true)
    }

    exit() {
        this.closeWindow();
    }

    closeFileMenu() {
        this.fileMenuVisible = false;
    }
}
