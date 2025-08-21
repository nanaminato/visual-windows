import {inject, Injectable} from '@angular/core';
import {ServerService} from '../../../../system-services/impl/server.service';
import {HttpClient} from '@angular/common/http';
import {DriverInfo, EasyFolder} from '../models';
import {LightFile} from '../models';

@Injectable({
    providedIn: 'root'
})
export class ExplorerService{
    private serverService = inject(ServerService);
    constructor(private http: HttpClient) {

    }
    getSpecialFolder(): Promise<Map<string, string|undefined>>{
        return new Promise((resolve, reject) => {
            let subscription = this.http.get<Map<string, string|undefined>>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/special-roots`).subscribe(
                {
                    next: (value: any) => {
                        let result = new Map<string, string | undefined>(Object.entries(value));
                        resolve(result);
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
    getDisks(): Promise<string[]>{
        return new Promise((resolve, reject) => {
            let subscription = this.http.get<string[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/roots`).subscribe(
                {
                    next: (value:string[]) => {
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
    getChildrenFolder(path: string): Promise<EasyFolder[]>{
        return new Promise((resolve, reject) => {
            let subscription = this.http.post<EasyFolder[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/child-folders`, {
                path: path,
            }).subscribe(
                {
                    next: (value:EasyFolder[]) => {
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
    getFiles(path: string): Promise<LightFile[]>{
        return new Promise((resolve, reject) => {
            let subscription = this.http.post<LightFile[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/entries`, {
                path: path,
            }).subscribe(
                {
                    next: (value:LightFile[]) => {
                        resolve(value);
                        subscription.unsubscribe();
                    },
                    error: err=> {
                        reject(err);
                        subscription.unsubscribe();
                    },
                }
            )
            return ()=>subscription.unsubscribe();
        })
    }
    getDriverInfos(): Promise<DriverInfo[]>{
        return new Promise((resolve, reject) => {
            let subscription = this.http.get<DriverInfo[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/drivers`).subscribe(
                {
                    next: (value:DriverInfo[]) => {
                        resolve(value);
                        subscription.unsubscribe();
                    },
                    error: err=> {
                        reject(err);
                        subscription.unsubscribe();
                    },
                }
            )
            return ()=>subscription.unsubscribe();
        })
    }
}
