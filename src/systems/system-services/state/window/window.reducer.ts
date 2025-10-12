import {createReducer, on} from '@ngrx/store';
import {WindowState} from '../../../models';
import {WindowActions} from './window.actions';

export interface WindowStateSlice {
    windows: WindowState[];
    lastFocusedWindowId?: string;  // 新增字段
    activeOrder: string[];
}

export const initialState: WindowStateSlice = {
    windows: [],
    activeOrder: [],
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

    on(WindowActions.focusWindow, (state, { id }) => {
        const focusedWindow = state.windows.find(w => w.id === id);
        if (!focusedWindow) return state;
        if (state.lastFocusedWindowId === id && !focusedWindow.minimized) {
            return state;
        }

        // 计算活跃窗口集合（自身及模态相关窗口）激活逻辑保持一致
        const activeIds = new Set<string>();
        activeIds.add(id);

        let added: boolean;
        do {
            added = false;
            for (const w of state.windows) {
                if (w.parentId && w.modal) {
                    if (focusedWindow.modal) {
                        if (activeIds.has(w.id) && !activeIds.has(w.parentId)) {
                            activeIds.add(w.parentId);
                            added = true;
                        }
                    } else {
                        if (activeIds.has(w.parentId) && !activeIds.has(w.id)) {
                            activeIds.add(w.id);
                            added = true;
                        }
                    }
                }
            }
        } while (added);

        // 更新所有窗口 active/minimized 状态
        const updatedWindows = state.windows.map(w => {
            if (activeIds.has(w.id)) {
                return { ...w, active: true, minimized: false };
            } else {
                return { ...w, active: false };
            }
        });

        // 计算新的激活顺序 activeOrder
        // 保留之前不活跃窗口激活顺序，然后把这次活跃窗口按先后顺序放到最后
        // 但注意要去重且最近活跃的排在最后（top层）
        let newActiveOrder = state.activeOrder.filter(idInList => !activeIds.has(idInList));
        // 按 windows 原顺序加入新激活窗口顺序，保证顺序稳定
        const newlyActivated = updatedWindows
            .filter(w => activeIds.has(w.id))
            .map(w => w.id);

        newActiveOrder = [...newActiveOrder, ...newlyActivated];

        // 去重保证数组内唯一
        newActiveOrder = Array.from(new Set(newActiveOrder));

        return {
            ...state,
            windows: updatedWindows,
            lastFocusedWindowId: id,
            activeOrder: newActiveOrder,
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
                        position: {left: 0, top: 0},
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
