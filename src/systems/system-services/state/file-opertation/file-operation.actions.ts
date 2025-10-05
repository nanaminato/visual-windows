// file-operation.actions.ts
import {createActionGroup, props} from '@ngrx/store';
export type FileOperationStatus = 'pending' | 'inProgress' | 'completed' | 'error' | 'cancelled';

export const IN_PROGRESS = 'inProgress' as const;
export const COMPLETED = 'completed' as const;
export const ERROR = 'error' as const;
export const PENDING = 'pending' as const;
export const CANCELLED = 'cancelled' as const;
export interface FileOperation {
    localOperationId: string;
    operationId?: string;
    sourcePaths: string[];
    destinationPath: string;
    operationType: 'copy' | 'cut' | 'delete' | 'upload' | 'serverTransfer';
    status: FileOperationStatus;
    progress: number; // 0-100
    currentFile: string;
    error?: string;
}

export interface FileOperationState {
    operations: {
        [id: string]: FileOperation;
    };
}
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
