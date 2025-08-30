import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {systemActions} from './system.action';
import {catchError, exhaustMap, map, of} from 'rxjs';
import {ProgramConfigService} from '../../program-config.service';
import {SystemInfoService} from '../../info.service';

@Injectable({
    providedIn: "root",
})
export class SystemEffects {
    private action$ = inject(Actions)
    private programConfigService$ = inject(ProgramConfigService)
    loadProgramConfig$ = createEffect(
        () => {
            return this.action$.pipe(
                ofType(systemActions.configInit),
                exhaustMap(() =>
                    this.programConfigService$.getAllInstalledApps().pipe(
                        map(programConfigs =>
                            systemActions.configLoadSuccess({ programConfigs })  // 传递数据
                        ),
                        catchError(error =>
                            of(systemActions.configLoadError({ error }))  // 传递错误
                        )
                    )
                )
            )
        })
    private systemInfo = inject(SystemInfoService);
    loadSystemInfo$ = createEffect(
        () => {
            return this.action$.pipe(
                ofType(systemActions.systemInfoInit),
                exhaustMap(() =>
                    this.systemInfo.fetchSystemInfo().pipe(
                        map(systemInfo =>
                            systemActions.systemInfoLoadSuccess({ systemInfo })  // 传递数据
                        ),
                        catchError(error =>
                            of(systemActions.systemInfoLoadError({ error }))  // 传递错误
                        )
                    )
                )
            )
        })

}
