import {createActionGroup, props} from '@ngrx/store';
import {OpenModel} from '../models';

export const CodeSpaceOpenAction = createActionGroup({
    source: "Code Space",
    events: {
        "Open": props<OpenModel>,
    }
})
