import {Component, signal, ViewChild, ViewContainerRef} from '@angular/core';
import {DesktopManager} from '../systems/system-panels/window/app-desktop-manager/desktop-manager';
import {NavBar} from '../systems/system-panels/window/nav-bar/nav-bar';


@Component({
  selector: 'app-root',
  imports: [
    NavBar,
    DesktopManager,

  ],
  providers: [
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('VisualWindows');
}
