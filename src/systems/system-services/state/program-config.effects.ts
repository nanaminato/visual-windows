import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {ProgramConfigService} from '../impl/program-config.service';
import {programConfigActions} from './program-config.action';
import {catchError, exhaustMap, map, of} from 'rxjs';

@Injectable({
    providedIn: "root",
})
export class ProgramConfigEffects{
    private action$ = inject(Actions)
    private programConfigService$ = inject(ProgramConfigService)
    loadProgramConfig$ = createEffect(
        () => {
            return this.action$.pipe(
                ofType(programConfigActions.init),
                exhaustMap(() =>
                    this.programConfigService$.getAllInstalledApps().pipe(
                        map(programConfigs =>
                            programConfigActions.loadSuccess({ programConfigs })  // 传递数据
                        ),
                        catchError(error =>
                            of(programConfigActions.loadError({ error }))  // 传递错误
                        )
                    )
                )
            )
        })

}
