import {createFeatureSelector, createSelector} from '@ngrx/store';
import {AuthState, ProgramConfigState, SystemInfoState} from './system.reducer';

export const selectProgramConfigState = createFeatureSelector<ProgramConfigState>('programConfig');

export const selectProgramConfigs = createSelector(
    selectProgramConfigState,
    (state) => state.programConfigs
);
export const selectIsConfigLoaded = createSelector(
    selectProgramConfigs,
    (programConfigs) => !!programConfigs && programConfigs.length > 0
);

export const selectSystemInfoState = createFeatureSelector<SystemInfoState>('systemInfo');
export const selectSystemInfo = createSelector(
    selectSystemInfoState,
    (state)=> state.systemInfo
)


export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectIsLoggedIn = createSelector(
    selectAuthState,
    (state) => state.isLoggedIn
);

export const selectAuthToken = createSelector(
    selectAuthState,
    (state) => state.token
);

export const selectAuthError = createSelector(
    selectAuthState,
    (state) => state.error
);
