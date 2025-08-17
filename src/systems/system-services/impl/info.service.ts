import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {SystemInfo} from '../../models';
import {ServerService} from './server.service';
import {NzMessageService} from 'ng-zorro-antd/message';

@Injectable({
    providedIn: 'root',
})
export class SystemInfoService{

    public info: SystemInfo|undefined = undefined;
    private serverService = inject(ServerService);
    public ready: Promise<void>;
    constructor(private http: HttpClient, private messageService: NzMessageService) {
        this.ready = this.fetchSystemInfo()
            .then(info => {
                this.info = info;
            })
            .catch(err => {
                this.messageService.error("系统配置加载失败");
                // 这里可以根据需求决定是否抛错或继续
            });
    }
    public async getInfo(){
        await this.ready;
        return this.info!;
    }
    private fetchSystemInfo(): Promise<SystemInfo> {
        return new Promise((resolve, reject) => {
            let subscription = this.http.get<SystemInfo>
            (`${this.serverService.getServerBase()}/api/v1/systemInfo`).subscribe(
                {
                    next: (value: SystemInfo) => {
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
    public async isLinuxAsync(): Promise<boolean> {
        await this.ready;
        if (!this.info) {
            this.messageService.error("系统配置还没有加载");
            return false;
        }
        return !this.info.platform.toLowerCase().startsWith("window");
    }

}
