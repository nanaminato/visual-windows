// screenshot.actions.ts

import { createAction, props } from '@ngrx/store';

export const addScreenshot = createAction(
    '[Screenshot] Add Screenshot',
    props<{ windowId: string; screenshot: string }>()
);

export const updateScreenshot = createAction(
    '[Screenshot] Update Screenshot',
    props<{ windowId: string; screenshot: string }>()
);

export const deleteScreenshot = createAction(
    '[Screenshot] Delete Screenshot',
    props<{ windowId: string }>()
);
