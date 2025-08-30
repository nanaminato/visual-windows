import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {ProgramConfig, SystemInfo} from '../../../models';

export const systemActions = createActionGroup({
    source: "system init",
    events: {
        "config init": emptyProps(),
        "config load success": props<{ programConfigs: ProgramConfig[] | undefined }>(),
        "config load error": props<{ error: unknown }>(),
        "system info init": emptyProps(),
        "system info load success": props<{ systemInfo: SystemInfo | undefined }>(),
        "system info load error": props<{ error: unknown }>(),
    }
});

