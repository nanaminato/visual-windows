import {createReducer, on} from '@ngrx/store';
import {WindowState} from '../../../models';
import {WindowActions} from './window.actions';

export interface WindowStateSlice {
    windows: WindowState[];
    lastFocusedWindowId?: string;  // 新增字段
}

export const initialState: WindowStateSlice = {
    windows: []
};

export const windowReducer = createReducer(
    initialState,
    on(WindowActions.openWindowSuccess, (state, {window}) => {
        const updatedWindows = state.windows.map(w => ({...w, active: false}));
        return {
            ...state,
            windows: [...updatedWindows, window]
        };
    }),

    on(WindowActions.focusWindow, (state, {id}) => {

        const focusedWindow = state.windows.find(w => w.id === id);
        if (!focusedWindow) {
            return state;
        }
        if (state.lastFocusedWindowId === id && !focusedWindow.minimized) {
            // console.log("focus not")
            return state;
        }
        // if (state.lastFocusedWindowId === id && focusedWindow.minimized) {
        //     // console.log("focus not")
        //     return state;
        // }

        const activeIds = new Set<string>();
        activeIds.add(id);

        let added: boolean;
        do {
            added = false;
            for (const w of state.windows) {
                if (w.parentId && w.modal) {
                    if (focusedWindow.modal) {
                        // 模态窗口激活子激活父
                        if (activeIds.has(w.id) && !activeIds.has(w.parentId)) {
                            activeIds.add(w.parentId);
                            added = true;
                        }
                    } else {
                        // 非模态窗口激活父激活子
                        if (activeIds.has(w.parentId) && !activeIds.has(w.id)) {
                            activeIds.add(w.id);
                            added = true;
                        }
                    }
                }
            }
        } while (added);


        const updatedWindows = state.windows.map(w => {
            if (activeIds.has(w.id)) {
                // console.log('active '+id)
                return {...w, active: true, minimized: false};
            } else {
                return {...w, active: false};
            }
        });

        const notActiveWindows =
            updatedWindows.filter(w => !activeIds.has(w.id));
        // 保持原有的顺序，拿出 activeIds 的窗口
        const activeWindows = updatedWindows.filter(w => activeIds.has(w.id));

        const newWindowsOrder = [...notActiveWindows, ...activeWindows];
        return {
            ...state,
            windows: newWindowsOrder,
            lastFocusedWindowId: id
        };
    }),

    on(WindowActions.minimizeWindow, (state, {id}) => {
        const getAllChildIds = (parentId: string): string[] => {
            const directChildren = state.windows.filter(w => w.parentId === parentId);
            let result: string[] = [];
            for (const child of directChildren) {
                result.push(child.id);
                result = result.concat(getAllChildIds(child.id));
            }
            return result;
        };

        const minimizeIds = [id].concat(getAllChildIds(id));

        return {
            ...state,
            windows: state.windows.map(w =>
                minimizeIds.includes(w.id)
                    ? {...w, minimized: true, active: false}
                    : w
            )
        };
    }),
    on(WindowActions.maximizeWindow, (state, {id, desktopWidth, desktopHeight, taskbarHeight}) => ({
        ...state,
        windows: state.windows.map(w => {
            if (w.id === id) {
                if (!w.maximized) {
                    return {
                        ...w,
                        prevPosition: {...w.position},
                        prevSize: {...w.size},
                        position: {x: 0, y: 0},
                        size: {width: desktopWidth, height: desktopHeight - taskbarHeight},
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
    on(WindowActions.updateWindows, (state, {windows}) => ({
        ...state,
        windows
    })),
    on(WindowActions.setWindowDisabled, (state, {id, disabled}) => {
        return {
            ...state,
            windows: state.windows.map(win =>
                win.id === id ? {...win, disabled} : win
            )
        };
    }),
    on(WindowActions.closeWindowSuccess, (state, { windows }) => ({
        ...state,
        windows
    })),

);
