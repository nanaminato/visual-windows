import {Injectable} from '@angular/core';
import {ProgramConfigService} from './program-config.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ProgramConfig} from '../../models';

@Injectable({ providedIn: 'root' })
export class ProgramManagerService {
    programConfigs= new BehaviorSubject<ProgramConfig[]>([]);
    constructor(private readonly appConfigService: ProgramConfigService,
                private snackBar: MatSnackBar) {
    }
    getProgramConfig(programId: string): ProgramConfig |undefined {
        for (let program of this.listProgramConfigs()) {
            if(program.programId === programId) {
                return program;
            }
        }
        return undefined;
    }
    getProgramConfigs() {
        return this.programConfigs.getValue();
    }
    async loadProgramConfigs(){
        try{
            let appConfigs = await this.appConfigService.getAllInstalledApps();
            if(appConfigs===undefined){
                return;
            }
            this.programConfigs.next(appConfigs);
        }catch(error){
            this.snackBar.open('Error loading app configs.');
        }

    }
    getProgramConfigObservables(){
        return this.programConfigs.asObservable();
    }

    listProgramConfigs() {
        return this.getProgramConfigs()
    }
}
