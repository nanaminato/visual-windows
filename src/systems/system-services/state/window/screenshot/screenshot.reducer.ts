// screenshot.reducer.ts

import { createReducer, on } from '@ngrx/store';
import * as ScreenshotActions from './screenshot.actions';
import { ScreenshotState, initialScreenshotState } from './screenshot.state';

export const screenshotReducer = createReducer(
    initialScreenshotState,

    on(ScreenshotActions.addScreenshot, (state, { windowId, screenshot }) => {
        if (state[windowId]) {
            // 如果已经存在截图，直接返回，不覆盖
            return state;
        }
        return {
            ...state,
            [windowId]: screenshot
        };
    }),

    on(ScreenshotActions.updateScreenshot, (state, { windowId, screenshot }) => {
        if (!state[windowId]) {
            // 如果截图不存在，不能更新，直接返回state
            return state;
        }
        console.log(screenshot);
        return {
            ...state,
            [windowId]: screenshot
        };
    }),

    on(ScreenshotActions.deleteScreenshot, (state, { windowId }) => {
        if (!state[windowId]) {
            return state;
        }
        const newState = { ...state };
        delete newState[windowId];
        return newState;
    })
);
