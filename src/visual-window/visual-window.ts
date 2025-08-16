import {Component, signal, ViewChild, ViewContainerRef} from '@angular/core';
import { DesktopManager } from '../systems/system-lives/desktop-manager/desktop-manager';
import { DesktopBar } from '../systems/system-lives/desktop-bar/desktop-bar';


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
}
