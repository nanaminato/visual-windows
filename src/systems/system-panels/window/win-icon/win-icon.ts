import {Component, Input} from '@angular/core';
import {AppWindowConfig} from '../../../system-services/refers/window-manager.service';

@Component({
  selector: 'app-win-icon',
  imports: [],
  templateUrl: './win-icon.html',
})
export class WinIcon {
  @Input()
  public appConfig: AppWindowConfig | undefined;
}
