import {HttpRequest, HttpEvent, HttpHandlerFn} from '@angular/common/http';
import { Observable } from 'rxjs';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('jwt_token');
    if (token) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    }
    return next(req);
}
