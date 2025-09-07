import {Component, inject} from '@angular/core';
import {Routable} from '../../systems/system-lives/routerable/routerable';
import {systemActions} from '../../systems/system-services/state/system/system.action';
import {Store} from '@ngrx/store';

@Component({
  selector: 'app-system-guard',
  imports: [],
  templateUrl: './system-guard.html',
  styleUrl: './system-guard.css'
})
export class SystemGuard extends Routable {
    private store = inject(Store);
    override navigates = [
        {
            path: '',
            loadComponent: () => import('../login/login')
                .then(c=>c.Login),
        },
        {
            path: 'login',
            loadComponent: () => import('../login/login')
                .then(c=>c.Login),
        },
        {
            path: 'logged',
            loadComponent: () => import('../visual-window')
                .then(c=>c.VisualWindow),
        }
    ]
    ngOnInit() {
        this.store.dispatch(systemActions.systemInfoInit())
        this.store.dispatch(systemActions.configInit())
    }
}
