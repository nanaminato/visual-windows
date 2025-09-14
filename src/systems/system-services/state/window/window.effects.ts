import {inject, Injectable} from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import { v4 as uuid } from 'uuid';
import {switchMap, withLatestFrom, catchError, of, mergeMap, from, concatMap, EMPTY, Observable} from 'rxjs';
import {selectWindows} from './window.selectors';
import {WindowActions} from './window.actions';
import {WindowState} from '../../../models';
import {componentMap, programWithCustomHeaders} from '../../../programs/models';
import {selectProgramConfigs} from '../system/system.selector';

@Injectable()
export class WindowEffects {
    private actions$ = inject(Actions)
    private store = inject(Store);
    openWindow$ = createEffect(() =>
        this.actions$.pipe(
            ofType(WindowActions.openWindow),
            withLatestFrom(
                this.store.select(selectWindows),
                this.store.select(selectProgramConfigs)
            ),
            mergeMap(([action, windows, programConfigs]) => {
                const { id: appId, title, params,x,y, parentId, modal, closeWithParent } = action;

                const actionsToDispatch: Action[] = [];

                if (modal && parentId) {
                    actionsToDispatch.push(WindowActions.setWindowDisabled({ id: parentId, disabled: true }));
                }

                const openedWindows = windows.filter(w => w.programId === appId);

                if (!programConfigs) {
                    console.warn("No program configs found");
                    return of({ type: 'NO_ACTION' });
                }

                const registeredApps = programConfigs.filter(pc => pc.programId === appId);
                const registeredApp = registeredApps[0];

                if (openedWindows.length > 0 && registeredApp?.isSingleton) {
                    actionsToDispatch.push(WindowActions.focusWindow({ id: openedWindows[0].id }));
                    return from(actionsToDispatch);
                }
                let parentWindow: WindowState | undefined;
                if(parentId) {
                    parentWindow = windows.find(p=>p.id === parentId);
                }
                const newId = uuid();
                const newWindow: WindowState = {
                    id: newId,
                    programId: appId,
                    title,
                    position: {
                        x: parentWindow?parentWindow.position.x+30:(x??100),
                        y: parentWindow?parentWindow.position.y+30:(y??100),
                    },
                    size: {
                        width: registeredApp?.preferredSize?.width ?? 800,
                        height: registeredApp?.preferredSize?.height ?? 600
                    },
                    minimized: false,
                    maximized: false,
                    active: true,
                    params,
                    customHeader: programWithCustomHeaders.includes(appId),
                    parentId,
                    modal,
                    closeWithParent,
                };

                const componentLoader = componentMap.get(appId);

                if (componentLoader) {
                    return from(componentLoader()).pipe(
                        mergeMap(component => {
                            newWindow.component = component;
                            actionsToDispatch.push(WindowActions.openWindowSuccess({ window: newWindow }));
                            return from(actionsToDispatch);
                        }),
                        catchError(error => {
                            console.error('load component error:', error);
                            return of({ type: 'NO_ACTION' });
                        })
                    );
                } else {
                    actionsToDispatch.push(WindowActions.openWindowSuccess({ window: newWindow }));
                    return from(actionsToDispatch);
                }
            }),
            catchError(error => {
                console.error('openWindow effect error:', error);
                return of({ type: 'NO_ACTION' });
            })
        )
    );

}
