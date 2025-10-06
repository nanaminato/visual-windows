// file-operation.actions.ts
import {createActionGroup, props} from '@ngrx/store';
import {FileOperation} from './file-operation';
export const FileOpsActions = createActionGroup({
    source: '[File Ops]',
    events: {
        'Start': props<{ operation: FileOperation }>(),
        'Start Success': props<{ oldOperationId: string,operationId: string }>(),
        'Start Error': props<{ operationId: string, error: string }>(),
        'Update Progress': props<{ operationId: string; progress: number; currentFile: string }>(),
        'Completed': props<{ operationId: string }>(),
        'Error': props<{ operationId: string; error: string }>(),
        'Cancelled': props<{ operationId: string }>(),
        'Cancel Request': props<{ operationId: string }>(),
    }
});
