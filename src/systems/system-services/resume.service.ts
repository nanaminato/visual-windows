import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerService} from './server.service';
import {WindowManagerService} from './windows-manager.service';
import {ResumableSession} from '../programs/terminal/models';

@Injectable({
    providedIn: 'root',
})
export class ResumeService {
    private windowManagerService = inject(WindowManagerService);
    constructor(private http: HttpClient, private serverService: ServerService) {

    }
    async start(){
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
