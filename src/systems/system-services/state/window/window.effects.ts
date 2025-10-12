import {inject, Injectable} from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import { v4 as uuid } from 'uuid';
import {withLatestFrom, catchError, of, mergeMap, from, map} from 'rxjs';
import {selectWindows} from './window.selectors';
import {WindowActions} from './window.actions';
import {WindowState} from '../../../models';
import {componentMap, programWithCustomHeaders} from '../../../programs/models';
import {selectProgramConfigs} from '../system/system.selector';
import {LinkService} from '../../link.service';
import {WindowStartupLocation} from '../../../models/window-state';

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
                const { id: appId, title, params,position, parentId, modal, closeWithParent } = action;

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
                const preferredWidth = registeredApp?.preferredSize?.width ?? 800;
                const preferredHeight = registeredApp?.preferredSize?.height ?? 600;

                const pos = this.calculateWindowPosition(
                    position?.location,
                    preferredWidth,
                    preferredHeight,
                    parentWindow?.position,
                    parentWindow?.size,
                    position?.left ?? 100,
                    position?.top ?? 100
                );
                const newId = uuid();
                const newWindow: WindowState = {
                    id: newId,
                    programId: appId,
                    title,
                    position: {
                        left: pos.left,
                        top: pos.top,
                    },
                    size: {
                        width: preferredWidth,
                        height: preferredHeight
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
                            actionsToDispatch.push(WindowActions.openWindowSuccess({id: newId, window: newWindow }));
                            return from(actionsToDispatch);
                        }),
                        catchError(error => {
                            console.error('load component error:', error);
                            return of({ type: 'NO_ACTION' });
                        })
                    );
                } else {
                    actionsToDispatch.push(WindowActions.openWindowSuccess({id: newId, window: newWindow }));
                    return from(actionsToDispatch);
                }
            }),
            catchError(error => {
                console.error('openWindow effect error:', error);
                return of({ type: 'NO_ACTION' });
            })
        )
    );
    linkService: LinkService = inject(LinkService);
    closeWindow$ = createEffect(() =>
        this.actions$.pipe(
            ofType(WindowActions.closeWindow),
            withLatestFrom(this.store.select(selectWindows)), // 根据你的路径调整
            map(([action, windows]) => {
                const { id } = action;
                // 递归查找所有需要关闭的子窗口ID，只有 closeWithParent === true 的子窗口才关闭
                const getChildWindowsToClose = (fatherId: string, windows: WindowState[]): string[] => {
                    const directChildren = windows.filter(w => w.parentId === fatherId && w.closeWithParent);

                    let allChildrenIds: string[] = [];
                    for (const child of directChildren) {
                        allChildrenIds.push(child.id);
                        allChildrenIds = allChildrenIds.concat(getChildWindowsToClose(child.id, windows));
                    }
                    return allChildrenIds;
                };

                // 找到关闭的窗口
                const closedWindow = windows.find(w => w.id === id);

                if (!closedWindow) {
                    // 找不到窗口就返回原数组
                    return WindowActions.closeWindowSuccess({ id, windows });
                }

                // 关闭的窗口ID列表，包含自己和需要关闭的子窗口
                const closeWindowIds = [id].concat(getChildWindowsToClose(id, windows));
                closeWindowIds.forEach(window=>{
                    // 清除组件引用（常规清理）
                    this.linkService.remove(window)
                })
                // 新的 windows 列表，不包含被关闭的
                let newWindows = windows.filter(w => !closeWindowIds.includes(w.id));

                // 如果关闭的是modal子窗口，解除父窗口禁用状态
                if (closedWindow.parentId && closedWindow.modal) {
                    newWindows = newWindows.map(w =>
                        w.id === closedWindow.parentId ? { ...w, disabled: false } : w
                    );
                }

                // 返回关闭成功 action
                return WindowActions.closeWindowSuccess({ id, windows: newWindows });
            })
        )
    );
    openWindowSuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(WindowActions.openWindowSuccess),
            map(action => WindowActions.focusWindow({ id: action.window.id }))
        )
    );
    getScreenWidth(): number {
        return window.screen.availWidth;
    }

    getScreenHeight(): number {
        return window.screen.availHeight;
    }

    /**
     * 根据窗口启动位置计算left和top
     * @param location WindowStartupLocation
     * @param windowWidth 当前窗口宽度
     * @param windowHeight 当前窗口高度
     * @param parentPos 父窗口位置（如果有）
     * @param parentSize 父窗口大小（如果有）
     * @param defaultLeft
     * @param defaultTop
     * @returns Position的left和top
     */
    calculateWindowPosition(
        location: WindowStartupLocation | undefined,
        windowWidth: number,
        windowHeight: number,
        parentPos?: { left: number; top: number },
        parentSize?: {width: number; height: number},
        defaultLeft = 100,
        defaultTop = 100
    ): { left: number; top: number } {
        switch (location) {
            case WindowStartupLocation.CenterScreen:
                return {
                    left: Math.round((this.getScreenWidth() - windowWidth) / 2),
                    top: Math.round((this.getScreenHeight() - windowHeight) / 2),
                };
            case WindowStartupLocation.CenterWindow:
                if (parentPos && parentSize) {
                    return {
                        left: Math.round(parentPos.left + (parentSize.width - windowWidth) / 2),
                        top: Math.round(parentPos.top + (parentSize.height - windowHeight) / 2),
                    };
                }
                return { left: defaultLeft, top: defaultTop };
            case WindowStartupLocation.Manual:
            case undefined:
            default:
                return { left: defaultLeft, top: defaultTop };
        }
    }

}
