import {Actions, createEffect, ofType} from '@ngrx/effects';
import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {SignalRService} from '../../signalR-service';
import {FileOpsActions} from './file-operation.actions';
import {catchError, map, mergeMap, of} from 'rxjs';
import {Store} from '@ngrx/store';
import {StartResponse} from '../../models/file-operation/start-response';

@Injectable()
export class FileOperationEffects {
    private actions$: Actions = inject(Actions);
    private http: HttpClient = inject(HttpClient);
    private signalRService: SignalRService = inject(SignalRService);
    store = inject(Store)
    constructor() {
        this.signalRService.startConnection();

        this.signalRService.onProgress((data) => {
            this.store.dispatch(FileOpsActions.updateProgress({
                operationId: data.operationId,
                progress: data.progress,
                currentFile: data.currentFile
            }));
        });

        this.signalRService.onCompleted((data) => {
            this.store.dispatch(FileOpsActions.completed({ operationId: data.operationId }));
        });

        this.signalRService.onError((data) => {
            this.store.dispatch(FileOpsActions.error({
                operationId: data.operationId,
                error: data.message
            }));
        });

        this.signalRService.onCancelled((data) => {
            this.store.dispatch(FileOpsActions.cancelled({ operationId: data.operationId }));
        });
    }

    startOperation$ = createEffect(() =>
        this.actions$.pipe(
            ofType(FileOpsActions.start),
            mergeMap(action =>
                this.http.post<StartResponse>('/api/fileops/start', action.operation)
                    .pipe(
                        map(response => FileOpsActions.startSuccess({ oldOperationId: action.operation.localOperationId,operationId: response.operationId })),
                        catchError(err => of(FileOpsActions.startError({ operationId: action.operation.operationId!, error: err.message || '启动失败' })))
                    )
            )
        )
    );

    cancelOperation$ = createEffect(() =>
            this.actions$.pipe(
                ofType(FileOpsActions.cancelRequest),
                mergeMap(({ operationId }) =>
                    this.http.post(`/api/fileops/cancel?operationId=${operationId}`, {})
                        .pipe(
                            // 取消成功不必在这里处理，SignalR会推送相关状态
                            map(() => ({ type: '[FileOps] Cancel Success', operationId })),
                            catchError(() => of(FileOpsActions.error({ operationId, error: '取消失败' })))
                        )
                )
            )
        , { dispatch: false });
}
