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
@Component({
  selector: 'app-terminal',
  imports: [],
  templateUrl: './terminal.component.html',
  styleUrl: './terminal.component.css'
})
export class TerminalComponent {
    @Input()
    params: { sessionId?: string } | undefined;
    private socket: WebSocket | undefined;
    private xterm: Terminal | undefined;
    @ViewChild('terminalContainer', { static: true })
    terminalContainer!: ElementRef<HTMLDivElement> | undefined;
    private http = inject(HttpClient);
    fitAddon!: FitAddon | undefined;
    ngAfterContentInit() {
        this.xterm = new Terminal({
            allowProposedApi: true,
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
            if (!this.params) {
                // 调用后端创建新终端
                this.createTerminalSession().then(terminalSession => this.connectWebSocket(terminalSession.id));
            } else {
                this.connectWebSocket(this.params!.sessionId!);
            }
        }
    }
    private connectWebSocket(sessionId: string) {
        this.socket = new WebSocket(`ws://localhost:5111/api/v1/terminal/${sessionId}`);
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
        return new Promise<TerminalSession>((resolve,reject) => {
            let subscription = this.http.post<TerminalSession>("http://localhost:5111/api/v1/terminal/",{}).subscribe({
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


    ngOnDestroy() {
        this.socket?.close();
    }
    // myfit(){
    //     if(this.xterm && this.terminalContainer &&this.fitAddon) {
    //         this.xterm!.open(this.terminalContainer!.nativeElement);
    //         this.fitAddon!.fit();
    //     }
    // }
    // xtermVisible: boolean = true;
    // public fit(){
    //     this.xtermVisible = false;
    //     setTimeout(() => {
    //         this.xtermVisible = true;
    //         this.fitAddon!.fit();
    //     },20)
    //     // this.fitAddon?.fit();
    //     // console.log("trying to fit");
    //     // this.myfit();
    // }

}
