import { createReducer, on } from '@ngrx/store';
import {ProgramConfig} from '../../models';
import {programConfigActions} from './program-config.action';

export interface ProgramConfigState {
    programConfigs: ProgramConfig[] | undefined;
    loading: boolean;
    error: unknown | null;
}

export const initialState: ProgramConfigState = {
    programConfigs: undefined,
    loading: false,
    error: null,
};

export const programConfigReducer = createReducer(
    initialState,
    on(programConfigActions.init, (state) => ({
        ...state,
        loading: true,
        error: null,
    })),
    on(programConfigActions.loadSuccess, (state, { programConfigs }) => ({
        ...state,
        programConfigs,
        loading: false,
        error: null,
    })),
    on(programConfigActions.loadError, (state, { error }) => ({
        ...state,
        loading: false,
        error,
    }))
);
