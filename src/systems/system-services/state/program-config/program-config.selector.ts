import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ProgramConfigState} from './program-config.reducer';

export const selectProgramConfigState = createFeatureSelector<ProgramConfigState>('programConfig');

export const selectProgramConfigs = createSelector(
    selectProgramConfigState,
    (state) => state.programConfigs
);

export const selectLoading = createSelector(
    selectProgramConfigState,
    (state) => state.loading
);

export const selectError = createSelector(
    selectProgramConfigState,
    (state) => state.error
);
