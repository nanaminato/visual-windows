import {Injectable} from '@angular/core';
import {AppWindowConfig} from '../window-manager.service';
import {AppWindowConfigService} from './app-window-config-service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class AppManagerService {
  appWindowConfigs= new BehaviorSubject<AppWindowConfig[]>([]);
  constructor(private readonly appConfigService: AppWindowConfigService,
              private snackBar: MatSnackBar) {
    this.loadAppConfigs();
  }
  getAppWindowConfigs() {
    return this.appWindowConfigs.getValue();
  }
  async loadAppConfigs(){
    try{
      let appConfigs = await this.appConfigService.getAllInstalledApps();
      if(appConfigs===undefined){
        return;
      }
      this.appWindowConfigs.next(appConfigs);
    }catch(error){
      this.snackBar.open('Error loading app configs.');
    }

  }
  getAppConfigObservables(){
    return this.appWindowConfigs.asObservable();
  }

  listApps() {
    return this.getAppWindowConfigs()
  }
}
