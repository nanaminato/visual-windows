import { Component, signal } from '@angular/core';
import {NavBar} from '../system-panels/window/nav-bar/nav-bar';
import {DesktopManager} from '../system-panels/window/app-desktop-manager/desktop-manager';


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
