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
    getWebSocketBase(){
        if(serverEnvironment.protocol==="https"){
            return `wss://${serverEnvironment.baseUrl}`;
        }
        return `ws://${serverEnvironment.baseUrl}`;
    }
}
