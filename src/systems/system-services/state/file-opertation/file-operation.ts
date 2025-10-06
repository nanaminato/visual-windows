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
