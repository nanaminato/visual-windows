import {Component, inject, Input} from '@angular/core';
import {WinIcon} from '../../win-icon/win-icon';
import {selectScreenshotByWindowId} from '../../../system-services/state/window/screenshot/screenshot.selectors';
import {Store} from '@ngrx/store';
import {ProgramConfig} from '../../../models';
import {take} from 'rxjs';

@Component({
  selector: 'app-window-screenshot',
    imports: [
        WinIcon
    ],
  templateUrl: './window-screenshot.html',
  styleUrl: './window-screenshot.css'
})
export class WindowScreenshot {
    @Input() windowId!: string;

    screenshotUrl: string | null = null;
    programConfig?: ProgramConfig;

    private store = inject(Store);

    ngOnInit() {
        this.store.select(selectScreenshotByWindowId(this.windowId)).pipe(
            take(1)
        ).subscribe(screenshot => {
            this.screenshotUrl = screenshot ? screenshot : null;
            // console.log('Screenshot', this.screenshotUrl?.length);
        });
        // 可通过 windowId 得到对应程序 config 作为辅助图标
        // TODO: 需要注入 programConfigs 或传入 programId
    }
}
