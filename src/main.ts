import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './visual-window/app.config';
import {SystemGuard} from './visual-window/system-guard/system-guard';

bootstrapApplication(SystemGuard, appConfig)
  .catch((err) => console.error(err));
