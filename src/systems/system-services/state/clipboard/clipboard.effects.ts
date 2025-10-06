import {inject, Injectable} from '@angular/core';
import { Actions} from '@ngrx/effects';

@Injectable()
export class ClipboardEffects {
    private actions$: Actions = inject(Actions);
}
