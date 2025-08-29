import {Component, inject, signal} from '@angular/core';
import { DesktopManager } from '../systems/system-lives/desktop-manager/desktop-manager';
import { DesktopBar } from '../systems/system-lives/desktop-bar/desktop-bar';
import {Store} from '@ngrx/store';
import {programConfigActions} from '../systems/system-services/state/program-config/program-config.action';

/*
* 顶层组件
* **/
@Component({
  selector: 'visual-window',
  imports: [
    DesktopBar,
    DesktopManager,
  ],
  providers: [
  ],
  templateUrl: './visual-window.html',
  styleUrl: './visual-window.css'
})
export class VisualWindow {
  protected readonly title = signal('VisualWindows');
  private store = inject(Store);
  ngOnInit() {
      this.store.dispatch(programConfigActions.init())
  }
}
