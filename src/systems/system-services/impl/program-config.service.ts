import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerService} from './server.service';
import {ProgramConfig} from '../../models';

@Injectable({
    providedIn: 'root',
})
export class ProgramConfigService {
    private apiEndPoint = 'api/v1/programConfig';
    private serverService = inject(ServerService);
    constructor(private http: HttpClient,
    ) { }

    getAllInstalledApps(): Promise<ProgramConfig[] | undefined> {
        // console.log('Getting all apps');
        return new Promise((resolve, reject) => {
            let subscription = this.http.get<ProgramConfig[] | undefined>
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
