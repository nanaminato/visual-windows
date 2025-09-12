import {Injectable} from '@angular/core';
import {serverEnvironment} from '../../environments/environment';

@Injectable({
    providedIn: "root",
})
export class ServerService {
    getServerBase(){
        if(serverEnvironment.production){
            return '';
        }
        return `${serverEnvironment.protocol}://${serverEnvironment.baseUrl}`;
    }
    getWebSocketBase() {
        if (serverEnvironment.production) {
            const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
            return `${protocol}://${window.location.host}`;
        }
        return `ws://${serverEnvironment.baseUrl}`;
    }

}
