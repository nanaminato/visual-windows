import { createActionGroup, props, emptyProps } from '@ngrx/store';

export const NodesActions = createActionGroup({
    source: '[Nodes]',
    events: {
        'Set Node Value': props<{ key: string; value: any }>(),
        'Update Node Value': props<{ key: string; value: Partial<any> }>(),
        'Remove Node Value': props<{ key: string }>(),
        'Clear All Nodes': emptyProps()
    }
});
