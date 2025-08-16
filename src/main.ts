import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './visual-window/app.config';
import {VisualWindow} from './visual-window/visual-window';

bootstrapApplication(VisualWindow, appConfig)
  .catch((err) => console.error(err));
