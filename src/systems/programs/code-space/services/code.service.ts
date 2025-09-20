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
        // atob得到的是Latin1编码的二进制字符串，需要转成Uint8Array
        const binaryStr = atob(value.content);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }

        // 用TextDecoder解码成UTF-8字符串
        const decoder = new TextDecoder('utf-8');
        value.decodeText = decoder.decode(bytes);
        return value;
    }

    saveCode(openFile: OpenFile): Promise<any> {
        let file = {...openFile};
        // 将 decodeText（UTF-8 字符串）转换成 Uint8Array（字节数组）
        const encoder = new TextEncoder();
        const bytes = encoder.encode(openFile.decodeText || '');

        // 把 Uint8Array 转回二进制字符串
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }

        // 对二进制字符串进行 Base64 编码
        file.content = btoa(binary);

        file.decodeText = undefined;
        return new Promise((resolve, reject) => {
            this.http.post
            (`${this.serverService.getServerBase()}/api/v1/code/save`,file).subscribe(
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
