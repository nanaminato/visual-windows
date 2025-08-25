import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ServerService} from '../../../system-services/impl/server.service';
import {OpenFile} from '../models/open-file';

@Injectable({
    providedIn: 'root',
})
export class CodeService{
    private http: HttpClient = inject(HttpClient);
    private serverService: ServerService = inject(ServerService);
    getCode(path: string): Promise<OpenFile> {
        return new Promise((resolve, reject) => {
            let subscription = this.http.post<OpenFile>
            (`${this.serverService.getServerBase()}/api/v1/code`,{path}).subscribe(
                {
                    next: (value: OpenFile) => {
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
    saveCode(openFile: OpenFile): Promise<any> {
        return new Promise((resolve, reject) => {
            let subscription = this.http.post
            (`${this.serverService.getServerBase()}/api/v1/save`,openFile).subscribe(
                {
                    next: (value: any) => {
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
