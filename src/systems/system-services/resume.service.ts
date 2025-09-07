import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerService} from './server.service';
import {ResumableSession} from '../programs/terminal/models';
import {WindowActions} from './state/window/window.actions';
import {Store} from '@ngrx/store';
import {terminalProgram} from '../programs/models/register-app';

@Injectable({
    providedIn: 'root',
})
export class ResumeService {
    constructor(private http: HttpClient, private serverService: ServerService) {

    }
    async start(){
        await this.resumeTerminals();
    }
    private store$ = inject(Store);
    async resumeTerminals(){
        let resumableSession = await this.getResumableTerminals();
        for(let sessionId of resumableSession.terminals){
            this.store$.dispatch(
                WindowActions.openWindow(
                { id: terminalProgram, title: "终端", params: {sessionId: sessionId} }
            ))

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
