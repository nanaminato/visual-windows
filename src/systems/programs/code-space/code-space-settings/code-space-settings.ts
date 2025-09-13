import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {CodeSpaceSettingsModel} from './models/theme';
import {DEFAULT_SETTINGS} from './models/theme'
import {NzInputNumberComponent} from 'ng-zorro-antd/input-number';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzSliderComponent} from 'ng-zorro-antd/slider';
@Component({
    selector: 'app-code-space-settings',
    imports: [CommonModule, FormsModule, NzInputNumberComponent, NzRowDirective, NzColDirective, NzSliderComponent],
    templateUrl: './code-space-settings.html',
    styleUrl: './code-space-settings.css'
})
export class CodeSpaceSettings {
    @Input() storageKey = 'code_space_settings';

    @Input() initial?: Partial<CodeSpaceSettingsModel>;

    @Output() settingsChange = new EventEmitter<CodeSpaceSettingsModel>();

    settings: CodeSpaceSettingsModel = { ...DEFAULT_SETTINGS };

    ngOnInit(): void {
        this.loadFromStorage();
        if (this.initial) {
            this.settings = { ...this.settings, ...this.initial };
        }
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
        } catch {
            this.settings = { ...DEFAULT_SETTINGS };
        }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('保存 CodeSpace 设置到 localStorage 失败：', e);
        }
    }

    private emit(): void {
        this.settingsChange.emit({ ...this.settings });
    }
}
