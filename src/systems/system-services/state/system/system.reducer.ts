import { createReducer, on } from '@ngrx/store';
import {loginFailure, loginSuccess, logoutAction, systemActions} from './system.action';
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



export interface AuthState {
    token: string | null;
    isLoggedIn: boolean;
    error: any;
}

export const initialAuthState: AuthState = {
    token: null,
    isLoggedIn: false,
    error: null,
};

export const authReducer = createReducer(
    initialAuthState,

    on(loginSuccess, (state, { token }) => ({
        ...state,
        token,
        isLoggedIn: true,
        error: null,
    })),

    on(loginFailure, (state, { error }) => ({
        ...state,
        error,
    })),

    on(logoutAction, () => initialAuthState)
);
