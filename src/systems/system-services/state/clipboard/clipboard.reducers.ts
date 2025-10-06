import { createReducer, on } from '@ngrx/store';
import {ClipboardActions} from './clipboard.actions';
import {ClipboardState, COPY, CUT} from './clipboard';

export const initialClipboardState: ClipboardState = {
    operation: null,
    files: []
};

export const clipboardReducer = createReducer(
    initialClipboardState,

    on(ClipboardActions.copyFiles, (state, { files }) => ({
        operation: COPY,
        files: [...files]
    })),

    on(ClipboardActions.cutFiles, (state, { files }) => ({
        operation: CUT,
        files: [...files]
    })),

    on(ClipboardActions.pasteFiles, (state) => {
        if (state.operation === CUT) {
            // 粘贴后剪切的要清空状态
            return initialClipboardState;
        }
        // 粘贴后复制的，保留状态，不改动
        return state;
    }),

    on(ClipboardActions.deleteFiles, (state) => initialClipboardState),

    on(ClipboardActions.clearClipboard, () => initialClipboardState)
);
