import {Component, ElementRef, HostListener, inject, Input, ViewChild} from '@angular/core';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import {HttpClient} from '@angular/common/http';
import {TerminalSession} from './models';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ClipboardAddon} from "@xterm/addon-clipboard"
import { ImageAddon } from "@xterm/addon-image"
import { Unicode11Addon} from "@xterm/addon-unicode11"
import {ServerService} from '../../system-services/impl/server.service';
@Component({
  selector: 'app-terminal',
  imports: [],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css'
})
export class TerminalComponent {
    private serverService = inject(ServerService);
    @Input()
    sessionId?: string | undefined;
    private socket: WebSocket | undefined;
    private xterm: Terminal | undefined;
    @ViewChild('terminalContainer', { static: true })
    terminalContainer!: ElementRef<HTMLDivElement> | undefined;
    private http = inject(HttpClient);
    fitAddon!: FitAddon | undefined;
    ngOnInit()  {
        this.xterm = new Terminal({
            allowProposedApi: true,
            cursorBlink: true,
        });
        this.fitAddon = new FitAddon();
        this.xterm.loadAddon(this.fitAddon);
        this.xterm.loadAddon(new WebLinksAddon());
        this.xterm.loadAddon(new ClipboardAddon());
        this.xterm.loadAddon(new ImageAddon());
        this.xterm.loadAddon(new Unicode11Addon());

        if(this.terminalContainer) {
            this.xterm.open(this.terminalContainer.nativeElement);
            const el = this.terminalContainer.nativeElement.querySelector('.terminal.xterm');
            if (el && el instanceof HTMLElement) {
                el.style.width = '100%';
                el.style.height = '100%';
                // el.style.display = 'flex';
                // el.style.flexDirection = 'column';
            }

            this.fitAddon.fit();

            // 监听父容器大小变化，自动调整终端大小
            const resizeObserver = new ResizeObserver(() => {
                if(this.fitAddon) {
                    this.fitAddon.fit();
                }
            });
            resizeObserver.observe(this.terminalContainer.nativeElement);
            if (!this.sessionId) {
                // 调用后端创建新终端
                this.createTerminalSession().then(terminalSession => this.connectWebSocket(terminalSession.id));
            } else {
                this.connectWebSocket(this.sessionId!);
            }
        }
    }
    private connectWebSocket(sessionId: string) {
        // this.socket = new WebSocket(`wss://localhost:7100/api/v1/terminal/${sessionId}`);
        this.socket = new WebSocket(`${this.serverService.getWebSocketBase()}/api/v1/terminal/${sessionId}`);
        this.sessionId = sessionId;
        if(this.xterm) {
            this.socket.onmessage = (event) => {
                this.xterm!.write(event.data);
            };
            this.xterm!.onData(data => {
                console.log('Input data:', data, data.charCodeAt(0));
                this.socket?.send(data);
            });
        }
    }
    createTerminalSession() {
        // let url = "https://localhost:7100/api/v1/terminal/";
        let url = `${this.serverService.getServerBase()}/api/v1/terminal/`;
        return new Promise<TerminalSession>((resolve,reject) => {
            let subscription = this.http.post<TerminalSession>(url,{}).subscribe({
                next: (sessionId: TerminalSession) => {
                    resolve(sessionId);
                    console.log(sessionId);
                    subscription.unsubscribe();
                },
                error: (err) => {
                    reject(err);
                    subscription.unsubscribe();
                }
            });
            return () => subscription.unsubscribe();
        })
    }
    closeTerminal() {
        if(!this.sessionId) {
            return Promise.resolve(); // 没有sessionId时，返回一个立即resolve的Promise，避免await阻塞
        }
        let url = `${this.serverService.getServerBase()}/api/v1/terminal/${this.sessionId}`;
        return new Promise((resolve,reject) => {
            let subscription = this.http.delete(url,{}).subscribe({
                next: () => {
                    subscription.unsubscribe();
                    resolve({});  // 这里必须调用resolve
                    // alert("Terminal session closed successfully."+this.sessionId);
                },
                error: (err) => {
                    reject(err);
                    subscription.unsubscribe();
                }
            });
            // 这里return的函数是unsubscribe的清理函数，通常不需要return
        });
    }

    async parentClosed(){
        // console.log("try to close");
        await this.closeTerminal();
    }
    ngOnDestroy() {
        this.socket?.close();
    }



}
