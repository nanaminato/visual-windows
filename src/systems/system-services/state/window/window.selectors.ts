import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WindowStateSlice } from './window.reducer';

export const selectWindowState = createFeatureSelector<WindowStateSlice>('window');

export const selectWindows = createSelector(
    selectWindowState,
    (state) => state.windows
);
export const selectOrders = createSelector(
    selectWindowState,
    (state) => state.activeOrder
);

export const selectWindowByProgramId = (programId: string) => createSelector(
    selectWindows,
    (windows) => windows.filter(w => w.programId === programId)
);

export const selectWindowById = (id: string) => createSelector(
    selectWindows,
    (windows) => windows.find(w => w.id === id)
);
