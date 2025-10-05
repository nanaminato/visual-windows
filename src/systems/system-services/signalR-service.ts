import {Injectable, NgZone} from '@angular/core';
import {HubConnection, HubConnectionBuilder} from '@microsoft/signalr';
import {FileOperationProgress} from './models';
import {FileOperationError} from './models/file-operation/operation-error';

@Injectable({
    providedIn: 'root',
})
export class SignalRService {
    private hubConnection: HubConnection | undefined;
    private progressHandlers: ((data: FileOperationProgress) => void)[] = [];
    private errorHandlers: ((data: FileOperationError) => void)[] = [];
    private completedHandlers: ((data: { operationId: string }) => void)[] = [];
    private cancelledHandlers: ((data: { operationId: string }) => void)[] = [];

    constructor(private ngZone: NgZone) {}

    public startConnection() {
        this.hubConnection = new HubConnectionBuilder()
            .withUrl('/fileOperationsHub')
            .withAutomaticReconnect()
            .build();

        this.hubConnection
            .start()
            .then(() => {
                console.log('SignalR connected');
                this.registerListeners();
            })
            .catch(err => console.error('SignalR connection error: ', err));
    }

    private registerListeners() {
        this.hubConnection!.on('FileOperationProgress', (data: FileOperationProgress) => {
            this.ngZone.run(() => {
                this.progressHandlers.forEach(h => h(data));
            });
        });
        this.hubConnection!.on('FileOperationCompleted', (data: { operationId: string }) => {
            this.ngZone.run(() => {
                this.completedHandlers.forEach(h => h(data));
            });
        });
        this.hubConnection!.on('FileOperationError', (data: FileOperationError) => {
            this.ngZone.run(() => {
                this.errorHandlers.forEach(h => h(data));
            });
        });
        this.hubConnection!.on('FileOperationCancelled', (data: { operationId: string }) => {
            this.ngZone.run(() => {
                this.cancelledHandlers.forEach(h => h(data));
            });
        });
    }
    // FileOperationEffects  /state/file-operation/file-operation.effects.ts
    public onProgress(handler: (data: FileOperationProgress) => void) {
        this.progressHandlers.push(handler);
    }

    public onError(handler: (data: FileOperationError) => void) {
        this.errorHandlers.push(handler);
    }

    public onCompleted(handler: (data: { operationId: string }) => void) {
        this.completedHandlers.push(handler);
    }

    public onCancelled(handler: (data: { operationId: string }) => void) {
        this.cancelledHandlers.push(handler);
    }
}
