// screenshot.selectors.ts

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ScreenshotState } from './screenshot.state';

// 假设在模块注册的时候 slice name 是 'screenshots'
export const selectScreenshotState =
    createFeatureSelector<ScreenshotState>('screenshots');

export const selectScreenshotByWindowId = (windowId: string) =>
    createSelector(
        selectScreenshotState,
        (state) => state[windowId] || null
    );

export const selectAllScreenshots = createSelector(
    selectScreenshotState,
    (state) => state
);
