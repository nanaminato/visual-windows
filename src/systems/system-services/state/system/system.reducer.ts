import { createReducer, on } from '@ngrx/store';
import {systemActions} from './system.action';
import {ProgramConfig, SystemInfo} from '../../../models';
export interface ProgramConfigState{
    programConfigs: ProgramConfig[] | undefined;
}

export interface SystemInfoState{
    systemInfo: SystemInfo | undefined;
}
export const programConfigInitialState:  ProgramConfigState= {
    programConfigs: undefined,
};
export const systemInfoInitialState: SystemInfoState = {
    systemInfo: undefined
}

export const programConfigReducer = createReducer(
    programConfigInitialState,
    on(systemActions.configLoadSuccess, (state, { programConfigs }) => ({
        ...state,
        programConfigs,
    })),
    on(systemActions.configLoadError, (state, { error }) => ({
        ...state,
    })),
);
export const systemInfoReducer = createReducer(
    systemInfoInitialState,
    on(systemActions.systemInfoLoadSuccess, (_state, { systemInfo }) => ({
        systemInfo: systemInfo,
    })),
    on(systemActions.systemInfoLoadError, (state, { error }) => ({
        ...state,
    })),
);
