import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerService} from '../../../system-services/server.service';
import {OpenFile} from '../models';
import {firstValueFrom} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CodeService{
    private http: HttpClient = inject(HttpClient);
    private serverService: ServerService = inject(ServerService);
    async getCode(path: string): Promise<OpenFile> {
        const value = await firstValueFrom(
            this.http.post<OpenFile>(`${this.serverService.getServerBase()}/api/v1/code/open`, { path })
        );
        value.content = atob(value.content);
        return value;
    }

    saveCode(openFile: OpenFile): Promise<any> {
        return new Promise((resolve, reject) => {
            this.http.post
            (`${this.serverService.getServerBase()}/api/v1/code/save`,openFile).subscribe(
                {
                    next: (value: any) => {
                        resolve(value);
                    },
                    error: err=> {
                        reject(err);
                    }
                }
            )
        })
    }
}
