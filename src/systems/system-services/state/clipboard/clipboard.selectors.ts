import { createFeatureSelector, createSelector } from '@ngrx/store';
import {ClipboardState} from './clipboard';

export const selectClipboardState = createFeatureSelector<ClipboardState>('clipboard');

export const selectClipboardOperation = createSelector(
    selectClipboardState,
    (state) => state.operation
);

export const selectClipboardFiles = createSelector(
    selectClipboardState,
    (state) => state.files
);

export const selectClipboardHasFiles = createSelector(
    selectClipboardFiles,
    files => files.length > 0
);
