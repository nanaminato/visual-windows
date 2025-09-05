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

    on(WindowActions.focusWindow, (state, { id }) => {
        const focusedWindow = state.windows.find(w => w.id === id);
        if (!focusedWindow) {
            return state;
        }

        // 1. 初始化激活ID集合，使用Set避免重复
        const activeIds = new Set<string>();
        activeIds.add(id);

        // 2. 递归查找所有子窗口
        let added: boolean;
        do {
            added = false;
            for (const w of state.windows) {
                if (w.parentId && activeIds.has(w.parentId) && !activeIds.has(w.id)) {
                    activeIds.add(w.id);
                    added = true;
                }
            }
        } while (added);

        // 3. 更新窗口状态
        const newWindows = state.windows.map(w => {
            if (activeIds.has(w.id)) {
                // 激活窗口及其所有子孙窗口，取消最小化
                return { ...w, active: true, minimized: false };
            } else {
                // 其他窗口非激活，保持最小化状态不变
                return { ...w, active: false };
            }
        });

        return {
            ...state,
            windows: newWindows
        };
    }),

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
    })),
    on(WindowActions.setWindowDisabled, (state, { id, disabled }) => {
        return {
            ...state,
            windows: state.windows.map(win =>
                win.id === id ? { ...win, disabled } : win
            )
        };
    }),
    on(WindowActions.closeWindow, (state, { id, parentId }) => {
        // 移除当前窗口
        let windows = state.windows.filter(w => w.id !== id);
        if (parentId) {
            windows = windows.map(w =>
                w.id === parentId ? { ...w, disabled: false } : w
            );
        }

        return {
            ...state,
            windows
        };
    }),
);
