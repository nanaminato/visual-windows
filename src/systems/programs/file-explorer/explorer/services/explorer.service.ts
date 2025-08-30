import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DriverInfo, EasyFolder} from '../models';
import {LightFile} from '../models';
import {ServerService} from '../../../../system-services/server.service';

@Injectable({
    providedIn: 'root'
})
export class ExplorerService{
    private serverService = inject(ServerService);
    constructor(private http: HttpClient) {

    }
    getSpecialFolder(): Promise<Map<string, string|undefined>>{
        return new Promise((resolve, reject) => {
            this.http.get<Map<string, string|undefined>>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/special-roots`).subscribe(
                {
                    next: (value: any) => {
                        let result = new Map<string, string | undefined>(Object.entries(value));
                        resolve(result);
                    },
                    error: err=> {
                        reject(err);
                    }
                }
            )
        })
    }
    getDisks(): Promise<string[]>{
        return new Promise((resolve, reject) => {
            this.http.get<string[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/roots`).subscribe(
                {
                    next: (value:string[]) => {
                        resolve(value);
                    },
                    error: err=> {
                        reject(err);
                    }
                }
            )
        })
    }
    getChildrenFolder(path: string): Promise<EasyFolder[]>{
        return new Promise((resolve, reject) => {
            this.http.post<EasyFolder[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/child-folders`, {
                path: path,
            }).subscribe(
                {
                    next: (value:EasyFolder[]) => {
                        resolve(value);
                    },
                    error: err=> {
                        reject(err);
                    }
                }
            )
        })
    }
    getFiles(path: string): Promise<LightFile[]>{
        return new Promise((resolve, reject) => {
            this.http.post<LightFile[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/entries`, {
                path: path,
            }).subscribe(
                {
                    next: (value:LightFile[]) => {
                        resolve(value);
                    },
                    error: err=> {
                        reject(err);
                    },
                }
            )
        })
    }
    getDriverInfos(): Promise<DriverInfo[]>{
        return new Promise((resolve, reject) => {
            this.http.get<DriverInfo[]>
            (`${this.serverService.getServerBase()}/api/v1/fileSystem/drivers`).subscribe(
                {
                    next: (value:DriverInfo[]) => {
                        resolve(value);
                    },
                    error: err=> {
                        reject(err);
                    },
                }
            )
        })
    }
}
