import {Injectable} from '@angular/core';
import {ProgramConfigService} from './program-config.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ProgramConfig, WindowState} from '../../models';

@Injectable({ providedIn: 'root' })
export class ProgramManagerService {
  appWindowConfigs= new BehaviorSubject<ProgramConfig[]>([]);
  constructor(private readonly appConfigService: ProgramConfigService,
              private snackBar: MatSnackBar) {
    // this.loadAppConfigs();
  }
  getAppWindowConfigOfWindow(window: WindowState) {
    for (let app of this.listApps()) {
      if(app.appId === window.appId) {
        return app;
      }
    }
    return undefined;
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
