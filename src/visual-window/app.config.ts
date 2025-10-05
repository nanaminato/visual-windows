import {
    ApplicationConfig,
    isDevMode,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideAnimations, provideNoopAnimations} from '@angular/platform-browser/animations';
import {NgxMonacoEditorConfig, provideMonacoEditor} from 'ngx-monaco-editor-v2';
import { provideStore } from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {SystemEffects} from '../systems/system-services/state/system/system-effects.service';
import {windowReducer} from '../systems/system-services/state/window/window.reducer';
import {WindowEffects} from '../systems/system-services/state/window/window.effects';
import {
    authReducer,
    programConfigReducer,
    systemInfoReducer
} from '../systems/system-services/state/system/system.reducer';
import {jwtInterceptor} from '../systems/system-services/jwt.interceptor';
import {ResumeEffects} from '../systems/system-services/state/resume/ResumeEffects';
import {screenshotReducer} from '../systems/system-services/state/window/screenshot/screenshot.reducer';
import {ScreenshotEffect} from '../systems/system-services/state/window/screenshot/screenshot.effect';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {FileOperationEffects} from '../systems/system-services/state/file-opertation/file-operation.effects';

export const monacoConfig: NgxMonacoEditorConfig = {
    baseUrl: window.location.origin + "/assets/monaco/min/vs",
    defaultOptions: { scrollBeyondLastLine: false },
    onMonacoLoad: () => {
        // console.log((<any>window).monaco);
    }, // here monaco object will be available as window.monaco use this function to extend monaco editor functionalities.
    requireConfig: { preferScriptTags: true }, // allows to override configuration passed to monacos loader
    monacoRequire: (<any>window).monacoRequire // pass here monacos require function if you loaded monacos loader (loader.js) yourself
};

export const appConfig: ApplicationConfig = {
    providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideNoopAnimations(),
    provideAnimations(),
    provideMonacoEditor(monacoConfig),
    provideStore({
        "programConfig": programConfigReducer,
        "window": windowReducer,
        "systemInfo": systemInfoReducer,
        "screenshots": screenshotReducer,
        auth: authReducer,
    },{
        runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false,
        }
    }),
        provideStoreDevtools({
            maxAge: 25, // Retains last 25 states
            logOnly: !isDevMode(), // Restrict extension to log-only mode
            autoPause: true, // Pauses recording actions and state changes when the extension window is not open
            trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
            traceLimit: 75, // maximum stack trace frames to be stored (in case trace option was provided as true)
            connectInZone: true // If set to true, the connection is established within the Angular zone
        }),
    provideEffects(SystemEffects, WindowEffects, ResumeEffects, ScreenshotEffect, FileOperationEffects),

]
};
