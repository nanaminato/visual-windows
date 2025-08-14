import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerService} from './server.service';
import {ResumableSession} from '../../apps/terminal/models';
import {WindowManagerService} from './windows-manager.service';
import {AppManagerService} from './app-manager.service';

@Injectable({
    providedIn: 'root',
})
export class ResumeService {
    private managerService = inject(AppManagerService);
    private windowManagerService = inject(WindowManagerService);
    constructor(private http: HttpClient, private serverService: ServerService) {

    }
    async start(){
        await this.managerService.loadAppConfigs();
        await this.resumeTerminals();
    }
    async resumeTerminals(){
        let resumableSession = await this.getResumableTerminals();
        for(let sessionId of resumableSession.terminals){
            await this.windowManagerService.openWindow("terminal", "终端", {
                sessionId: sessionId
            })
        }
    }
    getResumableTerminals(): Promise<ResumableSession>{
        return new Promise((resolve, reject) => {
            let subscription = this.http.get<ResumableSession>
            (`${this.serverService.getServerBase()}/api/v1/resume/terminals`).subscribe(
                {
                    next: (value: ResumableSession) => {
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
