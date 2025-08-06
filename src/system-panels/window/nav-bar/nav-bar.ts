import {Component, inject} from '@angular/core';
import {AppManagerService} from '../../../system-services/impl/app-manager.service';
import {WindowManagerService} from '../../../system-services/impl/windows-manager.service';
import {WindowState} from '../../../system-services/window-manager.service';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'system-nav-bar',
  imports: [
    NzButtonComponent
  ],
  templateUrl: './nav-bar.html',
  styleUrl: './nav-bar.css'
})
export class NavBar {
  private appManager = inject(AppManagerService);
  private windowManager = inject(WindowManagerService);
  private appManagerService = inject(AppManagerService);
  apps = this.appManager.listApps();
  windows: WindowState[] = [];
  getAppWindowConfigOfWindow(window: WindowState) {
    for (let app of this.appManager.listApps()) {
      if(app.appId === window.appId) {
        return app;
      }
    }
    return undefined;
  }
  showAppList = false;

  constructor() {
    this.windowManager.getWindows().subscribe(ws => {
      this.windows = ws.filter(w => !w.minimized);
    });
    this.appManagerService.getAppConfigObservables().subscribe(appConfigs => {
      this.apps = appConfigs;
    })

  }

  toggleAppList() {
    this.showAppList = !this.showAppList;
  }

  openApp(appId: string, title: string) {
    this.windowManager.openWindow(appId, title);
    this.showAppList = false;
  }

  toggleWindow(win: WindowState) {
    this.windowManager.focusWindow(win.id);
  }

  getWindowsByApp(appId: string): WindowState[] {
    return this.windows.filter(w => w.appId === appId);
  }
}
