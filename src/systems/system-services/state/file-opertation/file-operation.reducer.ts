import {createReducer, on} from '@ngrx/store';
import {
    FileOpsActions,
} from './file-operation.actions';
import {CANCELLED, COMPLETED, ERROR, FileOperationState, IN_PROGRESS, PENDING} from './file-operation';


export const initialState: FileOperationState = {
    operations: {},
};

export const fileOperationsReducer = createReducer(
    initialState,
    on(FileOpsActions.start, (state, { operation }) => ({
        ...state,
        operations: {
            ...state.operations,
            [operation.localOperationId]: operation
        },
    })),
    on(FileOpsActions.startSuccess, (state, { oldOperationId, operationId }) => {
        const operation = state.operations[oldOperationId];
        if (!operation) return state;

        // 删除旧的 key，添加新的 key
        const { [oldOperationId]: removed, ...restOperations } = state.operations;

        return {
            ...state,
            operations: {
                ...restOperations,
                [operationId]: {
                    ...operation,
                    operationId // 替换 operationId ，或者你也可决定保留 localOperationId，如果操作对象里有两个id
                }
            },
        };
    }),
    on(FileOpsActions.updateProgress, (state, { operationId, progress, currentFile }) => ({
        ...state,
        operations: {
            ...state.operations,
            [operationId]: {
                ...state.operations[operationId],
                progress,
                currentFile,
                status: IN_PROGRESS,
            }
        }
    })),
    on(FileOpsActions.completed, (state, { operationId }) => ({
        ...state,
        operations: {
            ...state.operations,
            [operationId]: {
                ...state.operations[operationId],
                progress: 100,
                status: COMPLETED,
                currentFile: ''
            }
        }
    })),
    on(FileOpsActions.error, FileOpsActions.startError, (state, { operationId, error }) => ({
        ...state,
        operations: {
            ...state.operations,
            [operationId]: {
                ...state.operations[operationId],
                status: ERROR,
                error,
                currentFile: ''
            }
        }
    })),
    on(FileOpsActions.cancelled, (state, { operationId }) => ({
        ...state,
        operations: {
            ...state.operations,
            [operationId]: {
                ...state.operations[operationId],
                status: CANCELLED,
                currentFile: ''
            }
        }
    })),
    on(FileOpsActions.cancelRequest, (state, { operationId }) => ({
        ...state,
        operations: {
            ...state.operations,
            [operationId]: {
                ...state.operations[operationId],
                status: PENDING, // 置为待取消中，或者单独新增字段也可
            }
        }
    })),
);
