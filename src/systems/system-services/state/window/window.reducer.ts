import { createReducer, on } from '@ngrx/store';
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
        if (state.lastFocusedWindowId === id && !focusedWindow.minimized) {
            return state;
        }

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
                return { ...w, active: true, minimized: false };
            } else {
                return { ...w, active: false };
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

    on(WindowActions.minimizeWindow, (state, { id }) => {
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
                    ? { ...w, minimized: true, active: false }
                    : w
            )
        };
    }),
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
    on(WindowActions.closeWindow, (state, { id }) => {
        const closedWindow = state.windows.find(w => w.id === id);
        if (!closedWindow) {
            return state;
        }

        // 递归查找所有需要关闭的子窗口ID，只有 closeWithParent === true 的子窗口才关闭
        const getChildWindowsToClose = (fatherId: string, windows: WindowState[]): string[] => {
            // 1. 找出所有直接子窗口，且这些子窗口的 closeWithParent === true
            const directChildren = windows.filter(w => w.parentId === fatherId && w.closeWithParent);

            // 2. 初始化一个数组，用来收集所有符合条件的子窗口ID
            let allChildrenIds: string[] = [];

            // 3. 遍历每个直接子窗口
            for (const child of directChildren) {
                // 3.1 把当前子窗口ID加入结果数组
                allChildrenIds.push(child.id);

                // 3.2 递归调用，查找该子窗口的子窗口（孙窗口）
                //     并把递归结果合并到结果数组中
                allChildrenIds = allChildrenIds.concat(getChildWindowsToClose(child.id, windows));
            }

            // 4. 返回所有找到的子孙窗口ID
            return allChildrenIds;
        };

        // 关闭的窗口ID列表，包含自身和符合条件的子孙窗口
        const closeWindowIds = [id].concat(getChildWindowsToClose(id, state.windows));

        // 过滤掉所有要关闭的窗口
        let windows = state.windows.filter(w => !closeWindowIds.includes(w.id));

        // 如果关闭的是 modal 子窗口，解除父窗口禁用状态
        if (closedWindow.parentId && closedWindow.modal) {
            windows = windows.map(w =>
                w.id === closedWindow.parentId ? { ...w, disabled: false } : w
            );
        }

        return {
            ...state,
            windows
        };
    }),
);
