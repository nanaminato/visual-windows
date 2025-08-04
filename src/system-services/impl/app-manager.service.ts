import {AppInfo} from '../app-manager.service';
import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppManagerService {
  private apps: AppInfo[] = [
    {
      id: 'file-browser', name: '文件浏览器', icon: 'folder'
    },
    {
      id: 'terminal', name: '终端', icon: 'terminal'
    },
    {
      id: 'docker', name: 'Docker 管理', icon: 'docker'
    },
  ];

  listApps() {
    return this.apps;
  }
}
