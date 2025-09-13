import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CodeSpaceSettingsModel} from './models/theme';
import {DEFAULT_SETTINGS} from './models/theme'
@Component({
    selector: 'app-code-space-settings',
    imports: [CommonModule, FormsModule],
    templateUrl: './code-space-settings.html',
    styleUrl: './code-space-settings.css'
})
export class CodeSpaceSettings {
    @Input() storageKey = 'code_space_settings';

    // 外部可以提供初始设置，会与 storage/默认合并
    @Input() initial?: Partial<CodeSpaceSettingsModel>;

    // 应用后向外部发出完整设置对象
    @Output() settingsChange = new EventEmitter<CodeSpaceSettingsModel>();

    settings: CodeSpaceSettingsModel = { ...DEFAULT_SETTINGS };

    ngOnInit(): void {
        this.loadFromStorage();
        if (this.initial) {
            this.settings = { ...this.settings, ...this.initial };
        }
        // 将当前设置通知外部（组件初始化后，外部可以知道当前生效的配置）
        this.emit();
    }

    onChange(): void {
        this.saveToStorage();
        this.emit();
    }

    apply(): void {
        this.saveToStorage();
        this.emit();
    }

    reset(): void {
        this.settings = { ...DEFAULT_SETTINGS };
        this.saveToStorage();
        this.emit();
    }

    private loadFromStorage(): void {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw) as Partial<CodeSpaceSettingsModel>;
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (e) {
            // 读取/解析失败时使用默认（不抛出）
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (e) {
            // 写入失败（例如浏览器隐私模式），可根据需要处理或忽略
            console.warn('保存 CodeSpace 设置到 localStorage 失败：', e);
        }
    }

    private emit(): void {
        // 发出当前完整的设置对象，外部可以订阅 (settingsChange)="onSettings($event)"
        this.settingsChange.emit({ ...this.settings });
    }
}
