import {Component, Input} from '@angular/core';
import {ProgramConfig} from '../../models';

@Component({
  selector: 'app-win-icon',
  imports: [],
  templateUrl: './win-icon.html',
})
export class WinIcon {
  @Input()
  public programConfig: ProgramConfig | undefined;
}
