import { createReducer, on } from '@ngrx/store';
import {WindowState} from '../../../models';
import {WindowActions} from './window.actions';

export interface WindowStateSlice {
    windows: WindowState[];
}

export const initialState: WindowStateSlice = {
    windows: []
};

export const windowReducer = createReducer(
    initialState,
    on(WindowActions.openWindowSuccess, (state, { window }) => {
        const updatedWindows = state.windows.map(w => ({ ...w, active: false }));
        return {
            ...state,
            windows: [...updatedWindows, window]
        };
    }),
    on(WindowActions.closeWindow, (state, { id }) => ({
        ...state,
        windows: state.windows.filter(w => w.id !== id)
    })),
    on(WindowActions.focusWindow, (state, { id }) => ({
        ...state,
        windows: state.windows.map(w => ({
            ...w,
            active: w.id === id,
            minimized: w.id === id ? false : w.minimized
        }))
    })),
    on(WindowActions.minimizeWindow, (state, { id }) => ({
        ...state,
        windows: state.windows.map(w =>
            w.id === id ? { ...w, minimized: true, active: false } : w
        )
    })),
    on(WindowActions.maximizeWindow, (state, { id, desktopWidth, desktopHeight, taskbarHeight }) => ({
        ...state,
        windows: state.windows.map(w => {
            if (w.id === id) {
                if (!w.maximized) {
                    return {
                        ...w,
                        prevPosition: { ...w.position },
                        prevSize: { ...w.size },
                        position: { x: 0, y: 0 },
                        size: { width: desktopWidth, height: desktopHeight - taskbarHeight },
                        minimized: false,
                        active: true,
                        maximized: true
                    };
                } else {
                    return {
                        ...w,
                        position: w.prevPosition || w.position,
                        size: w.prevSize || w.size,
                        minimized: false,
                        active: true,
                        maximized: false,
                        prevPosition: undefined,
                        prevSize: undefined
                    };
                }
            }
            return w;
        })
    })),
    on(WindowActions.updateWindows, (state, { windows }) => ({
        ...state,
        windows
    }))
);
