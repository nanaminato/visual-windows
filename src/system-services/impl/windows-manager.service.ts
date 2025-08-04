import {WindowState} from '../window-manager.service';
import {BehaviorSubject} from 'rxjs';
import {Injectable} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WindowManagerService {
  private windows$ = new BehaviorSubject<WindowState[]>([]);

  getWindows() {
    return this.windows$.asObservable();
  }

  openWindow(appId: string, title: string): string {
    const id = Math.random().toString(36).substr(2, 9);
    const newWindow: WindowState = {
      id,
      appId,
      title,
      position: { x: 100, y: 100 },
      size: { width: 600, height: 400 },
      minimized: false,
      maximized: false,
      active: true,
    };
    const current = this.windows$.value.map(w => ({ ...w, active: false }));
    this.windows$.next([...current, newWindow]);
    return id;
  }

  closeWindow(id: string) {
    const filtered = this.windows$.value.filter(w => w.id !== id);
    this.windows$.next(filtered);
  }

  focusWindow(id: string) {
    const updated = this.windows$.value.map(w => ({
      ...w,
      active: w.id === id,
      minimized: w.id === id ? false : w.minimized,
    }));
    this.windows$.next(updated);
  }

  minimizeWindow(id: string) {
    const updated = this.windows$.value.map(w =>
      w.id === id ? { ...w, minimized: true, active: false } : w
    );
    this.windows$.next(updated);
  }
}
