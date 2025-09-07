import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {loginSuccess, systemActions} from '../system/system.action';
import {filter, switchMap, take, withLatestFrom} from 'rxjs';
import {Store} from '@ngrx/store';
import {ResumeService} from '../../resume.service';
import {selectIsConfigLoaded, selectIsLoggedIn, selectProgramConfigs} from '../system/system.selector';

@Injectable()
export class ResumeEffects {
    private actions$: Actions = inject(Actions)
    private store: Store = inject(Store);
    private resumeService: ResumeService = inject(ResumeService);
    startResume$ = createEffect(() =>
            this.actions$.pipe(
                ofType(loginSuccess, systemActions.configLoadSuccess),
                withLatestFrom(
                    this.store.select(selectIsLoggedIn),
                    this.store.select(selectIsConfigLoaded)
                ),
                filter(
                    ([action, isLoggedIn, configLoaded]) => isLoggedIn && configLoaded),
                take(1),
                switchMap(() => this.resumeService.start())
            ),
        { dispatch: false }
    );

}
