import {createFeatureSelector, createSelector} from '@ngrx/store';
import {ProgramConfigState, SystemInfoState} from './system.reducer';

export const selectProgramConfigState = createFeatureSelector<ProgramConfigState>('programConfig');

export const selectProgramConfigs = createSelector(
    selectProgramConfigState,
    (state) => state.programConfigs
);
export const selectSystemInfoState = createFeatureSelector<SystemInfoState>('systemInfo');
export const selectSystemInfo = createSelector(
    selectSystemInfoState,
    (state)=> state.systemInfo
)

