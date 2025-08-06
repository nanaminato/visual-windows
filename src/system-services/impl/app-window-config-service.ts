import {Injectable} from '@angular/core';
import {AppWindowConfig} from '../window-manager.service';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AppWindowConfigService{
  private baseUrl = 'http://localhost:5111/api/v1/AppWindowConfig';

  constructor(private http: HttpClient,
               ) { }

  getAllInstalledApps(): Promise<AppWindowConfig[] | undefined> {
    return new Promise((resolve, reject) => {
      let subscription = this.http.get<AppWindowConfig[] | undefined>
      (`${this.baseUrl}/installed-apps`).subscribe(
        value => {
          resolve(value);
          subscription.unsubscribe();
        },
        err => {
          reject(err);
          subscription.unsubscribe();
        }
      )
      return ()=>subscription.unsubscribe();
    })
  }
}
