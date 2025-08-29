import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {NgxMonacoEditorConfig, provideMonacoEditor} from 'ngx-monaco-editor-v2';
import { provideStore } from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {programConfigReducer} from '../systems/system-services/state/program-config/program-config.reducer';
import {ProgramConfigEffects} from '../systems/system-services/state/program-config/program-config.effects';
import {windowReducer} from '../systems/system-services/state/window/window.reducer';

export const monacoConfig: NgxMonacoEditorConfig = {
    baseUrl: window.location.origin + "/assets/monaco/min/vs",
    defaultOptions: { scrollBeyondLastLine: false },
    onMonacoLoad: () => { console.log((<any>window).monaco); }, // here monaco object will be available as window.monaco use this function to extend monaco editor functionalities.
    requireConfig: { preferScriptTags: true }, // allows to oweride configuration passed to monacos loader
    monacoRequire: (<any>window).monacoRequire // pass here monacos require function if you loaded monacos loader (loader.js) yourself
};

export const appConfig: ApplicationConfig = {
    providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideNoopAnimations(),
    provideMonacoEditor(monacoConfig),
    provideStore({
        "programConfig": programConfigReducer,
        "window": windowReducer,
    },{
        runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false,
        }
    }),
    provideEffects(ProgramConfigEffects),
]
};
