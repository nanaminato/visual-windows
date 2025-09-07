import {Component, inject} from '@angular/core';
import {Reachable} from '../../systems/system-lives/routerable/reachable';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {ServerService} from '../../systems/system-services/server.service';
import {catchError, map, Observable, of} from 'rxjs';

@Component({
  selector: 'app-login',
    imports: [
        FormsModule
    ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login extends Reachable {
    private http = inject(HttpClient);
    private serverService: ServerService = inject(ServerService);

    username = '';
    password = '';
    errorMessage = '';

    ngOnInit() {
        this.tryAutoLogin();
    }

    tryAutoLogin() {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            this.checkTokenValidity(token).subscribe({
                next: valid => {
                    if (valid) {
                        this.noticePath('logged');
                    } else {
                        localStorage.removeItem('jwt_token');
                    }
                },
                error: () => {
                    localStorage.removeItem('jwt_token');
                }
            });
        }
    }

    checkTokenValidity(token: string): Observable<boolean> {
        // 设置请求头 Authorization: Bearer <token>
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        return this.http.post(`${this.serverService.getServerBase()}/api/token/check`, {}, { headers, observe: 'response' }).pipe(
            map(response => response.status === 200),
            catchError(() => of(false))
        );
    }

    login() {
        this.errorMessage = '';
        if (!this.username || !this.password) {
            this.errorMessage = '请输入用户名和密码';
            return;
        }

        this.http.post<{ token: string, id: string, role: string }>(`${this.serverService.getServerBase()}/api/auth/login`, {
            username: this.username,
            password: this.password
        }).subscribe({
            next: res => {
                localStorage.setItem('jwt_token', res.token);
                this.noticePath('logged');
            },
            error: err => {
                this.errorMessage = '登录失败，用户名或密码错误';
            }
        });
    }
}
