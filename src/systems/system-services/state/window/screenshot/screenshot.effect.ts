import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {WindowCaptureService} from '../../../window-capture.service';
import {WindowActions} from '../window.actions';
import {distinctUntilChanged, exhaustMap, filter, map, mergeMap} from 'rxjs';
import {addScreenshot, deleteScreenshot, updateScreenshot} from './screenshot.actions';

@Injectable()
export class ScreenshotEffect {
    private actions$: Actions = inject(Actions);
    private captureService: WindowCaptureService = inject(WindowCaptureService);
    addScreenshot$ = createEffect(() =>
        this.actions$.pipe(
            ofType(WindowActions.windowLoaded),
            mergeMap(({ id }) =>
                this.captureService.takeScreenshot(id).then(screenshot => ({ id, screenshot }))
            ),
            filter(({ screenshot }) => !!screenshot),
            map(
                (
                    { id, screenshot }) => addScreenshot({ windowId: id, screenshot: screenshot! })
            )
        )
    );
    updateScreenshot$ = createEffect(() =>
        this.actions$.pipe(
            ofType(WindowActions.focusWindow),
            distinctUntilChanged((prev, curr) => prev.id === curr.id), // 只有id变化才继续
            exhaustMap(({ id }) =>
                this.captureService.takeScreenshot(id).then(screenshot => ({ id, screenshot }))
            ),
            filter(({ screenshot }) => !!screenshot),
            map(
                (
                    { id, screenshot }) => updateScreenshot({ windowId: id, screenshot: screenshot! })
            )
        )
    );


    // 监听 close window，删除截图
    deleteScreenshot$ = createEffect(() =>
        this.actions$.pipe(
            ofType(WindowActions.closeWindow),
            map(({ id }) => deleteScreenshot({ windowId: id }))
        )
    );
}
