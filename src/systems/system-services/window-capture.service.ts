import {Injectable} from '@angular/core';
import html2canvas from 'html2canvas';

@Injectable({
    providedIn: 'root'
})
export class WindowCaptureService{
    takeScreenshot(id: string): Promise<string | null> {
        const element = document.getElementById(id);
        if (!element) {
            console.error('截图失败，找不到元素', id);
            return Promise.resolve(null);
        }

        return html2canvas(element).then(canvas => {
            return canvas.toDataURL('image/png');
        }).catch(err => {
            console.error('截图失败', err);
            return null;
        });
    }
}
