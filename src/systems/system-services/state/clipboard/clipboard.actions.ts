import {createActionGroup, emptyProps, props} from '@ngrx/store';

export const ClipboardActions = createActionGroup({
    source: 'Clipboard',
    events: {
        'Copy Files': props<{ files: string[] }>(),
        'Cut Files': props<{ files: string[] }>(),
        'Paste Files': emptyProps(),
        'Delete Files': emptyProps(),
        'Clear Clipboard': emptyProps(),
    }
});
