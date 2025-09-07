import {Component, inject, signal} from '@angular/core';
import { DesktopManager } from '../systems/system-lives/desktop-manager/desktop-manager';
import { DesktopBar } from '../systems/system-lives/desktop-bar/desktop-bar';
import {Store} from '@ngrx/store';
import {logoutAction, systemActions} from '../systems/system-services/state/system/system.action';
import {Reachable} from '../systems/system-lives/routerable/reachable';
import {Subscription} from 'rxjs';
import {Actions, ofType} from '@ngrx/effects';

@Component({
  selector: 'visual-window',
  imports: [
    DesktopBar,
    DesktopManager,
  ],
  providers: [
  ],
  templateUrl: './visual-window.html',
  styleUrl: './visual-window.css'
})
export class VisualWindow extends Reachable{
    protected readonly title = signal('VisualWindows');
    private actionsSub: Subscription;

    constructor(private actions$: Actions) {
        super();

        this.actionsSub = this.actions$.pipe(
            ofType(logoutAction)
        ).subscribe(() => {
            localStorage.removeItem('jwt_token');
            this.noticePath('login');
        });
    }

    ngOnDestroy() {
        this.actionsSub.unsubscribe();
    }
}
