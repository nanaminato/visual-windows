import {Component, inject} from '@angular/core';
import {HttpClient, HttpHeaders, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {ServerService} from '../../systems/system-services/server.service';
import {map, Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {loginFailure, loginSuccess} from '../../systems/system-services/state/system/system.action';
import {Reachable} from '../../systems/feature/routerable/reachable';

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
    private store = inject(Store);

    username = '';
    password = '';
    errorMessage = '';
    showPassword: boolean = false;

    ngOnInit() {
        this.tryAutoLogin();
    }

    tryAutoLogin() {
        const token = localStorage.getItem('jwt_token');
        if (!token) return;

        this.checkTokenValidity(token).subscribe({
            next: (valid) => {
                if (valid) {
                    // token 有效 -> 登入成功
                    this.store.dispatch(loginSuccess({ token }));
                    this.noticePath('logged');
                } else {
                    // 如果后端以 200 返回但标记为无效（极少见），仍清除 token
                    localStorage.removeItem('jwt_token');
                    this.errorMessage = '自动登录失败：令牌无效，请重新登录';
                }
            },
            error: (err: HttpErrorResponse) => {
                // 区分错误类型
                if (err.status === 401 || err.status === 403) {
                    // token 无效（认证错误） -> 自动登录失败，清除 token
                    localStorage.removeItem('jwt_token');
                    this.errorMessage = '自动登录失败：令牌无效，请重新登录';
                } else if (err.status === 0) {
                    // 网络或跨域等问题（没有 HTTP 状态码）
                    this.errorMessage = '无法连接到服务器，请检查网络或服务器地址';
                    // 不清除 token（保留它）
                } else {
                    // 其他服务器错误
                    const serverMsg = err.error?.message || err.message || '服务器错误';
                    this.errorMessage = `自动登录失败：${serverMsg}`;
                    // 不清除 token（除非你希望在某些错误下清除）
                }
            }
        });
    }

    checkTokenValidity(token: string): Observable<boolean> {
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
        });

        // 不在这里 catchError -> 让错误向上抛出，以便在 tryAutoLogin 中区分错误类型
        return this.http
            .post(`${this.serverService.getServerBase()}/api/token/check`, {}, { headers, observe: 'response' })
            .pipe(
                map((response: HttpResponse<any>) => response.status === 200)
            );
    }

    login() {
        this.errorMessage = '';
        if (!this.username || !this.password) {
            this.errorMessage = '请输入用户名和密码';
            return;
        }

        this.http
            .post<{ token: string; id: string; role: string }>(`${this.serverService.getServerBase()}/api/auth/login`, {
                username: this.username,
                password: this.password,
            })
            .subscribe({
                next: (res) => {
                    localStorage.setItem('jwt_token', res.token);
                    this.store.dispatch(loginSuccess({ token: res.token }));
                    this.noticePath('logged');
                },
                error: (err: HttpErrorResponse) => {
                    // 认证错误（用户名/密码错误）
                    if (err.status === 401 || err.status === 403) {
                        this.errorMessage = '用户名或密码错误';
                        // 不清空 token（如你要求）
                    } else if (err.status === 0) {
                        // 网络/连接问题
                        this.errorMessage = '无法连接到服务器，请检查网络或服务器地址';
                    } else {
                        // 其他服务端返回的消息
                        const serverMsg = err.error?.message || err.message || '服务器错误';
                        this.errorMessage = `登录失败：${serverMsg}`;
                    }

                    this.store.dispatch(loginFailure({ error: err }));
                },
            });
    }
}
