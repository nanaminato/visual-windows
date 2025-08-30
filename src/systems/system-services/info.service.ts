import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {ServerService} from './server.service';
import {SystemInfo} from '../models';
import {firstValueFrom} from 'rxjs';
import {selectSystemInfo} from './state/system/system.selector';
import {NzMessageService} from 'ng-zorro-antd/message';
import {Store} from '@ngrx/store';

@Injectable({
    providedIn: 'root',
})
export class SystemInfoService{
    private serverService = inject(ServerService);
    private http: HttpClient = inject(HttpClient);
    private messageService = inject(NzMessageService);
    private store = inject(Store)
    fetchSystemInfo(){
        return this.http.get<SystemInfo>
        (`${this.serverService.getServerBase()}/api/v1/systemInfo`);
    }
    public async isLinuxAsync(): Promise<boolean> {
        const info = await firstValueFrom(this.store.select(selectSystemInfo));
        // console.log(info);
        if (!info) {
            this.messageService.error("系统配置还没有加载");
            return false;
        }
        return !info.platform.toLowerCase().startsWith("window");
    }
}
