import {Component, inject} from '@angular/core';
import {AppManagerService} from '../../../system-services/impl/app-manager.service';
import {WindowManagerService} from '../../../system-services/impl/windows-manager.service';
import {WindowState} from '../../../system-services/window-manager.service';

@Component({
  selector: 'system-nav-bar',
  imports: [],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  private appManager = inject(AppManagerService);
  private windowManager = inject(WindowManagerService);

  apps = this.appManager.listApps();
  windows: WindowState[] = [];

  constructor() {
    this.windowManager.getWindows().subscribe(ws => {
      this.windows = ws.filter(w => !w.minimized);
    });
  }

  openApp(appId: string, title: string) {
    this.windowManager.openWindow(appId, title);
  }

  toggleWindow(win: WindowState) {
    if (win.active) {
      this.windowManager.minimizeWindow(win.id);
    } else {
      this.windowManager.focusWindow(win.id);
    }
  }
}
