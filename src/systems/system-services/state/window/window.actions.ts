import {createActionGroup, props} from '@ngrx/store';
import {WindowState} from '../../../models';


export const WindowActions = createActionGroup({
    source: 'Window',
    events: {
        'open window': props<{id: string,title: string, params?: any}>(),
        'open window success': props<{ window: WindowState }>(),
        'close window': props<{ id: string }>(),
        'focus window': props<{ id: string }>(),
        'minimize window': props<{ id: string }>(),
        'maximize window': props<{ id: string; desktopWidth: number; desktopHeight: number; taskbarHeight: number }>(),
        'update windows': props<{ windows: WindowState[] }>(),
    }
});
