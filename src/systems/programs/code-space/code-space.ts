import {Component, EventEmitter, HostListener, inject, Input, Output,} from '@angular/core';
import {NzIconDirective} from "ng-zorro-antd/icon";
import {ProgramConfig, ProgramEvent} from '../../models';
import {WinIcon} from '../../system-lives/win-icon/win-icon';
import {FolderRoot} from './folder-root/folder-root';
import {CodeFileNodeViewModel, CodeSpaceTab} from './models';
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
import {CodeSpaceSettings} from './code-space-settings/code-space-settings';
import {CodeSpaceSettingsModel} from './code-space-settings/models/theme';
import {Program} from '../../system-lives/window-live/adapter';
import {SystemInfoService} from '../../system-services/info.service';

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
        CommonModule,
        CodeSpaceSettings
    ],
    providers: [

    ],
    standalone: true,
    templateUrl: './code-space.html',
    styleUrl: './code-space.css'
})
export class CodeSpace extends Program implements processSizeChange {
    @Input()
    active: boolean | undefined;
    @Input()
    startFolder: string = "";
    @Input()
    file: LightFile | undefined;

    @Input()
    startFile: string = "";
    systemInfoService = inject(SystemInfoService);
    async ngAfterViewInit() {
        this.isLinux = await this.systemInfoService.isLinuxAsync();
        this.loadSettingsFromStorage();
        if(this.file){
            if(this.file.isDirectory){
                this.startFolder = this.file.path;
            }else{
                this.startFile = this.file.path;
            }
        }
        this.programConfigs$.pipe(
            take(1)
        ).subscribe(ws => {
            this.programConfigs = ws;
        });
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
        this.panelResizeControl = true;
        this.loaded();
    }
    leftPanelVisible: boolean = false;

    panelResizeControl: boolean = false;
    showFile: boolean = true;
    @HostListener('window:resize', ['$event'])
    sizeChanged($event: any): void {
        this.monacoEditorViewUpdate()
    }
    parentSizeChange(): void {
        this.monacoEditorViewUpdate()
    }
    monacoEditorViewUpdate(){
        this.panelResizeControl = false;
        setTimeout(()=>{
            this.panelResizeControl = true;
            // console.log('setting to ture')
        },0)
    }



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
    openedTabs: CodeSpaceTab[] = [];

    activatedTab: CodeSpaceTab | undefined = undefined;

    async onFileOpen($event: CodeFileNodeViewModel) {
        let index = this.openedTabs.findIndex(
            tab => tab.type ==='file' && tab.file!.path === $event.path);
        if(index > -1){
            this.activatedTab = this.openedTabs[index];
        }else{
            try{
                let openFile = await this.codeService.getCode($event.path);
                let tab: CodeSpaceTab = {
                    type: 'file',
                    name: openFile.name,
                    file: openFile,
                }
                this.activatedTab = tab;
                this.openedTabs.push(tab);
                if(this.openedTabs.length === 1){
                    this.monacoEditorViewUpdate()
                }
                this.activeTab(this.activatedTab);
                // this.messageService.success("打开文件成功")
            }catch(err){
                this.messageService.error('打开文件失败')
                // console.log(err);
            }
        }
    }

    protected readonly getIconPath = getIconPath;
    editorOptions = {theme: 'vs-light', language: 'javascript',fontSize: 16};
    content: string = '';
    private readonly storageKey = 'code_space_settings';
    onSettingChange(settings: CodeSpaceSettingsModel) {
        if (settings.theme) {
            this.editorOptions.theme = settings.theme;
        }
        if(settings.fontSize) {
            this.editorOptions.fontSize = settings.fontSize;
        }
        // 这里可触发编辑器重新渲染/应用配置的逻辑
        this.applyEditorOptions();
    }
    private applyEditorOptions() {
        // console.log('应用 editorOptions:', this.editorOptions);
    }
    private loadSettingsFromStorage(): void {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return;

            const parsed = JSON.parse(raw) as CodeSpaceSettingsModel;
            if (parsed.theme) {
                this.editorOptions.theme = parsed.theme;
            }
        } catch (e) {
            // 读取或解析失败，保留默认 editorOptions
            console.warn('读取 code space 设置失败，使用默认配置：', e);
        }

        // 根据读到的配置应用到编辑器
        this.applyEditorOptions();
    }

    activeTab(tab?: CodeSpaceTab) {
        if(tab){
            this.activatedTab = tab;
            if(tab.type === 'file'){
                let oldLanguage = this.editorOptions.language;
                this.editorOptions.language = getFileLanguage(tab.file!.name);
                this.content = tab.file!.decodeText??'';
                if(this.editorOptions.language !== oldLanguage){
                    this.monacoEditorViewUpdate();
                }
                this.showFile = true;
            }else if(tab.type==='setting'){
                this.showFile = false;
            }


        }
    }
    contextMenuVisible: boolean = false;
    contextMenuPosition = {x: 0, y: 0};
    contextMenuTab: CodeSpaceTab | undefined =undefined;

    onContextMenu(event: MouseEvent, tab: CodeSpaceTab) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuTab = tab;
        this.contextMenuPosition = {x: event.clientX, y: event.clientY};
        this.contextMenuVisible = true;
    }

    // 关闭当前文件
    closeTab(tab: CodeSpaceTab| undefined, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuVisible = false;

        this.openedTabs = this.openedTabs.filter(t => t.type !== tab?.type || t.file?.path!==tab?.file?.path);

        if(this.openedTabs.length > 0){
            if(this.activatedTab?.type === tab?.type || this.activatedTab?.file?.path===tab?.file?.path){
                this.activeTab(this.openedTabs[0]);
            }
        }else{
            this.activatedTab = undefined;
            this.content = '';
        }
    }

    // 关闭其他标签页
    closeOtherTab(tab: CodeSpaceTab| undefined, event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuVisible = false;

        this.openedTabs = this.openedTabs.filter(t => t.type === tab?.type && t.file?.path===tab?.file?.path);
        this.activeTab(tab!);
    }

    // 关闭所有标签页
    closeAllTab(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        this.contextMenuVisible = false;

        this.openedTabs = [];
        this.activatedTab = undefined;
        this.content = '';
    }
    store$ = inject(Store);
    private actions$ = inject(Actions);
    private filePickerSub?: Subscription;
    private messageService = inject(NzMessageService);
    isLinux: boolean = false;
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
                            startPath: this.isLinux?'/': '\\',
                            selectFolders: selectFolder,
                            // multiSelect: true,
                            // multiSelect: false,
                            multiSelect: !selectFolder,
                            // maxSelectCount: 3,
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
        let index = this.openedTabs.findIndex(t => t.type === 'file' && t.file?.path === path);
        if (index > -1) {
            this.activatedTab = this.openedTabs[index];
        } else {
            try {
                let openFile = await this.codeService.getCode(path);
                let tab: CodeSpaceTab = {
                    type: 'file',
                    name: openFile.name,
                    file: openFile,
                }
                this.activatedTab = tab;
                this.openedTabs.push(tab);
                if (this.openedTabs.length === 1) {
                    this.monacoEditorViewUpdate();
                }
                this.activeTab(this.activatedTab);
            } catch (err) {
                console.log(err);
            }
        }
    }
    // 点击空白处关闭菜单
    constructor() {
        super();
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

    openSetting() {
        let tab = this.openedTabs.find(t => t.type === 'setting');
        if (tab) {
            this.activeTab(tab)
        }else{
            let settingTab: CodeSpaceTab = {
                type: 'setting',
                name: 'setting',
            }
            this.activeTab(settingTab);
            this.openedTabs.push(settingTab);
        }
    }

    isActiveTab(tab: CodeSpaceTab) {
        return this.activatedTab===tab;
    }

    @Output()
    appEventEmitter: EventEmitter<ProgramEvent> = new EventEmitter<ProgramEvent>();

    hoverIn() {
        this.appEventEmitter.emit({
            type: 9,
            id: this.id!,
            event: 'hoverIn'
        });
    }
    hoverOut() {
        this.appEventEmitter.emit({
            type: 10,
            id: this.id!,
            event: 'hoverOut'
        });
    }
}
