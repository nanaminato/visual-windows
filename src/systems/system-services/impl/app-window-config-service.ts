import {inject, Injectable} from '@angular/core';
import {AppWindowConfig} from '../window-manager.service';
import {HttpClient} from '@angular/common/http';
import {ServerService} from './server.service';

@Injectable({
    providedIn: 'root',
})
export class AppWindowConfigService{
    // private baseUrl = 'http://localhost:5111/api/v1/AppWindowConfig';
    private apiEndPoint = 'api/v1/AppWindowConfig';
    private serverService = inject(ServerService);
    constructor(private http: HttpClient,
    ) { }

    getAllInstalledApps(): Promise<AppWindowConfig[] | undefined> {
        console.log('Getting all apps');
        // console.log(serverEnvironment);
        return new Promise((resolve, reject) => {
            let subscription = this.http.get<AppWindowConfig[] | undefined>
            (`${this.serverService.getServerBase()}/${this.apiEndPoint}/installed-apps`).subscribe(
                {
                    next: value => {
                        resolve(value);
                        subscription.unsubscribe();
                    },
                    error: err=> {
                        reject(err);
                        subscription.unsubscribe();
                    }
                }
            )
            return ()=>subscription.unsubscribe();
        })
    }
}
