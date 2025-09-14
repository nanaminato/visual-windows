import {createActionGroup, props} from '@ngrx/store';
import {WindowState} from '../../../models';


export const WindowActions = createActionGroup({
    source: 'Window',
    events: {
        'open window': props<{id: string,title: string, params?: any, x?: number,y?: number, parentId?: string; modal?: boolean, closeWithParent?: boolean }>(),
        'open window success': props<{id: string, window: WindowState }>(),
        'close window': props<{ id: string }>(),
        'close window success': props<{ id: string; windows: WindowState[] }>(),
        'hover windows': props<{ programId: string }>(),
        'focus window': props<{ id: string }>(),
        'lost focus window': props<{ id: string }>(),
        'minimize window': props<{ id: string }>(),
        'maximize window': props<{ id: string; desktopWidth: number; desktopHeight: number; taskbarHeight: number }>(),
        'update windows': props<{ windows: WindowState[] }>(),
        'set window disabled': props<{ id: string; disabled: boolean }>(),
        'window loaded': props<{ id: string }>(),
    }
});
