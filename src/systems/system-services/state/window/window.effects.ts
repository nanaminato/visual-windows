import {inject, Injectable} from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { v4 as uuid } from 'uuid';
import {switchMap, withLatestFrom, catchError, of, mergeMap} from 'rxjs';
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
            ofType(WindowActions.openWindow), // 监听 'bing window' action
            withLatestFrom(
                this.store.select(selectWindows),
                this.store.select(selectProgramConfigs)
            ),
            mergeMap(([action, windows, programConfigs]) => {
                const { id: appId, title, params } = action;
                // 找出已打开的窗口
                const openedWindows = windows.filter(w => w.programId === appId);
                // 找出对应的程序配置
                if(programConfigs===undefined){
                    console.warn("No program configs found");
                    throw new Error("No program configs found");

                }
                const registeredApps = programConfigs.filter(programConfig => programConfig.programId === appId);
                const registeredApp = registeredApps[0];

                // 如果是单例且已打开，直接聚焦
                if (openedWindows.length > 0 && registeredApp?.isSingleton) {
                    return of(WindowActions.focusWindow({ id: openedWindows[0].id }));
                }

                // 新建窗口
                const newId = uuid();
                const newWindow: WindowState = {
                    id: newId,
                    programId: appId,
                    title,
                    position: { x: 100, y: 100 },
                    size: {
                        width: registeredApp?.preferredSize?.width ?? 800,
                        height: registeredApp?.preferredSize?.height ?? 600
                    },
                    minimized: false,
                    maximized: false,
                    active: true,
                    params,
                    customHeader: programWithCustomHeaders.includes(appId),
                };

                // 异步加载组件，转换成 Promise
                const componentLoader = componentMap.get(appId);
                if (componentLoader) {
                    return componentLoader().then(component => {
                        newWindow.component = component;
                        return WindowActions.openWindowSuccess({ window: newWindow });
                    }).catch(error => {
                        console.error('load component error:', error);
                        // 失败时不打开窗口，或者你可以返回一个失败的 action
                        return { type: 'NO_ACTION' };
                    });
                } else {
                    // 没有组件加载器，直接打开窗口
                    return of(WindowActions.openWindowSuccess({ window: newWindow }));
                }
            }),
            switchMap(actionOrPromise => {
                if (actionOrPromise instanceof Promise) {
                    return actionOrPromise.then(action => action);
                }
                return of(actionOrPromise);
            }),
            catchError(error => {
                console.error('openWindow effect error:', error);
                return of({ type: 'NO_ACTION' });
            })
        )
    );
}
