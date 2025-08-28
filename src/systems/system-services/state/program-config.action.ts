import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {ProgramConfig} from '../../models';

export const programConfigActions = createActionGroup({
    source: "program config",
    events: {
        "init": emptyProps(),  // 或者 props<{}>()
        "load success": props<{ programConfigs: ProgramConfig[] | undefined }>(),
        "load error": props<{ error: unknown }>()
    }
});

