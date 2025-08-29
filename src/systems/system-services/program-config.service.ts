import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerService} from './server.service';
import {ProgramConfig} from '../models';

@Injectable({
    providedIn: 'root',
})
export class ProgramConfigService {
    private apiEndPoint = 'api/v1/programConfig';
    private serverService = inject(ServerService);
    constructor(private http: HttpClient,
    ) { }

    getAllInstalledApps() {
        return this.http.get<ProgramConfig[] | undefined>
        (`${this.serverService.getServerBase()}/${this.apiEndPoint}/installed-apps`);
    }
}
